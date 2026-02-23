# AI Usage Log

This document records significant uses of AI (Claude) during the development of the Freelancer-Client Dashboard. Each entry describes what was generated, what was changed during review, and the reasoning behind decisions.

---

## Entry 1: Project State Machine Design (State Pattern)

**Date:** 2026-02-14
**Feature:** Project lifecycle management
**Ticket:** ZLA-35

### What was generated

Claude generated the State Pattern implementation for the project lifecycle in `backend/src/domain/project/`. This included:

- `ProjectState.ts` — abstract base class defining the state interface with methods: `open()`, `startWork()`, `submitForReview()`, `complete()`, `cancel()`, `dispute()`
- `ProjectStateMachine.ts` — context class that delegates state transitions to the current state object
- Five concrete state classes: `PendingState` (DRAFT), `ActiveState` (IN_PROGRESS), `InReviewState` (REVIEW), `CompletedState`, `DisputedState`
- Unit tests in `project-state.test.ts` covering all valid transitions and verifying that invalid transitions throw `InvalidStateTransitionException`

### What was changed during review

- Renamed `PendingState` methods to match the domain language used in the Supabase schema (e.g., `DRAFT → OPEN` instead of `PENDING → ACTIVE`).
- Added the `CANCELLED` terminal state, which the initial generation missed — the database trigger `validate_project_status_transition()` already enforces this path.
- Extended the `REVIEW` state to allow transitioning back to `IN_PROGRESS` (revision request), matching the database constraint graph.

### Why

The project status lifecycle has complex rules (7 states, conditional transitions). A State Pattern encapsulates the valid transitions for each state in its own class, making it impossible to reach an illegal state through application code. This mirrors the database-level trigger `validate_project_status_transition()` for defence in depth.

---

## Entry 2: Bid Ranking Strategy Implementation (Strategy Pattern)

**Date:** 2026-02-20
**Feature:** Bid ranking for clients
**Ticket:** ZLA-36

### What was generated

Claude generated the Strategy Pattern for bid ranking in `backend/src/domain/bid/ranking/`. This included:

- `BidRankingStrategy.ts` — interface with a `rank(bids: Bid[]): Bid[]` method
- Three strategy implementations: `PriceAscStrategy`, `RatingDescStrategy`, `CompositeStrategy`
- `BidRankingStrategyFactory` — factory that maps `rankBy` query parameter values to strategy instances
- `BidRanker` — context class that delegates to the selected strategy
- Unit tests for all three strategies with edge cases (empty arrays, equal values, null ratings)

### What was changed during review

- The `CompositeStrategy` initially used equal 50/50 weighting. We changed it to 40% price / 60% rating after discussing that rating is a stronger signal of quality.
- Added input validation in `BidRankingStrategyFactory` to fall back to `PriceAscStrategy` when `rankBy` is `undefined` or an unknown value, instead of throwing an error.
- Registered all strategies and the factory as NestJS providers in `BidsModule` — the initial generation placed them as plain classes without DI integration.

### Why

Clients need to compare bids using different criteria. The Strategy Pattern allows the ranking algorithm to be selected at runtime via a query parameter (`?rankBy=price|rating|composite`) without conditional logic in the service layer. New ranking algorithms can be added by creating a new class and registering it in the factory.

---

## Entry 3: Repository Pattern with Dependency Inversion

**Date:** 2026-02-14
**Feature:** Data access abstraction
**Ticket:** ZLA-34

### What was generated

Claude generated the Repository Pattern infrastructure:

- Repository interfaces in `backend/src/domain/repositories/`: `IProjectRepository`, `IBidRepository`, `IMilestoneRepository`, `IFileRepository`, `IFreelancerRepository`, `ITimeEntryRepository`
- `Symbol`-based injection tokens (e.g., `PROJECT_REPOSITORY = Symbol('PROJECT_REPOSITORY')`)
- Supabase implementations in `backend/src/infrastructure/repositories/`: `SupabaseProjectRepository`, `SupabaseBidRepository`, etc.
- Module provider registrations mapping `Symbol` tokens to Supabase implementations

### What was changed during review

- Removed generic `BaseRepository<T>` class that Claude initially created — it added unnecessary abstraction since each repository has domain-specific query methods (e.g., `findByProjectId`, `findByStatus`).
- Added proper error handling in Supabase implementations: the initial code silently returned `null` on Supabase errors. We added checks for `error` in the Supabase response and throw domain-specific exceptions.
- Added `ITimeEntryRepository` which was not in the initial generation but was needed for the time entries feature.

### Why

Direct Supabase client calls in services would couple business logic to a specific SDK. The Repository Pattern with DIP allows services to depend on interfaces (stable abstractions) rather than implementations. This makes services unit-testable with mock repositories and allows swapping the data source without changing service code.

---

