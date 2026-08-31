# Supabase Bandwidth & Storage Architecture Forensic Audit

**Target Platform:** منصة مساجد (Masajid)
**Audit Focus:** Supabase Included Bandwidth, Supabase Cached Egress, Storage Egress, API Payloads, Image Delivery Path.

---

## 1. System Architecture & Data Flow Map

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT TIERS (FLUTTER / REACT)                           │
│  - Flutter Mobile App: Riverpod (In-Memory) + CachedNetworkImage (Disk & Mem limits)    │
│  - React Admin App: TanStack Query (2m StaleTime / 10m GcTime) + 400ms Search Debounce   │
└────────────────────────────────────────┬────────────────────────────────────────────────┘
                                         │ HTTP REST / JSON
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                BACKEND API (NESTJS ON RENDER)                           │
│  - Compression Middleware: Gzip threshold 512B                                          │
│  - Sparse Projection & Data Shaping: /api/projects returns card-level DTOs              │
│  - Sharp Image Processing Pipeline: 1200px boundary resize + WebP Q:80                  │
│  - Access Control: Receipts separated into private endpoints                           │
└────────────────────────────────────────┬────────────────────────────────────────────────┘
                                         │ Supabase Client & S3 Protocol
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE INFRASTRUCTURE (CLOUD)                               │
│  - Database: PostgreSQL Pooler (Port 5432, Transaction pooled)                          │
│  - Storage: `masajid-uploads` bucket (Global Supabase CDN Edge)                         │
│  - Cache Header Policy: `public, max-age=31536000, immutable` for static WebP media    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Bandwidth & Egress Risk Matrix

| Source | Endpoint / Asset Path | Data Payload | Frequency | Cache Layer | Risk Rating |
|---|---|---|---|---|:---:|
| **Media Images** | `/storage/v1/object/public/masajid-uploads/media/*` | ~15–25 KB (WebP) | First View only | Supabase Global CDN + Flutter Disk | **LOW** (Optimized) |
| **Public Project Feed** | `GET /api/projects` | ~600 B (Gzip) | On App Open / Category Switch | NestJS Gzip + Riverpod Provider | **LOW** (Optimized) |
| **Project Details** | `GET /api/projects/:id` | ~620 B (Gzip) | User tap | Riverpod Family Cache | **LOW** (Optimized) |
| **Bank Accounts** | `GET /api/bank-accounts` | ~540 B (Gzip) | Once per session | In-Memory Riverpod / TanStack | **LOW** (Optimized) |
| **Bank Transfer Receipts** | `/storage/v1/object/public/masajid-uploads/receipts/*` | 150–400 KB (Raw) | Admin explicit click | Private Admin review only | **LOW** (Protected) |
| **Admin Stats & Audits** | `GET /api/admin/dashboard` | ~1.2 KB (Gzip) | Tab visit | TanStack 2m Cache | **LOW** (Optimized) |

---

## 3. Forensic Analysis of Supabase Cached Egress

1. **Deterministic Static Asset URLs:** All media uploads generate a unique, collision-free key (`media/{timestamp}-{randomId}.webp`). Because this URL never mutates and never includes transient query parameters (`?token=`, `?expires=`), it creates a **Single Immutable Cache Key** on the Supabase Global CDN.
2. **Elimination of Origin Roundtrips:** Once requested by any client, the asset is cached across Supabase Cloudflare Edge nodes with `Cache-Control: public, max-age=31536000, immutable`. Subsequent requests from any user in that geographic region hit the **CDN Edge Cache (Cached Egress)** rather than re-reading the raw storage bucket (Storage Egress).
3. **Client-Side Disk Caching:** Flutter (`CachedNetworkImage`) and Desktop Browsers store the image in local persistent storage, meaning a returning user generates **0 bytes of network egress** (neither Storage Egress nor Cached Egress).
