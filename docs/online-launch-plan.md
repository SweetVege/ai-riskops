# AI RiskOps Online Launch Plan

This document defines the minimum work required to put AI RiskOps on GitHub, deploy it online, and start ingesting real model-call data.

The first online launch path has been completed with GitHub, Vercel, and Neon Postgres. The current priority is launch hardening, real ingestion readiness, and secret hygiene, not additional frontend-only feature expansion.

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
- GitHub repository is connected.
- Vercel production deployment is live.
- Neon Postgres is configured as the persistent database.
- Core production APIs have been verified online:
  - `/api/overview/summary`
  - `/api/applications`
  - `/api/risk-events`

Still required before real sensitive production data:

- Rotate setup-time database credentials.
- Update `DATABASE_URL` in Vercel after credential rotation.
- Update local `.env` after credential rotation.
- Confirm ingestion credentials and audit logs in the deployed environment.
- Demo User Profile switching is still the human access mechanism.

## 3. Minimum GitHub Steps

1. Review ignored files.
2. Create the first local commit.
3. Create a GitHub repository.
4. Add GitHub remote.
5. Push `main`.
6. Confirm GitHub Actions build passes.

## 4. Minimum Deployment Steps

Completed first deployment steps:

1. Created a Neon Postgres database.
2. Configured `DATABASE_URL` locally and in Vercel.
3. Ran `pnpm run db:reset` against Neon.
4. Deployed to Vercel.
5. Confirmed the Vercel build passes.
6. Verified:
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

1. Rotate the Neon database password.
2. Update Vercel `DATABASE_URL`.
3. Update local `.env`.
4. Re-run production smoke checks against:
   - `https://ai-riskops.vercel.app`
   - `https://ai-riskops.vercel.app/api/overview/summary`
   - `https://ai-riskops.vercel.app/api/applications`
   - `https://ai-riskops.vercel.app/api/risk-events`
