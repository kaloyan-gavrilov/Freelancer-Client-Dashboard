# ADR-003: Repository Pattern with Dependency Inversion

**Date:** 2026-02-14
**Status:** Accepted
**Author:** Team Zlaten Vek

---

## Context

Services in the backend need to read and write data from Supabase (PostgreSQL). We need a data-access strategy that:

- Decouples business logic from the Supabase client SDK
- Allows unit-testing services with mock repositories (no database required)
- Makes it possible to swap the data source (e.g., replace Supabase with a direct Postgres driver) without changing service code
- Follows SOLID principles, specifically the Dependency Inversion Principle (DIP)

---

## Options Considered

### Option A: Direct Supabase Calls in Services

- **Pros:** Minimal boilerplate, fastest to implement.
- **Cons:** Services are tightly coupled to the Supabase JS client. Testing requires mocking the Supabase SDK's chained builder pattern, which is fragile. Switching data sources means rewriting every service.

### Option B: Active Record Pattern

- **Pros:** Entities know how to persist themselves, simple for CRUD operations.
- **Cons:** Entities carry infrastructure concerns (database connection, query logic), violating single responsibility. Harder to test without a database. Not idiomatic in NestJS.

### Option C: Repository Interfaces + DIP (chosen)

- **Pros:** Clean separation between domain logic and infrastructure. Interfaces live in `domain/repositories/`, implementations live in `infrastructure/repositories/`. NestJS DI resolves implementations via `Symbol` injection tokens. Services depend only on abstractions.
- **Cons:** Extra boilerplate (interface + implementation + token + module registration per entity). More files to maintain.

---

## Decision

We implement the **Repository Pattern** using TypeScript interfaces and NestJS's dependency injection with `Symbol`-based tokens.

Structure:

```
src/
├── domain/
│   └── repositories/
│       ├── project.repository.interface.ts   # Interface + Symbol token
│       ├── bid.repository.interface.ts
│       ├── milestone.repository.interface.ts
│       ├── file.repository.interface.ts
│       ├── freelancer.repository.interface.ts
│       └── time-entry.repository.interface.ts
└── infrastructure/
    └── repositories/
        ├── supabase-project.repository.ts    # Supabase implementation
        ├── supabase-bid.repository.ts
        ├── supabase-milestone.repository.ts
        ├── supabase-file.repository.ts
        ├── supabase-freelancer.repository.ts
        └── supabase-time-entry.repository.ts
```

Services inject the repository interface via its `Symbol` token:

```typescript
constructor(
  @Inject(PROJECT_REPOSITORY) private readonly projectRepo: IProjectRepository,
) {}
```

---

## Consequences

- **Positive:** Services are fully unit-testable by injecting mock repositories. Swapping from Supabase to another data source requires only a new implementation class and a module provider change — zero service code changes. Domain logic stays free of infrastructure imports.
- **Negative:** Each new entity requires creating an interface, a Symbol token, an implementation, and registering the provider in the module. This is more code than direct Supabase calls, but the testability and flexibility benefits outweigh the cost for a project of this size.
