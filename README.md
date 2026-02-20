# Freelancer-Client Project Management Dashboard

Platform for managing freelance projects — connecting clients with freelancers and tracking the full project lifecycle from bid to delivery.

**Team:** Zlatеn Vek
**Stack:** React 18 + Vite · NestJS · PostgreSQL (Supabase) · Docker · GitHub Actions · GCP

---

## Repository Structure

```
/
├── frontend/        # React 18 + Vite + TypeScript
├── backend/         # NestJS + TypeScript
├── shared/          # Shared TypeScript types & enums
├── supabase/
│   ├── migrations/  # SQL migration files
│   └── seed.sql     # Local dev seed data
├── docs/
│   └── adr/         # Architecture Decision Records
├── .github/
│   ├── workflows/   # CI/CD pipelines
│   └── PULL_REQUEST_TEMPLATE.md
└── docker-compose.yml
```

---

## Quick Start

### Prerequisites
- Node.js ≥ 20
- npm ≥ 10
- Docker & Docker Compose

### Install dependencies (all workspaces)

```bash
npm install
```

### Run locally with Docker Compose

```bash
cp .env.example .env   # fill in Supabase credentials
docker compose up
```

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:5173  |
| Backend  | http://localhost:3000  |
| Database | localhost:5432         |

### Run each package individually

```bash
# Frontend
npm run dev --workspace=frontend

# Backend
npm run start:dev --workspace=backend
```

---

## Workspace Commands

```bash
# Lint all packages
npm run lint

# Test all packages
npm run test

# Build all packages
npm run build

# Target a specific workspace
npm run lint --workspace=frontend
npm run test --workspace=backend
```

---

## Shared Types

The `shared/` package exports TypeScript enums used by both frontend and backend:

```ts
import { UserRole, ProjectStatus } from '@fcd/shared';
```

---

## Architecture Decision Records

See [docs/adr/](docs/adr/) for architectural decisions.

---

## CI/CD

GitHub Actions runs two separate pipelines defined in `.github/workflows/`.

| Workflow | Trigger path filter | Stages |
|---|---|---|
| `backend.yml` | `backend/**`, `shared/**` | lint → test → build → docker push → Cloud Run deploy |
| `frontend.yml` | `frontend/**`, `shared/**` | lint → test → build → GCS upload → CDN invalidation |

Docker push and deploy jobs run only on direct pushes to `main`. Lint, test, and build run on both push and PR events. A failing lint or test step blocks all downstream jobs — no `continue-on-error` is set anywhere.

See [docs/ci-cd-diagram.md](docs/ci-cd-diagram.md) for Mermaid flowcharts of both pipelines.

### Required GitHub Secrets

Configure the following secrets under **Settings → Secrets and variables → Actions** in the repository:

| Secret | Description |
|---|---|
| `GCP_PROJECT_ID` | Google Cloud project ID (e.g. `my-project-123456`) |
| `GCP_SA_KEY` | JSON key of a GCP service account with roles: Artifact Registry Writer, Cloud Run Admin, Storage Object Admin, Compute Load Balancer Admin |
| `SUPABASE_URL` | Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (backend only — keep confidential) |
| `CLOUD_RUN_SERVICE_NAME` | Name of the Cloud Run service to deploy the backend to |
| `GCS_BUCKET_NAME` | Name of the GCS bucket AND the URL map used for Cloud CDN |

---

## Contributing

1. Branch off `main` following the naming convention: `feature/<ticket-id>-<short-description>`
2. Open a PR — the template will guide you through required sections
3. PRs require at least 1 approval and passing CI checks before merge
