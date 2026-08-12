# AI RiskOps Online Launch Plan

This document defines the minimum work required to put AI RiskOps on GitHub, deploy it online, and start ingesting real model-call data.

The current priority is launch readiness, not additional product feature expansion.

## 1. Recommended Launch Path

Recommended first online stack:

| Layer | Recommendation | Reason |
|---|---|---|
| Source control | GitHub | Standard project hosting and CI |
| App hosting | Vercel | Fastest path for a Next.js prototype |
| Production database | Neon Postgres or Supabase Postgres | Persistent online data for Prisma |
| Ingestion auth | Application API keys | Already supported by `POST /api/ingest/model-call` |
| Human auth | Demo profile mode first | Avoid delaying launch with full SSO |

## 2. Current Readiness

Ready:

- Next.js production build passes.
- Local Git repository is initialized.
- `.gitignore` excludes environment files, local SQLite DB, caches, generated output, and dependencies.
- README exists with product scope, local setup, API links, and readiness notes.
- GitHub CI workflow exists.
- API contract exists.
- Application credential ingestion exists.
- Admin access audit logs exist.

Not ready for real persistent online data:

- Prisma schema currently uses SQLite.
- Runtime Prisma client currently uses `@prisma/adapter-better-sqlite3`.
- No production Postgres adapter or Postgres schema has been installed/configured yet.
- No online database has been provisioned.
- No production environment variables have been configured.
- Demo User Profile switching is still the human access mechanism.

## 3. Minimum GitHub Steps

1. Review ignored files.
2. Create the first local commit.
3. Create a GitHub repository.
4. Add GitHub remote.
5. Push `main`.
6. Confirm GitHub Actions build passes.

## 4. Minimum Deployment Steps

1. Choose online database provider.
2. Convert Prisma from SQLite to Postgres.
3. Add the required Postgres Prisma driver adapter.
4. Create migration or production schema setup path.
5. Configure deployment environment variables.
6. Deploy to Vercel.
7. Run seed or controlled demo data setup against the production database.
8. Verify:
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

Recommended choice:

- Neon Postgres if the goal is fastest Vercel-friendly setup.
- Supabase Postgres if the project may later need built-in auth, storage, or dashboard tooling.

## 7. Deferred Until After Launch

- Full SSO.
- SCIM provisioning.
- Tenant isolation.
- Custom permission-set builder.
- Dedicated audit center.
- More frontend-only analytics expansion.
- Full remediation or case-management workflows.

## 8. Immediate Next Decision

Before code changes for production database support, choose:

```text
Neon Postgres or Supabase Postgres
```

After that decision, the next engineering step is to migrate Prisma runtime and schema from SQLite to Postgres.
