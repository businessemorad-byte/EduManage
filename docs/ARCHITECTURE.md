# EduManage Architecture

## Overview

EduManage is a production-grade multi-tenant SaaS platform serving private schools, support centers, and training centers.

## Tech Stack

- **Runtime:** Next.js (App Router) + React 19 + TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL 17 + Prisma ORM
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Containerization:** Docker + Docker Compose
- **Package Manager:** pnpm

## Multi-Tenancy Strategy

**Shared database, shared schema** with `organizationId` isolation.

Every tenant-owned resource includes an `organizationId` foreign key. Application-level queries MUST filter by `organizationId`. Database-level enforcement via indexes and constraints.

### Tenant Hierarchy

```
Organization (tenant)
  └── Branch (location/unit)
       └── Users (belong to branch + organization)
```

### Isolation Rules

1. Every API route extracts `organizationId` from the authenticated user session.
2. All database queries include `WHERE organizationId = ?`.
3. Never query across organizations without explicit admin/system context.
4. Audit logs track all mutations with `organizationId`, `userId`, and `action`.

## Directory Structure

```
/
├── src/
│   ├── app/              # Next.js App Router (routes + pages)
│   │   └── api/          # API routes
│   ├── lib/              # Shared utilities (prisma client, constants)
│   └── generated/        # Prisma generated client (gitignored)
├── prisma/
│   └── schema.prisma     # Database schema
├── tests/
│   ├── unit/             # Vitest unit tests
│   └── e2e/              # Playwright E2E tests
└── docs/
    ├── ARCHITECTURE.md   # This file
    └── DECISIONS.md      # Architectural decision records
```

## Plan Tiers & AI Feature Gating

| Plan      | AI Level    |
|-----------|-------------|
| Standard  | No AI       |
| Pro       | Core AI     |
| Ultimate  | Advanced AI |
| Custom    | Enterprise  |

AI features are gated by subscription plan. Plan tier determines which AI capabilities are available to an organization.

## Database Models (Day 1)

- **Organization** — Tenant root entity
- **Branch** — Location/unit within an organization
- **User** — Authenticated user, optionally linked to a branch
- **OrganizationMember** — Links users to organizations with roles
- **Role** — Named role (e.g., Admin, Teacher, Staff)
- **Permission** — Granular permission key
- **RolePermission** — Many-to-many: roles ↔ permissions
- **Plan** — Subscription plan definition
- **Feature** — Feature flag/limit definition
- **PlanFeature** — Plan ↔ feature mapping with limits
- **Subscription** — Organization's active plan
- **AuditLog** — Immutable audit trail
