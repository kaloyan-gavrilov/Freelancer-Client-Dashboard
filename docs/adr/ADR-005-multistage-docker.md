# ADR-005: Multi-Stage Docker Builds

**Date:** 2026-02-18
**Status:** Accepted
**Author:** Team Zlaten Vek

---

## Context

Both the backend (NestJS) and frontend (React + Vite) need to be containerised for deployment to Google Cloud. We need a Docker strategy that:

- Produces small production images (fast Cloud Run cold starts, lower storage costs)
- Excludes dev dependencies, TypeScript source, and build tooling from the final image
- Leverages Docker layer caching for fast CI builds
- Runs as a non-root user for security

---

## Options Considered

### Option A: Single-Stage Dockerfile

- **Pros:** Simple, one `FROM` statement, easy to understand.
- **Cons:** The final image includes all build tools (TypeScript compiler, `@nestjs/cli`, Vite, etc.), dev dependencies, and source files. Results in large images (500 MB+), slower cold starts, and a larger attack surface.

### Option B: Multi-Stage Builds (chosen)

- **Pros:** Builder stage installs all dependencies and compiles; production stage copies only the compiled output and production dependencies. Images are 50-70% smaller. Build cache is effective because `package.json` is copied before source files. Non-root user can be configured in the final stage.
- **Cons:** Slightly more complex Dockerfiles. Debugging requires specifying the target stage.

### Option C: Distroless Base Images

- **Pros:** Even smaller images, no shell or package manager in the final image.
- **Cons:** Harder to debug (no shell to exec into). Node.js distroless images are less mature than Alpine variants. Incompatible with some npm packages that need native binaries.

---

## Decision

We use **multi-stage Docker builds** for both services.

### Backend (`backend/Dockerfile`)

- **Stage 1 (builder):** `node:20-alpine` — installs all dependencies, runs `nest build` to compile TypeScript to JavaScript in `./dist`.
- **Stage 2 (production):** `node:20-alpine` — copies only `package.json` and `dist/`, installs production dependencies with `--omit=dev`, runs as the `node` user (uid 1000).

### Frontend (`frontend/Dockerfile`)

- **Stage 1 (build):** `node:20-alpine` — installs dependencies, runs `tsc && vite build` producing optimised static assets in `./dist`.
- **Stage 2 (serve):** `nginx:alpine` — copies only the compiled assets, configures SPA fallback routing (`try_files $uri $uri/ /index.html`), enables `gzip_static`.

### Docker Compose

The `docker-compose.yml` targets the production stages of both Dockerfiles, runs a `postgres:16-alpine` database with health checks, and wires services together.

---

## Consequences

- **Positive:** Backend production image is ~150 MB (vs ~500 MB single-stage). Frontend production image is ~25 MB (nginx + static assets). Docker layer caching means CI builds only re-run `npm install` when `package.json` changes. Non-root execution reduces container escape risk.
- **Negative:** Developers must understand multi-stage builds to modify Dockerfiles. Local debugging may require building a specific stage (`docker build --target builder`). The frontend Dockerfile uses nginx, which requires a custom config for SPA routing.
