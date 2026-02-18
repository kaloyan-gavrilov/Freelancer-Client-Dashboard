# Freelancer-Client Dashboard — Claude Instructions

## Project Overview

A monorepo web application for managing freelancer-client relationships: project tracking, invoicing, time logging, communication, and reporting.

## Architecture

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State | TanStack Query + Zustand |
| Backend | Node.js / Hono (or tRPC) |
| Database | PostgreSQL + Prisma |
| Auth | Clerk or better-auth |
| Testing | Vitest + Playwright |

## Planned Monorepo Structure

```
/
├── apps/
│   ├── web/           # React dashboard (main app)
│   └── api/           # Backend API server
├── packages/
│   ├── ui/            # Shared design-system components
│   ├── types/         # Shared TypeScript types & schemas
│   └── utils/         # Shared utility functions
├── .claude/           # Claude configuration (this folder)
└── package.json       # Root workspace config
```

## Key Domains

- **Clients** — contact info, project history, notes
- **Projects** — milestones, status, deadlines
- **Time Tracking** — log entries, reports per project/client
- **Invoicing** — generate, send, track payment status
- **Dashboard** — revenue analytics, upcoming deadlines, KPIs

## Development Workflow

```bash
pnpm install          # install all workspace deps
pnpm dev              # start all apps in dev mode
pnpm build            # build all packages
pnpm test             # run all tests
pnpm lint             # lint all packages
pnpm typecheck        # TypeScript check across workspace
```

## Code Conventions

- **TypeScript strict** — no `any`, explicit return types on exported functions
- **Functional components** — hooks only, no class components
- **File naming** — PascalCase for components, camelCase for utils/hooks
- **Imports** — absolute imports using workspace aliases (`@repo/ui`, `@repo/types`)
- **Components** — small, single-responsibility; co-locate tests and stories
- **Styling** — Tailwind utility classes; avoid inline styles
- **API** — always validate with Zod at boundaries

## Claude Behaviour

- Always read a file before editing it
- Prefer editing existing files over creating new ones
- Keep solutions minimal — no gold-plating or premature abstractions
- Ask before running destructive git commands (force-push, reset --hard)
- Use `pnpm` (never `npm` or `yarn`) for all package operations
- When generating UI, follow the frontend design principles in `.claude/commands/frontend-design.md`
- Reference context7 MCP for library documentation lookups
