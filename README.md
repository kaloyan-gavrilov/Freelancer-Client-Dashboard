# Freelancer-Client Dashboard

A full-stack platform for managing the complete lifecycle of freelance engagements - from project posting and competitive bidding to milestone tracking, time logging, and payment management.

**Team:** Zlaten Vek

[![Build & Push Docker Images](https://github.com/Mark-Lch22/Freelancer-Client-Dashboard/actions/workflows/docker.yml/badge.svg)](https://github.com/Mark-Lch22/Freelancer-Client-Dashboard/actions/workflows/docker.yml)
[![Frontend CI](https://github.com/Mark-Lch22/Freelancer-Client-Dashboard/actions/workflows/frontend.yml/badge.svg)](https://github.com/Mark-Lch22/Freelancer-Client-Dashboard/actions/workflows/frontend.yml)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
  - [Option A — Docker Hub (fastest)](#option-a--docker-hub-fastest)
  - [Option B — Local Docker build](#option-b--local-docker-build)
  - [Option C — Local development](#option-c--local-development)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [CI/CD](#cicd)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)

---

## Features

- **Project Marketplace** — Clients post projects; freelancers submit competitive bids with proposed timelines and rates
- **Milestone Workflow** — Break projects into milestones with a full submission → review → approval cycle
- **Time Tracking** — Log time entries per project; generate reports per client or freelancer
- **Role-based Access** — Separate dashboards and permissions for clients, freelancers, and admins
- **Secure Payments** — Transaction tracking for milestone payments, refunds, and platform fees
- **Real-time Notifications** — In-app alerts for bid activity, milestone updates, and dispute events
- **File Management** — Upload and retrieve deliverables, portfolio items, and project attachments via Supabase Storage
- **Dispute Resolution** — Structured dispute workflow with audit trail
- **API Documentation** — Auto-generated Swagger/OpenAPI docs served at `/api/docs`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript 5.7, Vite 6 |
| **Styling** | Tailwind CSS 4, shadcn/ui (Radix UI) |
| **State / Data** | TanStack Query 5, React Hook Form 7, Zod 4 |
| **Routing** | React Router 7 |
| **Backend** | NestJS 11, TypeScript 5.7 |
| **Database** | PostgreSQL via Supabase |
| **Auth** | Supabase JWT (verified server-side without round-trips) |
| **Containerisation** | Docker (multi-stage builds), Docker Compose |
| **CI/CD** | GitHub Actions → Docker Hub |
| **Static Hosting** | Google Cloud Storage + Cloud CDN |
| **Testing** | Vitest 2 + React Testing Library (frontend), Jest 29 + Supertest (backend) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Browser                           │
│   React 19 SPA (Vite)  ·  TanStack Query  ·  shadcn/ui   │
└──────────────────┬───────────────────────────────────────┘
                   │  HTTPS / REST (Axios + JWT)
┌──────────────────▼───────────────────────────────────────┐
│                    NestJS API (port 3000)                │
│  Controllers → Services → Domain Layer → Repositories    │
│                  Global Exception Filter                 │
│                  JWT Guard (local verification)          │
└──────┬──────────────────────────────────────┬────────────┘
       │ Supabase client (service role)       │ Supabase client (anon)
┌──────▼──────────────────────────────────────▼────────────┐
│                        Supabase                          │
│  PostgreSQL · Row Level Security · JWT Auth · Storage    │
└──────────────────────────────────────────────────────────┘
```

### Frontend

A single-page application built with **React 19** and **Vite**. **TanStack Query** owns all server state (caching, background refetches, optimistic updates). Authentication flows through Supabase JWT tokens, automatically attached to every API request via an Axios request interceptor.

### Backend

A **NestJS** REST API following a strict layered architecture:

- **Controllers** — HTTP routing, request/response shaping, Swagger decorators
- **Services** — Application-level orchestration
- **Domain layer** (`domain/`) — Pure business logic: project state machine, bid-ranking strategy, repository interfaces
- **Infrastructure layer** (`infrastructure/`) — Concrete Supabase repository implementations
- **Global pipes** — Validate and transform every incoming DTO via `class-validator`
- **Global exception filter** — Standardises all error responses

### Database

**PostgreSQL** managed by **Supabase**, with:

- 15+ tables covering users, projects, bids, milestones, transactions, files, time entries, disputes, and notifications
- Row Level Security (RLS) policies for strict multi-tenant data isolation
- Database triggers for audit logging, automatic rating recalculation, and status-transition validation
- 12 enums enforcing domain-specific value constraints

---

## Repository Structure

```
/
├── frontend/                     # React 19 + Vite + TypeScript SPA
│   ├── src/
│   │   ├── pages/                # Route-level page components
│   │   ├── features/             # Domain-scoped feature modules
│   │   ├── components/           # Reusable UI components (shadcn/ui wrappers, icons)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # Typed Axios API clients
│   │   ├── contexts/             # React context providers
│   │   ├── types/                # Shared TypeScript type definitions
│   │   └── lib/                  # Utility functions
│   ├── Dockerfile                # Multi-stage: Vite build → nginx serve
│   └── .env.example
│
├── backend/                      # NestJS REST API
│   ├── src/
│   │   ├── auth/                 # JWT guards and decorators
│   │   ├── bids/                 # Bid controllers, services, DTOs
│   │   ├── milestones/           # Milestone controllers, services, DTOs
│   │   ├── projects/             # Project controllers, services, DTOs
│   │   ├── time-entries/         # Time logging endpoints
│   │   ├── domain/               # Business logic, state machines, repository interfaces
│   │   ├── infrastructure/       # Supabase client, concrete repositories
│   │   └── common/               # Global filters, pipes, interceptors
│   ├── Dockerfile                # Multi-stage: build → production (non-root, prod deps only)
│   └── .env.example
│
├── supabase/
│   ├── migrations/               # Incremental SQL migration files
│   └── db-schema.sql             # Full database schema (source of truth)
│
├── docs/
│   ├── adr/                      # Architecture Decision Records
│   ├── api.md                    # API request/response examples
│   └── ai-usage-log.md
│
├── .github/
│   └── workflows/
│       ├── docker.yml            # Build & push images to Docker Hub
│       └── frontend.yml          # Frontend CI: lint → test → build → deploy
│
├── docker-compose.yml            # Local development (builds from source)
├── docker-compose.prod.yml       # Production (pulls images from Docker Hub)
├── .env.prod.example             # Production environment template
└── package.json                  # npm workspaces root
```

---

## Prerequisites

| Tool | Minimum Version | Notes |
|------|----------------|-------|
| [Node.js](https://nodejs.org/) | 20.0.0 | Required for local dev only |
| [npm](https://www.npmjs.com/) | 10.0.0 | Required for local dev only |
| [Docker](https://docs.docker.com/get-docker/) + Docker Compose | Latest stable | Required for Docker options |
| [Supabase](https://supabase.com/) account | — | Free tier is sufficient |

---

## Quick Start

### Supabase Setup (required for all options)

Before running the app you need a Supabase project with the schema applied.

1. Create a free project at [supabase.com](https://supabase.com/)
2. Open the **SQL Editor** in your Supabase dashboard
3. Copy the contents of [`supabase/db-schema.sql`](supabase/db-schema.sql) and run it
4. Retrieve your credentials from **Settings → API**:
   - **Project URL** → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - **anon / public key** → `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
   - **JWT Secret** → `SUPABASE_JWT_SECRET` (Settings → API → JWT Settings)

---

### Option A — Docker Hub (fastest)

Pull and run the pre-built images. No Node.js or cloning required.

**1. Download the compose file and env template**

```bash
curl -O https://raw.githubusercontent.com/Mark-Lch22/Freelancer-Client-Dashboard/main/docker-compose.prod.yml
curl -O https://raw.githubusercontent.com/Mark-Lch22/Freelancer-Client-Dashboard/main/.env.prod.example
```

**2. Create your environment file**

```bash
cp .env.prod.example .env.prod
```

Edit `.env.prod` with your values:

```env
DOCKERHUB_USERNAME=kaloyangavrilov
TAG=latest

BACKEND_PORT=3000
FRONTEND_PORT=80

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_JWT_SECRET=<your-jwt-secret>
```

**3. Start the application**

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:80 |
| Backend API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api/docs |

**Update to the latest images**

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

**Stop**

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod down
```

---

### Option B — Local Docker build

Build both images from source. Use this when testing Dockerfile changes or running an unreleased version.

**1. Clone the repository**

```bash
git clone https://github.com/Mark-Lch22/Freelancer-Client-Dashboard.git
cd Freelancer-Client-Dashboard
```

**2. Configure environment variables**

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill in `backend/.env` and `frontend/.env` with your Supabase credentials (see [Environment Variables](#environment-variables)).

**3. Build and start**

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api/docs |

**Stop**

```bash
docker compose down
```

---

### Option C — Local development

Run each service with hot-reload. Best for active development.

**1. Clone the repository**

```bash
git clone https://github.com/Mark-Lch22/Freelancer-Client-Dashboard.git
cd Freelancer-Client-Dashboard
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill in both files with your Supabase credentials.

**4. Start services**

Open two terminal windows:

```bash
# Terminal 1 — Backend with hot-reload
npm run start:dev --workspace=backend

# Terminal 2 — Frontend with HMR
npm run dev --workspace=frontend
```

| Service | URL |
|---------|-----|
| Frontend (Vite HMR) | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api/docs |

---

## Database Setup

### Applying the schema

The full database schema lives in [`supabase/db-schema.sql`](supabase/db-schema.sql). Apply it once to a fresh Supabase project via the SQL Editor or the Supabase CLI:

```bash
# Using the Supabase CLI (requires supabase link)
supabase db push
```

### Applying migrations

Incremental migrations live in [`supabase/migrations/`](supabase/migrations/). Apply them in order after the base schema is in place:

```bash
supabase db push
```

### Schema overview

| Table | Purpose |
|-------|---------|
| `users` | Public user profiles with role discriminator |
| `clients` | Client-specific attributes (1-to-1 with users) |
| `freelancers` | Freelancer profiles with denormalised rating cache |
| `projects` | Projects with status, type (FIXED / HOURLY), deadlines |
| `bids` | Freelancer bids — PENDING → ACCEPTED / REJECTED / WITHDRAWN |
| `milestones` | Milestone delivery workflow — PENDING → SUBMITTED → APPROVED |
| `transactions` | Payment records: milestone payments, refunds, platform fees |
| `time_entries` | Hourly time logs per project |
| `files` | Deliverables, portfolio items, and attachments |
| `disputes` | Dispute records with audit trail |
| `notifications` | In-app notification queue |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Public URL of your Supabase project |
| `SUPABASE_ANON_KEY` | Yes | Anon/public key — respects RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service-role key — bypasses RLS. **Never expose to the browser.** |
| `SUPABASE_JWT_SECRET` | Yes | JWT secret for server-side token verification |
| `PORT` | No | Server port (default: `3000`) |
| `NODE_ENV` | No | `development` or `production` |
| `CORS_ORIGIN` | No | Comma-separated list of allowed CORS origins |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Public URL of your Supabase project |
| `VITE_SUPABASE_ANON_KEY` | Yes | Anon/public key — safe for the browser |
| `VITE_API_URL` | Yes | Backend base URL (e.g. `http://localhost:3000`) |

> **Important:** `VITE_*` variables are **baked into the JavaScript bundle at build time**. The pre-built Docker Hub image already has these values compiled in from the CI build. If you need to point at a different backend, you must rebuild the image with the updated `VITE_API_URL`.

### Production (`.env.prod`)

| Variable | Description |
|----------|-------------|
| `DOCKERHUB_USERNAME` | Docker Hub username for the image pull |
| `TAG` | Image tag to deploy (default: `latest`) |
| `BACKEND_PORT` | Host port for the backend container (default: `3000`) |
| `FRONTEND_PORT` | Host port for the frontend container (default: `80`) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key |
| `SUPABASE_JWT_SECRET` | JWT secret |

---

## Running Tests

```bash
# Run all tests across both workspaces
npm run test

# Backend tests only (Jest + Supertest)
npm run test --workspace=backend

# Backend end-to-end tests
npm run test:e2e --workspace=backend

# Frontend tests only (Vitest + React Testing Library)
npm run test --workspace=frontend

# Frontend tests with coverage report
npm run test:coverage --workspace=frontend
```

### Linting

```bash
# Lint all workspaces
npm run lint

# Auto-fix lint issues
npm run lint:fix --workspace=frontend
npm run lint:fix --workspace=backend
```

---

## CI/CD

GitHub Actions runs two pipelines automatically:

| Workflow | Trigger | Steps |
|----------|---------|-------|
| `docker.yml` | Push to `main`, version tags (`v*.*.*`), manual dispatch | Build backend image → build frontend image → push both to Docker Hub (parallel) |
| `frontend.yml` | Changes to `frontend/**` on any branch | Install → lint → test → build → (on `main` only) deploy to GCP Cloud Storage |

### Image tagging strategy

Every Docker Hub push produces three tags:

| Tag | When | Use case |
|-----|------|----------|
| `latest` | Every push to `main` | Always points to the most recent build |
| `sha-<short-commit>` | Every build | Immutable reference to a specific commit |
| `v1.2.3` | Push of a `v*.*.*` git tag | Versioned releases |

To cut a release:

```bash
git tag v1.2.3
git push origin v1.2.3
```

### Required GitHub Secrets

Configure these at **Repository → Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token (**Account Settings → Security → Access Tokens**) |
| `VITE_API_URL` | Production backend URL (baked into the frontend image at build time) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `GCP_PROJECT_ID` | Google Cloud project ID (for frontend static deployment) |
| `GCP_SA_KEY` | GCP service account JSON key (for Cloud Storage uploads and CDN invalidation) |

---

## Deployment

### Docker Hub Images

Pre-built images are published automatically on every push to `main`:

| Image | Docker Hub |
|-------|-----------|
| Backend | [`kaloyangavrilov/freelancer-dashboard-api`](https://hub.docker.com/r/kaloyangavrilov/freelancer-dashboard-api) |
| Frontend | [`kaloyangavrilov/freelancer-dashboard-web`](https://hub.docker.com/r/kaloyangavrilov/freelancer-dashboard-web) |

### Cloud deployment (GCP)

The `frontend.yml` workflow automatically deploys the compiled frontend to **Google Cloud Storage** and invalidates the **Cloud CDN** cache on every push to `main`. No manual steps are needed after secrets are configured.

For the backend, any Docker-compatible host works (Cloud Run, Railway, Fly.io, VPS with Docker). Point `VITE_API_URL` at your deployed backend URL and rebuild the frontend image.

### Dockerfile highlights

Both images use multi-stage builds for minimal footprint:

| Image | Final base | Approximate size |
|-------|-----------|-----------------|
| Backend | `node:20-alpine` (production deps only, non-root user) | ~150 MB |
| Frontend | `nginx:alpine` (compiled static assets only) | ~25 MB |

The frontend nginx configuration handles SPA routing (all paths fall back to `index.html`) and enables gzip compression with cache-control headers.

---

## Documentation

- [API Request/Response Examples](docs/api.md)
- [Architecture Decision Records](docs/adr/)
- [AI Usage Log](docs/ai-usage-log.md)
- Swagger UI — available at `http://localhost:3000/api/docs` when the backend is running

---

## Contributing

1. **Branch** off `main` using the convention: `feature/<ticket-id>-<short-description>` or `fix/<ticket-id>-<short-description>`
2. **Commit** with clear, imperative messages (e.g. `add milestone approval endpoint`)
3. **Open a PR** — the PR template will guide you through the required sections
4. **CI must pass** — linting, tests, and build checks all need to be green
5. **1 approval** required from a team member before merging

For questions or bug reports, open an issue on GitHub.
