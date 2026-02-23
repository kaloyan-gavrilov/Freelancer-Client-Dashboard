# ADR-001: NestJS over Express or Fastify

**Date:** 2026-02-10
**Status:** Accepted
**Author:** Team Zlaten Vek

---

## Context

We need a backend framework for the Freelancer-Client Dashboard API. The application requires:

- A modular architecture to organise features (projects, bids, milestones, time entries, file uploads) into self-contained modules
- Built-in dependency injection for testability and separation of concerns
- First-class TypeScript support without additional configuration
- Swagger/OpenAPI documentation generation from decorators
- A mature ecosystem with guards, pipes, interceptors, and exception filters

We evaluated three options.

---

## Options Considered

### Option A: Raw Express + Manual Structure

- **Pros:** Minimal abstraction, maximum flexibility, tiny dependency footprint.
- **Cons:** No built-in DI, module system, or validation pipeline. Developers must manually wire routing, middleware, error handling, and documentation. Leads to inconsistent patterns across a team.

### Option B: Fastify

- **Pros:** Faster raw throughput than Express (schema-based serialisation), plugin system, TypeScript support.
- **Cons:** Smaller ecosystem of decorators and tooling. No built-in DI container — requires integrating a third-party library (e.g., `awilix`). Swagger generation is possible but less ergonomic than NestJS decorators.

### Option C: NestJS (chosen)

- **Pros:** Opinionated modular architecture, built-in DI container, first-class TypeScript, decorators for validation (`class-validator`), Swagger (`@nestjs/swagger`), guards, and pipes. Large community and documentation.
- **Cons:** Steeper learning curve for developers unfamiliar with Angular-style patterns. Larger bundle size compared to raw Express. Some "magic" from decorators and reflection metadata.

---

## Decision

We chose **NestJS** as the backend framework.

The project has multiple feature domains (projects, bids, milestones, files, time entries) that benefit from NestJS's module system. The built-in DI container enables the Repository Pattern (see [ADR-003](ADR-003-repository-pattern.md)) and Strategy Pattern (see [ADR-004](ADR-004-strategy-pattern-bid-ranking.md)) without third-party wiring. Swagger decorators on controllers and DTOs generate API documentation automatically with zero runtime overhead.

---

## Consequences

- **Positive:** Consistent project structure across all feature modules. Guards and decorators enforce role-based access (CLIENT, FREELANCER) declaratively. Global validation pipe and exception filter reduce boilerplate. Swagger documentation stays in sync with the actual code.
- **Negative:** Team members need to learn NestJS conventions (modules, providers, decorators, lifecycle). The compiled backend bundle is larger than a minimal Express app. Debugging DI errors requires understanding the NestJS injector.
