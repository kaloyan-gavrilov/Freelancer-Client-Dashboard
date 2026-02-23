# Freelancer-Client Project Management Dashboard

Platform for managing freelance projects — connecting clients with freelancers and tracking the full project lifecycle from bid to delivery.

**Team:** Zlaten Vek
**Stack:** React 18 + Vite · NestJS · PostgreSQL (Supabase) · Docker · GitHub Actions · GCP

---

## Architecture

### Frontend

A single-page application built with **React 18**, **TypeScript**, and **Vite**. State management uses **TanStack Query** for server state and local React state for UI concerns. The app communicates with the backend via a typed Axios client. In production the compiled static assets are uploaded to a **Google Cloud Storage** bucket fronted by **Cloud CDN** for global low-latency delivery.

### Backend

A **NestJS** REST API written in TypeScript. The architecture follows a layered approach: controllers handle HTTP concerns and Swagger documentation, services orchestrate business logic, and repository interfaces abstract data access via the Dependency Inversion Principle. Domain logic (state machine for project lifecycle, Strategy Pattern for bid ranking) lives in a dedicated `domain/` layer. Global validation pipes enforce DTO constraints; a global exception filter standardises error responses.

### Database

**PostgreSQL** managed by **Supabase**. The schema includes 15 tables with Row Level Security policies, database triggers for audit logging (project state history), rating recalculation, and status-transition validation. Supabase also provides JWT-based authentication, file storage for deliverables, and presigned download URLs.

### Deployment

Both services are containerised with **multi-stage Docker** builds. The backend image runs on **Google Cloud Run** (auto-scaling, pay-per-request). The frontend is served from **GCS + Cloud CDN**. **GitHub Actions** pipelines handle CI (lint → test → build) on every push/PR and CD (Docker push → Cloud Run deploy / GCS upload → CDN invalidation) on pushes to `main`.

---

## Repository Structure

```
/
├── frontend/          # React 18 + Vite + TypeScript
├── backend/           # NestJS + TypeScript
├── shared/            # Shared TypeScript types & enums
├── supabase/
│   ├── migrations/    # SQL migration files
│   └── db-schema.sql  # Full database schema
├── docs/
│   ├── adr/           # Architecture Decision Records
│   ├── api.md         # API request/response examples
│   └── ai-usage-log.md
├── .github/
│   └── workflows/     # CI/CD pipelines
└── docker-compose.yml
```

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 20.0.0 | Runtime for backend and frontend tooling |
| npm | >= 10.0.0 | Package manager (workspaces) |
| Docker & Docker Compose | Latest | Local containerised development |
| Supabase account | — | Auth, database, and file storage |
| GCP account (deploy only) | — | Cloud Run, GCS, Cloud CDN |

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-org/freelancer-client-dashboard.git
cd freelancer-client-dashboard
```

### 2. Install dependencies (all workspaces)

```bash
npm install
```

### 3. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Fill in the values from your Supabase project dashboard (**Settings → API**).

### 4. Start with Docker Compose

```bash
docker compose up
```

### 5. Or run each service individually

```bash
# Backend (hot-reload)
npm run start:dev --workspace=backend

# Frontend (Vite dev server)
npm run dev --workspace=frontend
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api/docs |
| PostgreSQL | localhost:5432 |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Public URL of your Supabase project | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Anon/public key (respects RLS) | `eyJhbGci...` |
| `SUPABASE_JWT_SECRET` | JWT secret for server-side token verification | `your-jwt-secret` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Public URL of your Supabase project | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key (safe for browser) | `eyJhbGci...` |
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000` |

---

## Running Tests

```bash
# Run all tests across workspaces
npm run test

# Backend tests only
npm run test --workspace=backend

# Backend tests with coverage
npm run test:coverage --workspace=backend

# Frontend tests only
npm run test --workspace=frontend

# Frontend tests with coverage
npm run test:coverage --workspace=frontend
```

---

## Workspace Commands

```bash
# Lint all packages
npm run lint

# Build all packages
npm run build

# Target a specific workspace
npm run lint --workspace=frontend
npm run lint:fix --workspace=backend
```

---

## CI/CD

GitHub Actions runs two separate pipelines defined in `.github/workflows/`.

| Workflow | Trigger path filter | Stages |
|----------|---------------------|--------|
| `backend.yml` | `backend/**`, `shared/**` | lint → test → build → docker push → Cloud Run deploy |
| `frontend.yml` | `frontend/**` | lint → test → build → GCS upload → CDN invalidation |

Docker push and deploy jobs run only on direct pushes to `main`. Lint, test, and build run on both push and PR events. A failing lint or test step blocks all downstream jobs.

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `GCP_PROJECT_ID` | Google Cloud project ID |
| `GCP_SA_KEY` | JSON key of a GCP service account |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (backend only) |
| `CLOUD_RUN_SERVICE_NAME` | Cloud Run service name for backend |
| `GCS_BUCKET_NAME` | GCS bucket name for frontend assets |
| `VITE_API_URL` | Production backend URL (injected at build) |
| `VITE_SUPABASE_URL` | Production Supabase URL (injected at build) |
| `VITE_SUPABASE_ANON_KEY` | Production Supabase anon key (injected at build) |

---

## Deployed URLs

| Service | URL |
|---------|-----|
| Frontend | https://freelancer-dashboard.example.com |
| Backend API | https://api.freelancer-dashboard.example.com |
| Swagger Docs | https://api.freelancer-dashboard.example.com/api/docs |

---

## Documentation

- [API Request/Response Examples](docs/api.md)
- [Architecture Decision Records](docs/adr/)
- [AI Usage Log](docs/ai-usage-log.md)

---

## Contributing

1. Branch off `main` following the naming convention: `feature/<ticket-id>-<short-description>`
2. Open a PR — the template will guide you through required sections
3. PRs require at least 1 approval and passing CI checks before merge
