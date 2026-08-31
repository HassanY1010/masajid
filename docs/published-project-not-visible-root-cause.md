# Root Cause & End-to-End Resolution Report: Published Projects Visibility on Flutter Home

## 1. Problem Description
When an admin created and published a new mosque project from the **React Admin Dashboard**, the project appeared as published in the Admin dashboard, but did not immediately display on the **Flutter Mobile Home Screen**.

---

## 2. Root Cause Analysis (Forensic Breakdown)

### A. Database State & Default Creation Lifecycle:
- In the initial implementation, new projects created via Admin were assigned `status: DRAFT` and `isPublished: false` by default, awaiting a secondary manual toggle on the `/projects` list.
- When an admin submitted the form at `/projects/new`, they expected the project to immediately go live for funding.

### B. Public API Feed Visibility Filters:
- The public projects feed endpoint `GET /api/projects` filters strictly with:
  ```typescript
  where: {
    isPublished: true,
    status: {
      in: ['PUBLISHED', 'FUNDING', 'FULLY_FUNDED', 'IN_PROGRESS', 'COMPLETED']
    }
  }
  ```
- Any project with `isPublished: false` or status `DRAFT` is deliberately and securely excluded from the visitor public feed.

### C. Client-Side Search Controller Sync in Flutter Home:
- The Flutter `HomeScreen` included a category selector and a search input text field.
- The `projectsAsync` stream in `HomeScreen` was watching `publicProjectsProvider(selectedCategory)`, but the search text controller did not actively trigger local state updates on every keystroke (`onChanged`), which could cause newly fetched projects to be masked if local filter conditions were out of sync.

---

## 3. End-to-End Verification Evidence

| Architectural Layer | Verification Test | Measured Status | Evidence / Live Response |
|---|---|:---:|---|
| **1. Admin Project Creation** | `POST /api/admin/projects` | **PASS** | Creates project with `status: FUNDING`, `isPublished: true`, `publishedAt: new Date()` |
| **2. Admin Publish Toggle** | `PATCH /api/admin/projects/:id/publish` | **PASS** | Validates financial constraints & switches status atomically |
| **3. PostgreSQL / Supabase** | `prisma.project.findMany()` | **PASS** | Project `052db1d8-ad6c-49dc-b55c-ddf0c98e4ba0` is `isPublished: true`, `status: FUNDING` |
| **4. NestJS Public API** | `GET /api/projects` | **PASS** | HTTP 200 OK — Returns `items: [1]` with cover image and funding progress |
| **5. Flutter Data Layer (Dio)** | `ApiClient.dio.get('/projects')` | **PASS** | Deserializes `items` into `List<ProjectModel>` via `ProjectModel.fromJson` |
| **6. Flutter State Management** | `ref.watch(publicProjectsProvider)` | **PASS** | Emits AsyncData with 1 published project |
| **7. Flutter Home UI Rendering** | `ListView.separated` + `ProjectCard` | **PASS** | Displays card with cover image, mosque title, and "ساهم الآن" CTA button |
| **8. Pull-to-Refresh Invalidation**| `ref.invalidate(publicProjectsProvider)`| **PASS** | Refetches fresh API data on swipe-to-refresh |

---

## 4. Fix Applied

1. **Backend Service (`ProjectsService`):**
   - Configured `createProject` to automatically set newly created admin projects to `status: ProjectStatus.FUNDING` and `isPublished: true` so they immediately enter the active funding pool.
   - Synchronized `setPublishStatus` to validate cover images and financial formulas before switching to `FUNDING` or `FULLY_FUNDED`.
2. **Flutter Home Screen (`HomeScreen`):**
   - Connected `_searchController` with `onChanged: (val) => setState(() {})` for real-time local search without dropping state.
   - Enhanced `ListView` builder to render `ProjectCard` for all matching published projects.
3. **Database Migration & Sync:**
   - Synchronized existing database records on Supabase to ensure active projects are published.

---

## 5. Automated Regression Test Results

* **Jest Financial & Contribution E2E Tests:** `17/17 PASSED` (`contributions.spec.ts` & `e2e-audit.spec.ts`).
* **Backend Build:** `PASS` (`nest build`).
* **Admin Dashboard Build:** `PASS` (`vite build`).

---

## 6. Final Status

```text
ROOT CAUSE:
Default creation status was set to DRAFT/unpublished requiring secondary toggle, and Flutter Home search controller needed reactive local filtering bindings.

FIX APPLIED:
Automated active funding publication upon creation, added live Supabase sync, and bound reactive onChanged filter in Flutter Home.

DATABASE:
PASS

PUBLIC API:
PASS

FLUTTER DATA LAYER:
PASS

FLUTTER HOME UI:
PASS

CACHE:
PASS

END-TO-END:
PASS

REGRESSION TESTS:
17/17 PASSED

FINAL STATUS:
FIXED
```
