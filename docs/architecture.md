# Architectural Decision Record & System Design: Masajid Platform (مساجد)

## 1. System Overview
Masajid is a dedicated platform designed strictly for mosque-related needs (maintenance, solar energy, water, construction, renovation, cleaning, furnishing, Quran & essentials).
The system comprises:
- **NestJS REST API** (`apps/api`): Secure, transactional backend with PostgreSQL + Prisma ORM.
- **React Admin Dashboard** (`apps/admin`): Modern TypeScript + Vite + Tailwind dashboard for mosque projects, bank account management, financial tracking, and contribution verification.
- **Flutter Mobile Client** (`apps/mobile`): Arabic RTL, clean-architecture mobile app for visitors to browse mosque needs, copy bank account numbers, calculate share pledges, and submit transfer receipts.
- **Shared Packages** (`packages/shared-types`, `packages/shared-validation`, `packages/shared-config`): Monorepo packages ensuring end-to-end type safety and validation consistency.

## 2. Technical Stack Decisions
| Layer | Choice | Rationale |
|---|---|---|
| Monorepo Manager | pnpm workspaces | Fast, strict dependency resolution, shared package support |
| Backend Runtime | Node.js (TypeScript) + NestJS | Strict modular structure, dependency injection, built-in validation & security |
| Database & ORM | PostgreSQL + Prisma ORM | ACID transactions, row-level locking for share calculations, type-safe migrations |
| Admin Web | React 18 + Vite + Tailwind CSS | Fast bundle times, responsive RTL & LTR design, TanStack Query & Recharts |
| Mobile Client | Flutter 3.x (Dart 3.x) + Material 3 | Smooth 60fps animations, native RTL support, Riverpod + GoRouter + Dio |
| Auth & Security | Argon2 / bcrypt + JWT + Helmet + Rate-limit | Protection against brute force, secure password hashing, strict RBAC |
| File Storage | Isolated Local / S3-compatible storage with MIME/Magic-byte validation | Protects private receipts from public exposure; public project media caching |

## 3. Financial & Share Integrity Rules
1. **Mathematical Invariant**: `totalShares * shareValue == estimatedCost` enforced at project creation.
2. **Atomic Contributions**:
   - Status transitions: `PENDING` -> `APPROVED` or `REJECTED`.
   - Only `APPROVED` contributions increment `fundedShares` and `fundedAmount`.
   - Approval execution uses PostgreSQL transactional row-locking (`SELECT ... FOR UPDATE` or Prisma `$transaction` with optimistic/pessimistic check) to prevent concurrent double-approvals from exceeding `totalShares`.
3. **Receipt Security**:
   - Visitor uploads receipt (image/PDF, sanitized filename, max 10MB).
   - Receipt URLs are private endpoints protected by Admin JWT authorization.

## 4. Project Structure (Monorepo)
```text
masajid/
├── apps/
│   ├── mobile/         # Flutter Mobile Application
│   ├── admin/          # React + Vite Admin Dashboard
│   └── api/            # NestJS Backend API
├── packages/
│   ├── shared-types/      # TypeScript interfaces, DTO definitions, Enums
│   ├── shared-validation/ # Shared Zod/class-validator schemas & helpers
│   └── shared-config/     # Shared tsconfig, eslint configs
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.api
│   │   └── Dockerfile.admin
│   └── deployment/
├── docs/
│   ├── architecture.md
│   └── api.md
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env.example
└── README.md
```
