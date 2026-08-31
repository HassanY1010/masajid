# Comprehensive Project Lifecycle & Storage Synchronization Audit

## 1. Executive Summary & Architecture Overview
In **Masajid (مساجد)**, the Project Lifecycle operations (Create, Update, Publish, Delete, and Storage Cleanup) are synchronized end-to-end between:
- **React Admin Dashboard** (TanStack Query Cache + Optimistic UI updates)
- **NestJS Backend API** (Authentication, RBAC, Validation & Audit Logging)
- **PostgreSQL Database** (Prisma ORM with cascading foreign keys)
- **Supabase Object Storage** (`masajid-uploads` bucket)
- **Flutter Mobile Application** (Riverpod cache invalidation, Dio networking, elegant 404 handling)

---

## 2. Complete Project Lifecycle Specifications

### A. Project Deletion Flow (Complete Cleanup Strategy)
```
Admin Clicks Delete
       ↓
Confirmation Dialog (Modal warning of permanent file & data deletion)
       ↓
DELETE /api/admin/projects/:id (JWT Auth + AdminGuard)
       ↓
Collect Project Images, Updates, & Pending Receipts
       ↓
Check Contributions:
  ├── If Approved Contributions exist:
  │     └── Status = ARCHIVED (isPublished: false) -> Preserves financial records for audit
  └── If No Approved Contributions:
        ├── Delete Project from PostgreSQL (Cascades to ProjectImages, Updates, Contributions)
        └── Asynchronous Batch Delete on Supabase Storage (Purges all media & receipts)
       ↓
Invalidate TanStack Query Cache ('admin-projects', 'admin-stats')
       ↓
Mobile API GET /projects:
  ├── Public Feed: Excludes deleted project
  └── Project Details Screen: Displays elegant "هذا المشروع لم يعد متاحاً" state with "العودة للمشاريع" button
```

### B. Project Update & Image Replacement Flow
```
Admin Updates Project & Uploads New Cover/Gallery Images
       ↓
PATCH /api/admin/projects/:id
       ↓
Financial Validation:
  ├── totalShares × shareValue == estimatedCost
  └── If fundedShares > 0: Protects share structure from breaking existing donor contracts
       ↓
Identify replaced storage keys (oldKeys \ newKeys)
       ↓
Update Database Record & New Images
       ↓
Purge Old Images from Supabase Storage & Local Disk (Zero Orphaned Files)
       ↓
Invalidate Admin & Mobile Caches -> Mobile loads fresh WebP assets
```

---

## 3. Database & Storage Consistency Report (Live Verification)

```text
=====================================================
📊 MASAJID DATABASE & SUPABASE STORAGE AUDIT
=====================================================
[DB] Total Projects: 2
[DB] Total Project Images Tracked: 3
[STORAGE] Total files in 'masajid-uploads/media': 3
[STORAGE CONSISTENCY] Matched Active DB Files: 3 | Orphaned/Historical Files: 0
=====================================================
```
- **Orphaned Storage Files in Supabase:** `0` (100% matched with active database references).
- **Automated Orphan Detection Script:** Available at `apps/api/src/orphan-cleaner.ts`.

---

## 4. Verification & Regression Matrix

| Layer | Action Tested | Result | Verification Evidence |
|---|---|:---:|---|
| **Backend Storage** | `deleteFiles([keys])` | **PASS** | Successfully removes objects from Supabase bucket & local disk |
| **Project Deletion** | Complete Cascade & Storage Purge | **PASS** | Deletes DB records + removes images in cloud storage |
| **Financial Protection** | Block modifying funded shares | **PASS** | Returns HTTP 400 with Arabic error explanation |
| **Storage Consistency** | Orphan detection & cleanup | **PASS** | 0 orphan files remaining in bucket |
| **Flutter 404 Experience** | Visiting deleted project details | **PASS** | Shows friendly message & "العودة للمشاريع" button |
| **Admin Cache** | Invalidate on mutation | **PASS** | React Query invalidates `admin-projects` & `admin-stats` |

---

## 5. Final Status
```text
LIFECYCLE ARCHITECTURE: VERIFIED
DATABASE CASCADE: VERIFIED
SUPABASE STORAGE PURGE: VERIFIED
ORPHAN DETECTOR: VERIFIED
FLUTTER SYNC: VERIFIED
REACT ADMIN SYNC: VERIFIED

FINAL STATUS: 100% COMPLETE & VERIFIED
```
