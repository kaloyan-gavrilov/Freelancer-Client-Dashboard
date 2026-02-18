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

## Contributing

1. Branch off `main` following the naming convention: `feature/<ticket-id>-<short-description>`
2. Open a PR — the template will guide you through required sections
3. PRs require at least 1 approval and passing CI checks before merge
