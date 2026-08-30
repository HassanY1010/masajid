# 🕌 مشروع «مساجد» — Production-Ready Full-Stack Platform

> **منصة رقمية موجهة لخدمة بيوت الله وتسهيل مساهمات الأسهم التمويلية لاحتياجات المساجد**

---

## 📌 نظرة عامة (Overview)
«مساجد» منصة متكاملة وذات بنية معمارية احترافية مبنية كـ Monorepo، مخصصة حصراً لعرض وتلبية احتياجات المساجد (طاقة شمسية، صيانة وترميم، شبكات مياه وسقيا، فرش وتجهيزات صوتية، ومصاحف).

### تتألف المنصة من:
1. **NestJS Backend REST API (`apps/api`)**: خادم متكامل يعتمد على PostgreSQL وPrisma ORM، مزود بمعاملات بنكية آمنة (Atomic Transactions & Row Locking) لمنع تجاوز الأسهم أو القبول المزدوج.
2. **React Admin Dashboard (`apps/admin`)**: لوحة تحكم عصرية بالكامل (React + Vite + TypeScript + Tailwind CSS + TanStack Query + Recharts) لإدارة المشاريع، مراجعة سندات التحويل البنكي (معاينة الصور وملفات PDF)، وإدارة الحسابات البنكية.
3. **Flutter Mobile Application (`apps/mobile`)**: تطبيق جوال عربي بالكامل (RTL) مبني بـ Clean Architecture وRiverpod وGoRouter، بدون اشتراط تسجيل دخول للزائر، يتيح حساب الأسهم بدقة ونسخ الحسابات البنكية ورفع السندات مباشرة.
4. **حزم مشتركة (`packages/`)**:
   - `@masajid/shared-types`: الواجهات والأنواع وقوائم الـ Enums المشتركة.
   - `@masajid/shared-validation`: منطق التحقق الرياضي الدقيق للأسهم ومخططات Zod.

---

## 🏗️ هيكلية المشروع (Monorepo Architecture)

```text
masajid/
├── apps/
│   ├── mobile/         # Flutter Mobile App (Arabic RTL, Material 3, Riverpod)
│   ├── admin/          # React Admin Dashboard (Vite, Tailwind, Recharts)
│   └── api/            # NestJS API (Prisma, PostgreSQL, JWT, Swagger)
│
├── packages/
│   ├── shared-types/      # Enums, DTOs & Models
│   └── shared-validation/ # Mathematical invariant validations
│
├── docs/
│   └── architecture.md    # Architectural Decision Records (ADR)
│
├── .env.example
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## ⚖️ القواعد المالية الصارمة لنظام الأسهم (Financial Business Rules)

1. **المعادلة الثابتة**: `totalShares * shareValue == estimatedCost` (يتم التحقق منها إجبارياً في Backend وFrontend).
2. **احتساب المساهمات**:
   - الزائر يحدد عدد الأسهم ليتم احتساب المبلغ المطلوب.
   - عند إرسال السند، تكون الحالة `PENDING` ولا تدخل الأسهم في التمويل.
   - عند قبول المشرف (`APPROVED`)، يتم تنفيذ معاملة PostgreSQL Transactionية ذرية (`$transaction`) لتحديث `fundedShares` و`fundedAmount` ومنع أي Race Conditions.
   - عند اكتمال `fundedShares >= totalShares`، يتحول المشروع تلقائياً إلى `FULLY_FUNDED` ويغلق استقبال مساهمات جديدة.

---

## 🚀 التشغيل المحلي (Running Locally)

### 1. المتطلبات:
- **Node.js**: v18 أو v20
- **pnpm**: v9 أو v10
- **Flutter**: v3.22+
- **PostgreSQL**: قاعدة بيانات جاهزة (محلية أو سحابية)

### 2. تثبيت الحزم:
```bash
pnpm install
```

### 3. إعداد البيئة وقاعدة البيانات:
قم بنسخ ملف `.env.example` إلى `.env` وتأكد من رابط قاعدة البيانات `DATABASE_URL`:
```bash
cp .env.example .env
```

توليد الـ Prisma Client ومزامنة الجداول والـ Seed:
```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 4. تشغيل الـ Backend API:
```bash
pnpm --filter @masajid/api start:dev
```
- الرابط: `http://localhost:4000/api`
- توثيق Swagger التفاعلي: `http://localhost:4000/docs/swagger`

### 5. تشغيل لوحة تحكم المشرف (React Admin):
```bash
pnpm --filter @masajid/admin dev
```
- الرابط: `http://localhost:5173`
- حساب الأدمن الافتراضي:
  - **البريد:** `admin@masajid.app`
  - **كلمة المرور:** `AdminPassword123!`

### 6. تشغيل تطبيق الجوال (Flutter Mobile):
```bash
cd apps/mobile
flutter run
```

---

## 🧪 الاختبارات وضمان الجودة (Testing & Verification)

### تشغيل اختبارات الـ Backend:
```bash
pnpm --filter @masajid/api test
```

### فحص الكود الساكن لتطبيق Flutter:
```bash
cd apps/mobile
flutter analyze
```

---

## 🔒 الأمان والحماية (Security Features)
- حماية كلمات المرور باستخدام تشفير **Bcrypt** مع Salt Rounds.
- حماية **JWT Authentication & Refresh Tokens**.
- تفعيل **Helmet** لحماية ترويسات HTTP.
- تدقيق نوع ومقاس الملفات المرفوعة (JPG, PNG, WEBP, PDF) حتى 10MB كحد أقصى وعزل التخزين.
- سجل رقابي كامل للعمليات الإدارية (**Audit Logs**) مع تسجيل عنوان الـ IP والبيانات قبل وبعد التعديل.

---

## 📄 الترخيص (License)
تم تطوير هذا المشروع خصيصاً كمنصة إنتاجية لخدمة المساجد وبيوت الله.
