# Google Play Data Safety Declaration: منصة مساجد (Masajid)

## 1. Overview
This document outlines the exact data collection, usage, and sharing behaviors of the **Masajid (مساجد)** mobile application for filling out the Google Play Data Safety form.

---

## 2. Data Types Collected & Purpose

| Data Type | Collected? | Shared with Third Parties? | Optional or Required? | Purpose / Retention |
|---|:---:|:---:|:---:|---|
| **Name (اسم المتبرع)** | Yes | **No** | Optional | Used solely for internal audit of bank transfer receipts. |
| **Phone Number (رقم الهاتف)** | Yes | **No** | Optional | Used for contribution confirmation and donor communication. |
| **Financial Info / Bank Receipts (سندات التحويل)** | Yes | **No** | Required for manual bank transfers | Uploaded securely for admin verification of offline bank deposits. |
| **Photos & Files (الصور والملفات)** | Yes | **No** | Required for receipt upload | Bank transfer deposit images uploaded by donor. |
| **Location Data** | **No** | **No** | N/A | App displays mosque locations only; no user GPS tracked. |
| **Device / Diagnostic Data** | **No** | **No** | N/A | No third-party ad tracking or analytics SDKs used. |

---

## 3. Security Practices
- **Data Encryption in Transit:** All network communication uses HTTPS / TLS 1.3 to `https://masajid-1ggr.onrender.com`.
- **Data Deletion Mechanism:** Users can request deletion of their records by contacting platform administrators.
- **Children's Privacy:** App is designed for general audiences and does not target children under 13.
