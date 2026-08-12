# AI RiskOps

AI RiskOps is an enterprise AI application risk operations platform for LLM, RAG, Copilot, and Agent applications.

It helps AI governance, security, risk, compliance, and internal AI application teams monitor AI application risk posture, inspect risk events, analyze risk drivers, review call logs, manage policies, configure application ingestion, and control platform access.

## Current Product Scope

- Executive AI risk overview
- Risk Analytics with metric summaries, driver analysis, drill-downs, and LLM-style insight copy
- Risk Event Workbench with evidence-oriented event details
- Model Call Logs
- Applications inventory and application-level risk profiles
- Admin surfaces for Policy Center, Application Setup, application credentials, ingestion audit, and User Access
- Backend APIs for scoped reads, analytics aggregation, model-call ingestion, credential validation, and permission management

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Prisma
- Postgres for online-ready persistent storage

## Local Setup

```bash
pnpm install
cp .env.example .env
pnpm run prisma:generate
pnpm run db:reset
pnpm build
pnpm start
```

Open:

```text
http://localhost:3000
```

## Useful Scripts

```bash
pnpm build
pnpm start
pnpm run prisma:generate
pnpm run db:push
pnpm run db:seed
pnpm run db:reset
```

## Environment Variables

```text
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
```

AI RiskOps now expects a Postgres connection string. For the fastest launch path, use Neon Postgres and copy its pooled connection string into `DATABASE_URL`.

## Key Documents

- [Living PRD](docs/living-prd.md)
- [Backend Readiness](docs/backend-readiness.md)
- [API Contract](docs/api-contract.md)
- [Authentication And Permission Design](docs/auth-permission-design.md)
- [Online Launch Plan](docs/online-launch-plan.md)
- [Demo Script](docs/demo-script.md)

## API Highlights

- `GET /api/session`
- `GET /api/overview/summary`
- `GET /api/analytics/summary`
- `GET /api/risk-events`
- `GET /api/call-logs`
- `GET /api/applications`
- `POST /api/ingest/model-call`
- `GET /api/admin/user-access`
- `PATCH /api/admin/user-access`

See [API Contract](docs/api-contract.md) for details.

## Access Model

The prototype includes three default permission sets:

- Global User
- App Owner
- Platform Admin

Production authorization should be based on authenticated users, permission sets, capabilities, data scope, and assigned application access. User Profile switching remains a demo abstraction until real authentication is selected.

## Online Readiness Notes

Before using AI RiskOps with persistent real data:

- Create a Neon Postgres database.
- Configure deployment environment variables and secret handling.
- Replace demo profile switching with real session identity or explicitly keep it as demo mode.
- Verify application credential ingestion in the deployed environment.
- Avoid committing `.env`, local databases, build caches, or generated exports.

Recommended first launch path:

```text
GitHub -> Vercel -> Neon Postgres
```

## Status

This project is currently an online-readiness prototype. The next priority is deployment preparation and real data ingestion hardening, not additional frontend feature expansion.
