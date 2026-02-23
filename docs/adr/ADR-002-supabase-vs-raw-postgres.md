# ADR-002: Supabase over Raw PostgreSQL or Firebase

**Date:** 2026-02-10
**Status:** Accepted
**Author:** Team Zlaten Vek

---

## Context

The application requires:

- **Authentication** — sign-up, login, JWT tokens, role claims (CLIENT, FREELANCER, ADMIN)
- **Relational database** — complex schema with 15+ tables, foreign keys, and constraints
- **Row Level Security** — fine-grained access control enforced at the database layer
- **File storage** — deliverable uploads with presigned download URLs
- **Triggers and functions** — audit logging, rating recalculation, status-transition validation

We evaluated three approaches.

---

## Options Considered

### Option A: Raw PostgreSQL + Passport.js

- **Pros:** Full control over auth flow, no vendor coupling, custom session management.
- **Cons:** Significant boilerplate for auth (password hashing, token refresh, email verification). Must self-host or provision a managed Postgres instance. File storage requires a separate service (S3, GCS). No built-in RLS tooling.

### Option B: Firebase (Firestore + Firebase Auth)

- **Pros:** Managed auth with social providers, real-time listeners, generous free tier.
- **Cons:** Firestore is a document database — poorly suited for the relational schema we need (joins, constraints, aggregations). No Row Level Security in the SQL sense. Migrating away from Firestore is extremely difficult.

### Option C: Supabase (chosen)

- **Pros:** Managed PostgreSQL with full SQL support. Built-in auth with JWT and role claims (`raw_user_meta_data`). Native Row Level Security with helper functions (`auth.uid()`). Integrated storage buckets with presigned URLs. Database triggers and PL/pgSQL functions supported natively. Open-source and self-hostable if needed.
- **Cons:** Vendor coupling for auth and storage APIs. RLS policies can become complex. Free tier has connection and storage limits.

---

## Decision

We chose **Supabase** as the combined auth, database, and storage provider.

Supabase provides a real PostgreSQL database, so our schema uses standard SQL features: enums, check constraints, foreign keys, triggers, and functions. Auth integrates directly — `auth.uid()` in RLS policies maps to the authenticated user without extra middleware. The storage API generates presigned URLs for file downloads, removing the need for a separate file service.

---

## Consequences

- **Positive:** Single platform for auth, database, and storage reduces operational overhead. RLS policies enforce access control at the database layer, providing defence in depth alongside NestJS guards. Triggers handle cross-cutting concerns (audit log, rating updates) without application code. The `handle_new_user()` trigger automatically provisions `clients` or `freelancers` rows on sign-up.
- **Negative:** Tightly coupled to Supabase's auth token format and storage API. RLS policies add complexity — every new table requires careful policy design. Connection pooling requires Supabase's built-in pooler rather than a self-managed PgBouncer.
