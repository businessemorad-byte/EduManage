# Architectural Decision Records

## ADR-001: Multi-Tenancy via Shared Database with Organization Scoping

**Date:** 2026-08-20
**Status:** Accepted

**Decision:** Use a shared PostgreSQL database with `organizationId` column-level isolation rather than schema-per-tenant or database-per-tenant approaches.

**Rationale:**
- Simpler operations and migrations
- Sufficient for initial scale (hundreds to low thousands of tenants)
- Application-level enforcement with database indexes for performance
- Can migrate to schema-per-tenant later if needed

**Consequences:**
- All queries must include `organizationId` filter
- Requires discipline in every data access layer
- Audit logging provides safety net for data access verification

## ADR-002: UUID Primary Keys

**Date:** 2026-08-20
**Status:** Accepted

**Decision:** Use UUIDs (v4) as primary keys for all models.

**Rationale:**
- Safe for distributed/multi-tenant systems
- No sequential ID leaking across tenants
- Can generate client-side without DB round-trip
- Prisma `@default(uuid())` handles generation

## ADR-003: Prisma as ORM

**Date:** 2026-08-20
**Status:** Accepted

**Decision:** Use Prisma as the sole ORM for database access.

**Rationale:**
- Type-safe queries with TypeScript
- Schema-first approach enforces model consistency
- Built-in migration system
- Excellent Next.js integration

## ADR-004: App Router Over Pages Router

**Date:** 2026-08-20
**Status:** Accepted

**Decision:** Use Next.js App Router exclusively.

**Rationale:**
- Server Components by default reduce client JS
- Route Handlers provide clean API route pattern
- Built-in loading/error states
- Streaming and Suspense support
- Future of Next.js

## ADR-005: Testing Strategy

**Date:** 2026-08-20
**Status:** Accepted

**Decision:** Vitest for unit/integration tests, Playwright for E2E.

**Rationale:**
- Vitest: Fast, ESM-native, Vite-compatible, familiar Jest API
- Playwright: Cross-browser, reliable selectors, auto-waiting
- Separation keeps unit tests fast and E2E tests comprehensive
