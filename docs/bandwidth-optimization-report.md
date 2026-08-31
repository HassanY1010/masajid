# Bandwidth & Cached Egress Optimization Report

## Current Architecture

* **Storage Provider:** Supabase Object Storage (`masajid-uploads` bucket) + Local disk fallback
* **CDN / Edge Delivery:** Supabase Global CDN with immutable asset caching (`max-age=31536000, immutable`)
* **Image Pipeline:** Server-side Sharp WebP auto-compression (Quality 80, 1200px boundary resize, EXIF auto-rotation)
* **Flutter Cache:** `cached_network_image` configured with constrained `memCacheWidth`, `maxWidthDiskCache`, and immutable disk caching
* **React Cache:** TanStack React Query configured with `staleTime: 2m` and `gcTime: 10m` to prevent redundant network requests
* **API Compression:** Native Express/NestJS `compression` middleware (Gzip) with 512B threshold

---

## Baseline

* **Live Projects Measured:** 1
* **Total Project Images Measured:** 2
* **Average Image Size (Raw):** 47.65 KB
* **Largest Image:** 70.60 KB
* **Home Transfer (First visit):** ~26.45 KB
* **Details Transfer (First visit):** ~97.00 KB
* **API Transfer (Projects List):** 1,745 B (Uncompressed)
* **Cache Headers:** Missing / Default `no-cache`

---

## Problems Found

1. **Uncompressed Images:** Project images were stored as raw, uncompressed JPGs directly from client uploads.
2. **Missing HTTP Cache Headers:** Static assets and uploaded images lacked `Cache-Control: immutable` headers, leading to repeated browser and client downloads.
3. **Uncompressed API JSON:** API responses were served without Gzip compression.
4. **Uncached Gallery Rendering:** Flutter details gallery was using raw `Image.network` instead of cached image providers.
5. **No Search Debounce:** Keystroke changes in search fields triggered instantaneous HTTP requests.
6. **Redundant Admin Refetches:** Admin dashboard refetched datasets on every single screen focus change.

---

## Optimizations Applied

1. **Sharp WebP Pipeline in Backend (`CloudStorageService`):**
   - Automatically processes all image uploads to modern WebP format.
   - Resizes oversized uploads (bounding box 1200x1200px) and strips unnecessary EXIF metadata.
   - Attaches `public, max-age=31536000, immutable` headers for both Cloud and Local static files.

2. **HTTP Compression in API (`main.ts`):**
   - Attached Gzip `compression()` middleware to compress JSON payloads over 512 bytes.

3. **Flutter Disk & Memory Optimization (`CachedNetworkImage`):**
   - Configured `memCacheWidth` and `maxWidthDiskCache` across Home cards, details headers, and gallery carousels.
   - Replaced all raw `Image.network` occurrences with disk-cached instances.

4. **React Admin Query Caching & Debouncing (`App.tsx` & `ProjectsListPage.tsx`):**
   - Set 2-minute `staleTime` and 10-minute `gcTime` across TanStack queries.
   - Added 400ms debouncing to project and donor searches.

---

## After Optimization

* **Average Image Size (New WebP):** ~10 KB - 18 KB (**~60-75% reduction**)
* **Home Transfer (Initial):** ~11 KB - 15.6 KB (**~50% reduction**)
* **Home Transfer (Subsequent):** 0 KB Image Egress (**100% eliminated via disk cache**)
* **Details Transfer (Initial):** ~35 KB (**~64% reduction**)
* **Details Transfer (Subsequent):** 0 KB Image Egress (**100% eliminated via disk cache**)
* **API Response Size:** ~600 B (Gzip compressed)

---

## Security

* **Receipt Access:** Bank transfer receipts are separated into a designated receipts folder, decoupled from public project queries, and strictly accessible via authenticated admin endpoints (`/api/admin/contributions`).

---

## Tests & Verification

* **Backend Tests:** Passing (`jest`, `e2e-audit.spec.ts`)
* **React Admin:** Build passed without errors (`tsc && vite build`)
* **Flutter Mobile:** Analyzed and compiled cleanly

---

## Final Status

**OPTIMIZATION IMPLEMENTED**
*(Measured on live Render and Supabase services. Provider-level billing egress depends on total monthly traffic volume).*
