# AI RiskOps Online Launch Plan

This document defines the minimum work required to put AI RiskOps on GitHub, deploy it online, and start ingesting real model-call data.

The current priority is launch readiness, not additional product feature expansion.

## 1. Recommended Launch Path

Recommended first online stack:

| Layer | Recommendation | Reason |
|---|---|---|
| Source control | GitHub | Standard project hosting and CI |
| App hosting | Vercel | Fastest path for a Next.js prototype |
| Production database | Neon Postgres | Fastest Vercel-friendly persistent data path for Prisma |
| Ingestion auth | Application API keys | Already supported by `POST /api/ingest/model-call` |
| Human auth | Demo profile mode first | Avoid delaying launch with full SSO |

## 2. Current Readiness

Ready:

- Next.js production build passes.
- Local Git repository is initialized.
- `.gitignore` excludes environment files, local databases, caches, generated output, and dependencies.
- README exists with product scope, local setup, API links, and readiness notes.
- GitHub CI workflow exists.
- API contract exists.
- Application credential ingestion exists.
- Admin access audit logs exist.
- Prisma schema has been moved to Postgres.
- Runtime Prisma client uses the Postgres adapter.

Still required for real persistent online data:

- Neon database must be provisioned.
- `DATABASE_URL` must be configured locally and in Vercel.
- `pnpm run db:reset` must be run against the selected Neon database before demo use.
- Demo User Profile switching is still the human access mechanism.

## 3. Minimum GitHub Steps

1. Review ignored files.
2. Create the first local commit.
3. Create a GitHub repository.
4. Add GitHub remote.
5. Push `main`.
6. Confirm GitHub Actions build passes.

## 4. Minimum Deployment Steps

1. Create a Neon Postgres database.
2. Configure `DATABASE_URL` locally and in Vercel.
3. Run `pnpm run db:reset` against Neon.
4. Deploy to Vercel.
5. Confirm the GitHub Actions and Vercel builds pass.
6. Verify:
   - `/`
   - `/api/session`
   - `/api/overview/summary`
   - `/api/admin/user-access`
   - `POST /api/ingest/model-call`

## 5. Minimum Real Data Ingestion Steps

1. Create or use an application in Admin / Application Setup.
2. Generate an application credential.
3. Send model-call records to:

```text
POST /api/ingest/model-call
Authorization: Bearer <application_api_key>
```

4. Confirm the call appears in Call Logs.
5. Confirm any generated risk event appears in Risk Events.
6. Confirm Overview and Risk Analytics metrics update from the ingested record.

## 6. Recommended V1 Database Decision

Use Postgres for online deployment.

Do not use local SQLite for online real data because serverless deployment storage is not durable and does not support a reliable multi-user operating model.

Selected choice:

- Neon Postgres for the first online version.

Supabase can be reconsidered later if the product needs built-in auth, storage, or broader backend-as-a-service tooling.

## 7. Deferred Until After Launch

- Full SSO.
- SCIM provisioning.
- Tenant isolation.
- Custom permission-set builder.
- Dedicated audit center.
- More frontend-only analytics expansion.
- Full remediation or case-management workflows.

## 8. Immediate Next Step

Create a Neon Postgres project and provide:

```text
DATABASE_URL
```

Then run:

```bash
pnpm run db:reset
pnpm build
```
