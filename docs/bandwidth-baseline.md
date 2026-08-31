# Bandwidth & Cached Egress Baseline Measurement Report

**Date of Measurement:** 2026-08-31
**Environment:** Production Live System (Render Web Services, Supabase PostgreSQL, Supabase S3 Object Storage)

---

## 1. Current Storage & Architecture Profile

* **Database Engine:** Supabase PostgreSQL Pooler (`aws-0-ap-southeast-1.pooler.supabase.com`)
* **Storage Provider:** Supabase Storage (`masajid-uploads` bucket)
* **Backend Runtime:** NestJS (Node.js v20+ on Render)
* **Mobile Client:** Flutter (Dio + CachedNetworkImage)
* **Admin Dashboard:** React SPA (Vite + TanStack React Query + Axios)

---

## 2. Baseline Measurements (Measured Directly on Live Infrastructure)

| Metric | Measured Value | Notes |
|---|---|---|
| **Total Live Projects in Database** | 1 | Real project created via Admin Dashboard |
| **Total Stored Images** | 2 | Stored in Supabase Storage (`media/`) |
| **Average Image Size (Uncompressed)** | 47.65 KB | (24.7 KB Cover + 70.6 KB Gallery) |
| **Largest Stored Image** | 70.60 KB (70,604 bytes) | Raw JPG upload |
| **Public Projects List API Response (`GET /api/projects`)** | 1,745 bytes | Returns full project object including description and all image records |
| **Single Project Details API Response (`GET /api/projects/:id`)** | 1,701 bytes | Includes detailed updates and images |
| **Bank Accounts List API Response (`GET /api/bank-accounts`)** | 1,592 bytes | |
| **HTTP Compression (Gzip/Brotli) on NestJS API** | ❌ None | `compression` middleware not yet attached |
| **HTTP Cache-Control Headers on Static Media/API** | ❌ None | Missing `max-age`, `immutable`, or `ETag` validation |
| **Image Resizing / WebP Compression Pipeline** | ❌ None | Raw original format uploaded directly without thumbnail/medium variants |
| **Receipt Protection** | ⚠️ Publicly exposed in static directory | Stored under public storage path |
| **Search Debouncing in Mobile / Admin** | ⚠️ Incomplete | Triggers immediate filter upon single key change |

---

## 3. Estimated Egress Consumption per Screen (Baseline)

* **Home Screen Load (1 Project):**
  - API call: ~1.75 KB
  - Cover Image download: ~24.7 KB
  - **Total Baseline Home Transfer:** ~26.45 KB per visit (Without client caching: repeated on every refresh)

* **Project Details Screen Load (Cover + 1 Gallery Image):**
  - Details API call: ~1.70 KB
  - Cover Image (if uncached): ~24.7 KB
  - Gallery Image (uncached): ~70.6 KB
  - **Total Baseline Details Transfer:** ~97.0 KB

---

## 4. Target Optimization Goals

1. **Image Compression & WebP Variants:**
   - Convert all uploads to WebP automatically.
   - Generate `thumbnail` (350px, ~8-15KB) for Cards and `medium` (800px, ~30-40KB) for Details.
   - Reduce image egress by **>60%**.
2. **HTTP Cache Headers & Compression:**
   - Enable Gzip compression across all JSON responses (reducing JSON transfer by ~65%).
   - Attach `Cache-Control: public, max-age=31536000, immutable` to immutable image assets.
   - Implement ETag validation for bank accounts and dynamic lists.
3. **API Response Trimming (Sparse Fieldsets):**
   - Trim `GET /api/projects` to return only list summary fields (`thumbnailUrl`, `id`, `mosqueName`, `title`, `governorate`, `fundingPercentage`, `shares`).
4. **Client Caching & Deduplication:**
   - Configure Riverpod provider caching in Flutter with stale-while-revalidate and avoid repeated refetches on widget rebuilds.
   - Configure TanStack Query in React Admin with `staleTime: 5 * 60 * 1000` (5 minutes) for bank accounts and statistics.
5. **Private Receipt Handling:**
   - Protect bank receipts from public indexing/downloads; serve via authenticated admin endpoints only.