## Entry 4: Full REST API Layer — Controllers, DTOs, Swagger, Exception Filter

**Date:** 2026-02-22
**Feature:** REST API endpoints
**Ticket:** ZLA-38

### What was generated

Claude generated the complete REST API layer:

- **Controllers:** `ProjectsController`, `BidsController`, `MilestonesController`, `TimeEntriesController` with full Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiParam`, `@ApiQuery`)
- **DTOs:** `CreateProjectDto`, `UpdateProjectStatusDto`, `ProjectQueryDto`, `CreateBidDto`, `CreateMilestoneDto`, `UpdateMilestoneStatusDto`, `CreateTimeEntryDto` — all with `class-validator` decorators and `@ApiProperty` annotations
- **Global exception filter:** `HttpExceptionFilter` providing standardised error response shape with timestamp and path
- **Swagger configuration** in `main.ts` using `DocumentBuilder` with Bearer auth scheme
- **File upload endpoint** with `FileValidationPipe` for size and MIME type validation

### What was changed during review

- Added `@Public()` decorator to `GET /projects` and `GET /projects/:id` — the initial generation required authentication for all project endpoints, but the marketplace browse page needs to be public.
- Changed `DELETE /projects/:id` to return `204 No Content` (added `@HttpCode(HttpStatus.NO_CONTENT)`) instead of the default `200` with a body.
- Added `ProjectQueryDto` with `@Type(() => Number)` transformers — the initial query parameters were arriving as strings and failing numeric validation.
- Added `@Redirect()` decorator to the file download endpoint to return a `302` with the presigned URL instead of the URL in a JSON body.

### Why

The API needed a complete REST layer with consistent patterns: validation at the boundary (DTOs + `ValidationPipe`), role-based access (guards + `@Roles()` decorator), standardised error responses (global filter), and self-documenting endpoints (Swagger). Generating the full layer at once ensured consistency across all controllers.

---

## Entry 5: Multi-Stage Docker Configuration

**Date:** 2026-02-18
**Feature:** Containerised deployment
**Ticket:** ZLA-40

### What was generated

Claude generated:

- `backend/Dockerfile` — two-stage build (builder → production) with `node:20-alpine`
- `frontend/Dockerfile` — two-stage build (build → serve) with `node:20-alpine` → `nginx:alpine`
- `docker-compose.yml` — three services (db, backend, frontend) with health checks and dependency ordering

### What was changed during review

- Added extensive inline comments explaining **why** each Docker instruction exists (required for grading). The initial generation had minimal comments.
- Changed the frontend nginx configuration to include `gzip_static on` for pre-compressed assets.
- Added `--chown=node:node` to `COPY` instructions in the backend production stage — the initial generation ran as root.
- Added `healthcheck` to the `db` service and `condition: service_healthy` on the backend's `depends_on` — the initial generation used plain `depends_on` which doesn't wait for Postgres readiness.
- Set `ENV PORT=8080` in the backend Dockerfile for Cloud Run compatibility (Cloud Run injects `PORT=8080`).

### Why

Multi-stage builds separate build-time tooling from the production runtime, producing images that are 50-70% smaller. This directly impacts Cloud Run cold-start times and reduces the attack surface. The Docker Compose file provides a single-command local development environment that mirrors the production topology.

---

## Entry 6: Documentation Generation

**Date:** 2026-02-23
**Feature:** Project documentation
**Ticket:** ZLA-42

### What was generated

Claude generated all project documentation:

- `README.md` — architecture overview, setup instructions, environment variables, test commands, CI/CD description, deployed URLs
- Six Architecture Decision Records (`docs/adr/ADR-001` through `ADR-006`) covering: NestJS selection, Supabase adoption, Repository Pattern, Strategy Pattern for bid ranking, multi-stage Docker, GCS + CDN hosting
- `docs/api.md` — request/response examples for all 16 API endpoints with headers, bodies, status codes, and error formats
- `docs/ai-usage-log.md` — this file

### What was changed during review

- Replaced placeholder UUIDs in `docs/api.md` with consistently formatted example UUIDs so cross-references between endpoints make sense (e.g., the project ID used in `POST /projects` response appears in `GET /projects/:id` request).
- Added the valid state transition graph to the `PATCH /projects/:id/status` section in `docs/api.md`.
- Added the error response format section at the bottom of `docs/api.md` showing the `HttpExceptionFilter` output shape.
- Ensured ADR-004 captures the content from the existing ADR at `backend/docs/adr/2026-02-20-use-strategy-pattern-for-bid-ranking.md` while reformatting to the standard 4-section template.

### Why

The documentation is required for project grading. The README provides onboarding instructions for new developers. ADRs record the reasoning behind key architectural choices so they can be understood months later. The API docs serve as a reference for frontend developers integrating with the backend. The AI usage log provides transparency about how AI tools were used and what human review was applied.
