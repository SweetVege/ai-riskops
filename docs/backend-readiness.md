# AI RiskOps Backend Readiness Review

This document defines the minimum backend scope needed to move AI RiskOps from a frontend prototype to a working V1 backend.

## 1. Current Product Surfaces

| Surface | Current purpose | Backend dependency |
|---|---|---|
| Overview | Risk posture, trends, category mix, top risky applications, severe snapshot | Aggregated risk events, model calls, application scope |
| Risk Events | Event queue, filters, event evidence, source context, review metadata | Risk event records, rule matches, evidence, source AI call context |
| Call Logs | AI model request trace, action, risk score, linked event | AI call logs, linked risk events, source prompt/output/context/tool calls |
| Applications | Application risk inventory and application-level risk profile | Applications, policies, integration health, application risk aggregates |
| Admin / Policy Center | Rule library, policy templates, thresholds, policy simulation | Rules, policy templates, rule operational stats, simulation endpoint |
| Admin / Application Setup | App onboarding, integration methods, setup validation | Applications, integration configs, environments, validation checks |

## 2. Backend V1 Principle

Backend V1 should support risk observability before workflow automation.

V1 should persist and serve:

- AI applications
- AI call logs
- Risk events
- Rule matches and evidence
- Policy and rule metadata
- User profile scope
- Application assignments
- Integration setup status

V1 should not yet build:

- Full case management
- Approval workflow
- SLA automation
- Comment threads
- Ticketing/SIEM/SOAR integrations
- Advanced RBAC UI
- Real-time streaming dashboards

## 3. User Profile And Scope Model

Current user profiles:

| User Profile | Scope | Admin surfaces |
|---|---|---|
| Global User | All applications | No |
| App Owner | Assigned applications | No |
| Platform Admin | All applications | Yes |

Minimum backend behavior:

- A user has one or more user profiles.
- App Owner scope is derived from assigned application IDs.
- Global User and Platform Admin can query global data.
- Platform Admin can access Admin / Policy Center and Admin / Application Setup.

Minimum tables:

| Table | Purpose |
|---|---|
| `users` | Human user identity |
| `user_profiles` | Profile assignment, such as Global User, App Owner, Platform Admin |
| `application_assignments` | Maps users to assigned applications |

## 4. Core Data Model

### 4.1 Application

Represents a monitored AI application.

Suggested fields:

| Field | Type | Notes |
|---|---|---|
| `id` | string | Primary key |
| `name` | string | Display name |
| `slug` | string | Stable application identifier |
| `owner_team` | string | Business or platform owner |
| `status` | enum | `connected`, `validating`, `pending_validation`, `not_connected` |
| `policy_id` | string | Bound policy template |
| `integration_method` | enum | `proxy`, `sdk`, `log_ingestion`, `agent_tool_audit` |
| `field_coverage` | number | 0-100 telemetry completeness |
| `created_at` | datetime | |
| `updated_at` | datetime | |

### 4.2 Application Environment

Represents environment-level setup state.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Primary key |
| `application_id` | string | Foreign key |
| `name` | enum | `production`, `test` |
| `status` | string | Live, validating, pending cutover, not connected |
| `calls_today` | number | Can be derived later |
| `last_seen_at` | datetime | Latest received telemetry |

### 4.3 Integration Validation Check

Represents setup readiness checks.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Primary key |
| `application_id` | string | Foreign key |
| `check_key` | string | Stable check identifier |
| `label` | string | Human-readable check |
| `status` | enum | `passed`, `failed`, `pending` |
| `updated_at` | datetime | |

### 4.4 AI Call Log

Represents each AI model request.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Primary key |
| `trace_id` | string | Trace correlation ID |
| `application_id` | string | Foreign key |
| `risk_event_id` | string nullable | Linked event |
| `occurred_at` | datetime | Required for real daily/monthly/quarterly trends |
| `user_ref` | string | Source user or actor identifier |
| `model` | string | Model name |
| `environment` | enum | `production`, `test` |
| `score` | number | 0-100 risk score |
| `level` | enum | `low`, `medium`, `high`, `severe` |
| `action` | enum | `allow`, `flag`, `redact`, `review`, `block` |
| `prompt` | text | May need encryption or field-level controls |
| `output` | text | May need encryption or field-level controls |
| `rag_context` | text | Optional |
| `tool_call` | text | Optional |
| `created_at` | datetime | |

### 4.5 Risk Event

Represents a risk record generated from an AI call.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Primary key |
| `application_id` | string | Foreign key |
| `call_log_id` | string nullable | Source call |
| `occurred_at` | datetime | Required for time aggregation |
| `title` | string | Event title |
| `user_ref` | string | Source user or actor |
| `department` | string | Business context |
| `model` | string | Model name |
| `environment` | enum | `production`, `test` |
| `score` | number | 0-100 risk score |
| `level` | enum | `low`, `medium`, `high`, `severe` |
| `action` | enum | Default system action |
| `review_status` | enum | `pending_review`, `in_progress`, `confirmed`, `false_positive`, `resolved`, `escalated` |
| `owner` | string | Review owner or queue |
| `sla` | string | Display SLA in V1; may become structured later |
| `risk_explanation` | text | Human-readable explanation |
| `affected_asset` | string | Asset or workflow affected |
| `recommendation` | text | Recommended next step |
| `updated_at` | datetime | |

### 4.6 Rule And Evidence

Rules should be normalized because they power Policy Center and event explanation.

Minimum tables:

| Table | Purpose |
|---|---|
| `risk_rules` | Rule metadata, category, trigger, base score, default action |
| `risk_event_rule_matches` | Many-to-many link between events and rules |
| `risk_event_evidence` | Evidence text, signal, impact, source location |
| `policy_templates` | Policy package by application type |
| `policy_template_rules` | Rules included in each policy |

## 5. Minimum API Inventory

### Overview

| Endpoint | Purpose |
|---|---|
| `GET /api/overview/summary` | KPI cards for current user scope |
| `GET /api/overview/risk-level-trend?period=daily` | Severity trend and High+Severe Rate |
| `GET /api/overview/risk-categories` | Risk category distribution |
| `GET /api/overview/top-applications` | Top risky applications |
| `GET /api/overview/severe-events` | Severe event snapshot |

### Risk Events

| Endpoint | Purpose |
|---|---|
| `GET /api/risk-events` | Filtered event queue |
| `GET /api/risk-events/:id` | Event detail, matched rules, evidence, source context |

V1 query filters:

- `application_id`
- `level`
- `action`
- `review_status`
- `q`
- `date_from`
- `date_to`

### Call Logs

| Endpoint | Purpose |
|---|---|
| `GET /api/call-logs` | Filtered model call logs |
| `GET /api/call-logs/:id` | Call detail and linked risk event |

V1 query filters:

- `application_id`
- `environment`
- `level`
- `action`
- `has_event`
- `q`
- `date_from`
- `date_to`

### Applications

| Endpoint | Purpose |
|---|---|
| `GET /api/applications` | Application risk inventory for current user scope |
| `GET /api/applications/:id` | Application risk profile, capabilities, integration health |
| `GET /api/applications/:id/risk-events` | Recent risk events for an application |

### Admin / Policy Center

| Endpoint | Purpose |
|---|---|
| `GET /api/admin/policy-templates` | Policy template list |
| `GET /api/admin/risk-rules` | Rule library |
| `GET /api/admin/rule-operational-stats` | Rule hits and false-positive rate |
| `POST /api/admin/policy-simulations` | Run a single-call policy simulation |

### Admin / Application Setup

| Endpoint | Purpose |
|---|---|
| `GET /api/admin/application-setup/summary` | Setup metrics |
| `GET /api/admin/application-setup/integration-methods` | Supported integration methods |
| `GET /api/admin/application-setup/applications` | Setup status and validation checklist |

## 6. Frontend Mock Data Replacement Plan

| Current mock | Backend replacement |
|---|---|
| `riskEvents` | `GET /api/risk-events`, `GET /api/risk-events/:id` |
| `aiCallLogs` | `GET /api/call-logs`, `GET /api/call-logs/:id` |
| `riskRules` | `GET /api/admin/risk-rules` |
| `policyTemplates` | `GET /api/admin/policy-templates` |
| `ruleOperationalStats` | `GET /api/admin/rule-operational-stats` |
| `connectedApps` | `GET /api/applications`, `GET /api/admin/application-setup/applications` |
| `assignedApplicationNames` | Derived from authenticated user assignments |
| `riskLevelTrendByPeriod` | Replace with backend aggregation using `occurred_at` |

## 7. Backend V1 Minimum Build Order

Recommended order:

1. Database schema and seed data
2. Application and assignment scope APIs
3. Risk Events APIs
4. Call Logs APIs
5. Overview aggregation APIs
6. Applications risk profile APIs
7. Policy Center read APIs
8. Application Setup read APIs
9. Policy simulation endpoint

This order lets the frontend replace mock data progressively without blocking on admin write workflows.

## 8. V0.20 Foundation Status

Completed:

- Added Prisma 7 and local SQLite persistence.
- Added `prisma/schema.prisma` as the backend data model.
- Added `prisma.config.ts` for datasource configuration.
- Added `lib/prisma.ts` with Prisma Client adapter initialization.
- Added `prisma/seed.mjs` with schema initialization and representative seed data.
- Added package scripts for Prisma generation and database seeding.
- Seeded local database at `prisma/dev.db`.

Current local seed counts:

| Entity | Count |
|---|---:|
| Users | 3 |
| Applications | 5 |
| Risk rules | 8 |
| Policy templates | 5 |
| Risk events | 4 |
| AI call logs | 4 |

Implementation note:

- `prisma db push` currently returns an empty schema engine error in this local environment.
- To keep backend implementation moving, `prisma/seed.mjs` initializes the SQLite tables directly before using Prisma Client to insert data.
- This should be revisited before production migration work. The production path should use formal migrations against the selected production database.

## 9. V0.21 API Foundation Status

Completed:

- Added shared request scope resolution.
- Added scoped Applications read APIs.
- Added scoped Risk Events read APIs.
- Added profile query parameter simulation:
  - `profile=global-user`
  - `profile=app-owner`
  - `profile=platform-admin`
- Added assigned-application enforcement for App Owner.

Implemented endpoints:

| Endpoint | Status | Scope behavior |
|---|---|---|
| `GET /api/applications` | Implemented | Global or assigned applications |
| `GET /api/applications/:id` | Implemented | 404 outside current scope |
| `GET /api/risk-events` | Implemented | Global or assigned application events |
| `GET /api/risk-events/:id` | Implemented | 404 outside current scope |

Risk Events filters implemented:

- `application_id`
- `level`
- `action`
- `review_status`
- `q`

Verification:

- App Owner receives only Customer Support Copilot, HR Policy Assistant, and Internal Knowledge Assistant.
- Platform Admin receives all seeded applications.
- App Owner cannot access Sales Knowledge Agent risk event detail.

Remaining before frontend API replacement:

- Frontend data adapter layer
- Loading and error states

## 10. V0.22 Call Logs API Status

Completed:

- Added scoped Call Logs read APIs.
- Added list and detail responses for source prompt, output, RAG context, tool calls, and linked risk events.
- Added assigned-application enforcement for App Owner.

Implemented endpoints:

| Endpoint | Status | Scope behavior |
|---|---|---|
| `GET /api/call-logs` | Implemented | Global or assigned application call logs |
| `GET /api/call-logs/:id` | Implemented | 404 outside current scope |

Call Logs filters implemented:

- `application_id`
- `environment`
- `level`
- `action`
- `has_event`
- `q`

Verification:

- App Owner receives only assigned-application call logs.
- Platform Admin receives all seeded call logs.
- App Owner cannot access Sales Knowledge Agent call log detail.
- Search query for `compensation` returns the HR Policy Assistant call log.

Remaining before frontend API replacement:

- Frontend data adapter layer
- Loading and error states

## 11. V0.23 Overview API Status

Completed:

- Added scoped Overview aggregation APIs.
- Added summary KPI aggregation.
- Added Risk Level Trend aggregation by `daily`, `monthly`, and `quarterly`.
- Added Risk Category Distribution aggregation from matched rule categories.
- Added Top Risky Applications aggregation and sorting.
- Added Severe Event Snapshot aggregation.
- Tightened application scope filtering so explicit application filters cannot override App Owner assigned-application scope.

Implemented endpoints:

| Endpoint | Status | Scope behavior |
|---|---|---|
| `GET /api/overview/summary` | Implemented | Global or assigned application aggregation |
| `GET /api/overview/risk-level-trend?period=daily` | Implemented | Global or assigned application aggregation |
| `GET /api/overview/risk-categories` | Implemented | Global or assigned application aggregation |
| `GET /api/overview/top-applications` | Implemented | Global or assigned application aggregation |
| `GET /api/overview/severe-events` | Implemented | Global or assigned application aggregation |

Aggregation rules:

- `modelCallsToday` currently counts scoped seeded call logs.
- `averageEventRiskScore` is the arithmetic average of scoped risk event scores.
- `High+Severe Rate` is `(high events + severe events) / total events`.
- Risk Category Distribution counts matched rules by rule category.
- Top Risky Applications sorts by Severe Count, then High Count, then Max Risk Score.
- Severe Event Snapshot sorts severe events by score, then occurred time.

Verification:

- App Owner summary is scoped to assigned applications.
- Platform Admin summary is global.
- App Owner Risk Level Trend shows only assigned-application severe events.
- App Owner Top Risky Applications ranks Customer Support Copilot before HR Policy Assistant because Severe Count is higher.
- App Owner Severe Event Snapshot excludes Sales Knowledge Agent.

Remaining before frontend API replacement:

- Frontend data adapter layer
- Loading and error states
- Decision on whether to migrate Overview first or finish Admin read APIs first

## 12. V0.24 Overview Frontend Replacement Status

Completed:

- Overview frontend now reads backend aggregation APIs.
- KPI cards read `/api/overview/summary`.
- Risk Level Trend reads `/api/overview/risk-level-trend` by selected period.
- Risk Category Distribution reads `/api/overview/risk-categories`.
- Top Risky Applications reads `/api/overview/top-applications`.
- Severe Event Snapshot reads `/api/overview/severe-events`.
- Overview updates when User Profile changes.
- Overview includes loading and error states for API reads.

Verification:

- Platform Admin Overview shows global seeded API data.
- App Owner Overview shows assigned-application seeded API data.
- App Owner Overview excludes Sales Knowledge Agent.
- Browser verification passed against local production server.

Remaining frontend replacements:

- Policy Center
- Application Setup

Important limitation:

- Policy simulation can still create local in-memory events and call logs, but those simulated records are not persisted into the backend database yet. Overview is now backend-driven, so simulated events will not change Overview until backend ingestion/write APIs exist.

## 13. V0.25 Risk Events Frontend Replacement Status

Completed:

- Risk Events frontend now reads backend APIs.
- Risk Event Workbench reads `/api/risk-events`.
- Risk Event detail reads `/api/risk-events/:id`.
- Existing level, action, review status, and search filters are mapped to backend query parameters.
- App Owner scope is enforced through backend API responses.
- Risk Event detail displays backend source prompt, output, matched rules, evidence, risk explanation, affected asset, recommendation, and review metadata.

Verification:

- Platform Admin Risk Events shows global backend event data.
- App Owner Risk Events shows assigned-application backend event data.
- App Owner Risk Events excludes Sales Knowledge Agent.
- Browser verification passed against local production server.

Implementation note:

- A corrupted `.next` cache caused missing route artifacts and transient API 500s during verification.
- Moving `.next` to `.next.bak-v025-risk-events-api` and rebuilding restored route artifacts under `.next/server/app`.

Remaining frontend replacements:

- Call Logs page
- Applications page
- Policy Center
- Application Setup

Important limitation:

- Policy simulation can still create local in-memory events and call logs, but those simulated records are not persisted into the backend database yet. Risk Events is now backend-driven, so simulated events will not appear in Risk Events until backend ingestion/write APIs exist.

## 14. V0.26 Call Logs Frontend Replacement Status

Completed:

- Call Logs frontend now reads backend APIs.
- Call Logs list reads `/api/call-logs`.
- Call Log detail reads `/api/call-logs/:id`.
- App Owner scope is enforced through backend API responses.
- Call Log detail displays backend source prompt, model output, RAG context, tool call, matched rules, and linked risk event metadata.
- Existing Call Logs layout and KPI cards are preserved.

Verification:

- `next build` passes.
- Call Logs API routes are included in the production build.
- Platform Admin Call Logs shows 4 global backend logs and includes Sales Knowledge Agent.
- App Owner Call Logs shows 3 assigned-application backend logs and excludes Sales Knowledge Agent.
- Call Log detail loads backend full prompt, model output, RAG context, and linked risk event metadata.

Remaining frontend replacements:

- Applications page
- Policy Center
- Application Setup

Important limitation:

- Policy simulation can still create local in-memory events and call logs, but those simulated records are not persisted into the backend database yet. Call Logs is now backend-driven, so simulated logs will not appear in Call Logs until backend ingestion/write APIs exist.

## 15. V0.27 Applications Frontend Replacement Status

Completed:

- Applications frontend now reads backend APIs.
- Application list reads `/api/applications`.
- Application detail reads `/api/applications/:id`.
- App Owner scope is enforced through backend API responses.
- Application detail displays backend policy binding, integration health, validation checks, and recent risk events.
- Existing Applications layout, KPI cards, risk inventory table, and detail panels are preserved.

Verification:

- `next build` passes.
- Platform Admin Applications shows 5 global backend applications and includes Sales Knowledge Agent and Finance Approval Agent.
- App Owner Applications shows 3 assigned applications and excludes Sales Knowledge Agent and Finance Approval Agent.
- Browser verification passed against local production server.

Remaining frontend replacements:

- Policy Center
- Application Setup

Important limitation:

- Policy simulation can still create local in-memory events and call logs, but those simulated records are not persisted into the backend database yet. Applications is now backend-driven, so simulated records will not change application metrics until backend ingestion/write APIs exist.

## 16. V0.28 Model Call Ingestion Write Path

Completed:

- Added `POST /api/ingest/model-call`.
- Ingestion accepts a single model-call payload with application, user, model, environment, data type, prompt, output, RAG context, and tool call fields.
- The endpoint reuses the current risk evaluation logic from `lib/risk-engine.ts`.
- Every ingested model call creates an `AiCallLog`.
- Risky calls create a linked `RiskEvent`.
- Generated risk events include matched rule records and evidence records.
- App Owner scope is enforced before write, so assigned-application restrictions apply to ingestion.
- Policy Simulation now calls the backend ingestion API instead of only creating local frontend records.
- Overview refreshes after successful Policy Simulation ingestion.

Verification:

- `next build` passes.
- `POST /api/ingest/model-call?profile=platform-admin` created a persistent call log and linked risk event:
  - `call-50e32a96`
  - `evt-85101aa0`
- `GET /api/call-logs?profile=platform-admin` returns the generated call log.
- `GET /api/risk-events?profile=platform-admin` returns the generated risk event.
- `GET /api/overview/summary?profile=platform-admin` reflects updated aggregate totals.
- Browser UI verification was not completed because browser automation was blocked by local browser security policy for `127.0.0.1:3001`.

Remaining backend hardening:

- Production authentication and API keys
- Idempotency keys
- Request schema validation
- Application credentials
- Policy-template-specific rule execution
- Write-path tests
- Ingestion audit metadata

## 17. V0.29 Risk Analytics Frontend Status

Completed:

- Added a Risk Analytics frontend page.
- Risk Analytics reuses existing read APIs instead of adding new backend endpoints:
  - `GET /api/risk-events`
  - `GET /api/call-logs`
  - `GET /api/applications`
- The page computes first-version analytics in the frontend:
  - High+Severe Rate
  - Risk Event Rate
  - Block Rate
  - Average Risk Score
  - Application, category, and rule driver contribution
  - Segment breakdowns by environment, data type, model, and user / role
- App Owner scoping is inherited from existing backend API filtering.

Backend implication:

- Dedicated analytics APIs are not required for this prototype version.
- If this page becomes a core product surface, the backend should eventually provide pre-aggregated driver and segment endpoints for performance, consistent definitions, and auditability.

Verification:

- `next build` passes.
- Local production preview starts on `http://127.0.0.1:3000/`.
- `GET /` returns `200 OK` from the local production server.
- Browser verification passed: Risk Analytics opens from navigation and renders metric cards, driver lists, investigation path, and segment breakdowns without backend API errors.

## 18. V0.30 Application Risk Explanation Frontend Status

Completed:

- Added an application-level "Why Is This App Risky?" module to Applications detail.
- The module reuses existing application detail data and recent risk events.
- The frontend computes:
  - Risk category drivers
  - Matched rule drivers
  - System action drivers
  - Highest-risk event focus
  - Telemetry coverage context

Backend implication:

- No new backend endpoint is required for this prototype version.
- If this module becomes core product functionality, the backend should eventually return application-level driver aggregates and explanation metadata as part of the application detail API or a dedicated application analytics endpoint.

Verification:

- `next build` passes.
- Browser verification passed: Applications detail renders the application risk explanation module without application API errors.

## 19. V0.31 Risk Analytics Filters And Drill-down Frontend Status

Completed:

- Added frontend filters to Risk Analytics:
  - Application
  - Severity
  - Environment
  - System Action
- Filtered metrics, driver lists, segment breakdowns, and drill-down evidence are computed from existing profile-scoped API responses.
- Application, category, and rule drivers are clickable.
- Drill-down Evidence displays focused event count, High+Severe Rate, highest-risk event summary, and top matching event rows.

Backend implication:

- No new backend endpoint is required for this prototype version.
- If Risk Analytics becomes a high-volume surface, the backend should provide filtered aggregate endpoints and cursor-backed drill-down event lists.

Verification:

- `next build` passes.
- Browser verification passed: Risk Analytics renders filters and Drill-down Evidence, and clicking an Application Driver activates the focused drill-down state.

## 20. V0.32 Risk Analytics To Risk Events Drill-through Status

Completed:

- Added frontend drill-through from Risk Analytics to Risk Events.
- Risk Events can apply analytics-originated filters for search query, severity, action, application scope, and environment scope.
- Risk Events displays the source of applied drill-through filters.
- Existing Risk Events API search now covers matched rule id, rule name, and rule category.
- Existing Risk Events API now accepts `environment`.

Backend implication:

- No new endpoint is required.
- Future backend work should decide whether analytic drill-through state should become URL-persisted query parameters, saved views, or server-side analytic sessions.

Verification:

- `next build` passes.
- Browser verification passed: clicking a Risk Analytics Application Driver and then "Open in Risk Events" opens Risk Events with the source banner and application-scoped event list.

## 21. V0.33 Risk Events URL-persisted Filters Status

Completed:

- Added frontend query-string persistence for Risk Events filters.
- Risk Events initializes from `page=risk-events` and supported filter parameters.
- Risk Events updates the browser URL as filters change.
- Risk Analytics drill-through writes the same query-string filter state.

Backend implication:

- No new backend endpoint is required.
- Existing Risk Events API query parameters already support the persisted filter state.
- Future work may add saved views or server-side share links if enterprise sharing needs exceed URL query strings.

Verification:

- `next build` passes.
- Browser verification passed:
  - Direct Risk Events URL query parameters restore filters.
  - Risk Analytics drill-through writes a shareable Risk Events URL with application scope and source metadata.

## 22. V0.34 Risk Events Saved Views Frontend Status

Completed:

- Added frontend-only saved views for Risk Events filters.
- Saved views restore search, level, system action, review status, application scope, and environment scope.
- Saved views reuse the existing URL-persisted Risk Events filter model.
- Saved views are stored in browser `localStorage`.

Backend implication:

- No backend endpoint is required for the prototype.
- A future backend implementation would need a saved-view table keyed by user or team, plus permission rules for shared views.
- Saved views should remain separate from risk remediation workflows.

Verification:

- `next build` passes.
- Browser verification should confirm save, apply, delete, URL sync, and refresh behavior.

## 23. V0.35 Risk Analytics Application Drill-down Frontend Status

Completed:

- Added frontend application-level drill-down analysis in Risk Analytics.
- Reused existing Risk Events, Call Logs, and Applications read APIs.
- Derived app-level metrics, category mix, environment mix, high-risk examples, and AI Insight copy from the current filtered frontend dataset.
- Added application-scoped Risk Events drill-through from the Application Risk Drill-down panel.

Backend implication:

- No new backend endpoint is required for the prototype.
- A future analytics backend could expose pre-aggregated application driver summaries, trend deltas, and LLM-generated insight text.
- If real LLM-powered interpretation is introduced, the backend should own prompt construction, access control, data minimization, and response persistence.

Verification:

- `pnpm build` passes.
- Smoke test confirms Policy Center, Application Setup, Risk Events, and Call Logs pages return HTTP 200.
- Smoke test confirms Policy Center and Application Setup APIs return backend data for Platform Admin.
- Smoke test confirms Risk Analytics and Applications pages return HTTP 200.
- Smoke test confirms Risk Analytics summary and drivers APIs return backend data.
- Smoke test confirms App Owner Applications API remains assigned-application scoped.

## 24. Backend V1 Data Model Alignment

Completed:

- Aligned Prisma schema with the confirmed Backend V1 data model.
- Replaced application assignment modeling with `UserApplicationAccess`, including per-application `permission`.
- Replaced policy-template rule joins with `PolicyRule`, including `enabled`, `thresholdOverride`, and `actionOverride`.
- Added required `RiskEvent.sourceCallLogId` so every risk event must originate from exactly one model call log.
- Updated ingestion flow to create the call log first, then create a risk event only when detection action is not `allow`.
- Updated read APIs to preserve existing frontend response shapes while using the stricter backend relations.
- Updated seed initialization to rebuild the local SQLite schema before inserting representative data.

Backend implication:

- Backend V1 now supports the product decision that risk events are generated from observed model calls, not manually created remediation records.
- Application access can now support users who own multiple applications with explicit `view` or `manage` permissions.
- Policy rules can later support per-template rule activation and threshold/action overrides without changing the rule catalog.

Verification:

- `pnpm run prisma:generate` passes.
- `pnpm run db:seed` passes.
- Database consistency check returns 3 users, 5 applications, 3 user application access records, 15 policy rules, 4 call logs, and 4 risk events.
- `pnpm build` passes.

## 25. Backend V1 API Hardening

Completed:

- Added shared API response helpers for success, created, and error responses.
- Added `success` and `meta.requestId` to successful API responses while preserving existing `scope`, `filters`, and `data` fields.
- Standardized API error responses with `success`, `error`, `errorCode`, `details`, and `meta.requestId`.
- Added ingestion JSON parsing protection.
- Added ingestion validation for application identifier, captured call content, environment enum, and maximum text-field length.
- Updated detail API 404 responses for Applications, Risk Events, and Call Logs.

Backend implication:

- Frontend consumers can continue reading existing response fields.
- API clients can now rely on stable success/error envelopes and request IDs.
- Ingestion is safer to expose as a prototype write path because malformed or incomplete requests fail before database writes.

Verification:

- `pnpm build` passes.
- Smoke test confirms Overview success response returns `success: true` and `meta.requestId`.
- Smoke test confirms invalid ingestion returns HTTP 400 with `VALIDATION_ERROR`.
- Smoke test confirms valid ingestion returns HTTP 201 and creates a linked Call Log and Risk Event.
- `pnpm run db:seed` was rerun after smoke testing to restore baseline demo data.

## 26. Backend V1 Risk Analytics Aggregation APIs

Completed:

- Added shared backend analytics aggregation helpers.
- Added `GET /api/analytics/summary`.
- Added `GET /api/analytics/drivers`.
- Supported current profile scope and analytics filters: `application_id`, `level`, `environment`, and `action`.
- Summary API returns risk events, model calls, High+Severe count/rate, risk event rate, block rate, average risk score, and blocked model calls.
- Drivers API returns application, risk category, matched rule, environment, department, user, and model driver groups.
- Driver rows include contribution, weighted severity score, risk events, High+Severe Rate, average risk score, block rate, and main driver.

Backend implication:

- Risk Analytics can now migrate from frontend-only aggregation toward backend-provided analysis results.
- Scope enforcement is centralized through existing profile simulation before analytics aggregation runs.
- Frontend can adopt these APIs incrementally because the existing read APIs remain unchanged.

Verification:

- `pnpm build` passes.
- Smoke test confirms Platform Admin analytics summary.
- Smoke test confirms App Owner analytics summary only includes assigned applications.
- Smoke test confirms driver aggregation and `application_id` / `environment` filters.

## 27. Backend V1 Risk Analytics Frontend Integration

Completed:

- Added `GET /api/analytics/applications/:id` for backend-backed application risk drill-down.
- Application analytics API returns app identity, app-level metrics, driver mix, recent high-risk examples, and deterministic AI Insight text.
- Risk Analytics frontend now fetches backend analytics summary and driver aggregation APIs.
- Risk Analytics frontend now fetches application-level analytics for the focused application drill-down.
- Existing raw Risk Events, Call Logs, and Applications reads remain as fallback and evidence-list sources.

Backend implication:

- Risk Analytics is now partially backend-backed while preserving existing frontend behavior.
- Application drill-down can be further migrated away from frontend-only event aggregation.
- The next backend step can focus on either richer analytics contracts or production ingestion contracts.

Verification:

- `pnpm build` passes.
- Smoke test confirms `/api/analytics/summary`.
- Smoke test confirms `/api/analytics/drivers`.
- Smoke test confirms `/api/analytics/applications/app-cs-copilot`.
- Smoke test confirms Risk Analytics page loads.

## 28. Backend V1 Production Ingestion Contract

Completed:

- Added a versioned production ingestion contract for model-call intake.
- Added `GET /api/ingest/model-call` to expose the current contract, supported headers, integration methods, and payload shape.
- Extended `POST /api/ingest/model-call` to accept the production payload shape while preserving compatibility with the earlier prototype payload.
- Supported SDK, gateway proxy, log API, and agent tool audit ingestion sources.
- Normalized contract version, ingestion source, trace ID, session ID, application identity, user context, model identity, content, RAG context, data type, tool call, and environment before risk evaluation.
- Returned ingestion metadata alongside the created Call Log, optional Risk Event, and risk evaluation result.
- Updated Policy Simulation ingestion to submit the new production-style payload.

Backend implication:

- AI RiskOps now has a clear boundary between raw model-call intake and downstream risk evaluation.
- Real application integrations can target a stable contract before full authentication, encryption, and gateway enforcement are implemented.
- The current API still uses profile-based scope simulation; production API-key authentication is intentionally not implemented yet.

Verification:

- `pnpm build` passes.
- Smoke test confirms `GET /api/ingest/model-call` returns the active ingestion contract.
- Smoke test confirms production-style `POST /api/ingest/model-call` creates a persistent Call Log and linked Risk Event.
- Smoke test confirms unsupported `context.dataType` returns HTTP 400 with `VALIDATION_ERROR`.
- Smoke test confirms the homepage returns HTTP 200.
- `pnpm run db:seed` was rerun after smoke testing to restore baseline demo data.

## 29. Backend V1 Application Credential Management

Completed:

- Added `ApplicationCredential` to the Prisma data model.
- Seeded application credential examples across Active, Rotation Required, and Revoked states.
- Added `GET /api/admin/application-credentials` for Platform Admin credential inventory.
- Added `POST /api/admin/application-credentials` for generating an application credential.
- Added `POST /api/admin/application-credentials/:id/rotate` for rotating credentials.
- Added `POST /api/admin/application-credentials/:id/revoke` for revoking credentials.
- Stored only key prefixes and SHA-256 hashes in the database; generated secrets are returned once by generate and rotate responses.
- Connected Admin / Application Setup to the credential API with status, source, prefix, last-used, and admin action controls.

Backend implication:

- Application Setup now owns operational application credential management.
- Applications remains a risk visibility surface, while Admin remains the setup and platform-control surface.
- The next backend milestone can connect `Authorization: Bearer <application_api_key>` on model-call ingestion to `ApplicationCredential.keyHash`.

Verification:

- `pnpm run prisma:generate` passes.
- `pnpm run db:seed` passes.
- `pnpm build` passes.
- Smoke test confirms Platform Admin can read User Access data.
- Smoke test confirms non-admin profiles are rejected from User Access APIs.
- Smoke test confirms User Access PATCH save path works for App Owner application assignments.
- Smoke test confirms the running User Access page returns HTTP 200.
- Smoke test confirms Platform Admin receives database-backed admin capabilities.
- Smoke test confirms App Owner receives assigned-application data scope and non-admin capabilities.
- Smoke test confirms non-admin profiles are rejected from Policy Center and credential management APIs.
- Smoke test confirms App Owner analytics CSV export still works.
- Smoke test confirms homepage returns HTTP 200 after restarting the built server.
- Smoke test confirms Platform Admin can list credentials.
- Smoke test confirms Global User receives `FORBIDDEN`.
- Smoke test confirms generate, rotate, and revoke credential actions.
- Smoke test confirms the homepage returns HTTP 200 after a clean `.next` rebuild.
- `pnpm run db:seed` was rerun after mutation smoke tests to restore baseline demo data.

## 30. Backend V1 Credential-authenticated Ingestion

Completed:

- Connected `POST /api/ingest/model-call` to `Authorization: Bearer <application_api_key>`.
- Hashes the provided Bearer token and resolves it against `ApplicationCredential.keyHash`.
- Allows credentials in Active and Rotation Required states to ingest model calls.
- Rejects unknown or revoked credentials with HTTP 401 `UNAUTHORIZED`.
- Resolves the application from the credential when Bearer auth is present, so production callers no longer need to provide `application.id` in the payload.
- Rejects payloads that provide a conflicting `application.id` for the authenticated credential.
- Updates credential `lastUsedAt` after successful credential-authenticated ingestion.
- Adds ingestion response metadata for `authMode`, `credentialId`, and `credentialStatus`.
- Updated the ingestion contract to describe current Bearer key behavior.

Backend implication:

- Model-call ingestion now has the first real application identity boundary.
- Production-style integrations can authenticate with app-scoped keys while the prototype still supports profile-based ingestion for demos.
- The next backend step can focus on raw data protection, rate limits, or migration of remaining frontend data surfaces.

Verification:

- `pnpm run prisma:generate` passes.
- `pnpm run db:seed` passes.
- `pnpm build` passes.
- Smoke test confirms a generated application credential can authenticate `POST /api/ingest/model-call`.
- Smoke test confirms Bearer-authenticated ingestion resolves the application without payload `application.id`.
- Smoke test confirms invalid Bearer keys return HTTP 401 `UNAUTHORIZED`.
- Smoke test confirms payload application mismatch returns HTTP 403 `FORBIDDEN`.
- Smoke test confirms credential `lastUsedAt` updates after successful ingestion.
- `pnpm run db:seed` was rerun after mutation smoke tests to restore baseline demo data.

## 31. Backend V1 Raw Content Protection

Completed:

- Added a shared data protection helper for captured AI call content.
- Masks email addresses, phone numbers, payment cards, Bearer tokens, API keys, private key blocks, and government-ID-like identifiers.
- Applies protection after risk evaluation and before storing newly ingested prompt, output, RAG context, and tool call content.
- Applies response-time masking for historical seeded Call Log and Risk Event detail APIs.
- Adds data protection metadata to Call Log, Risk Event source-call, and ingestion responses.
- Updated the ingestion contract to document masked storage and response behavior.

Backend implication:

- AI RiskOps can ingest production-style calls without exposing raw sensitive prompt/output content through normal APIs.
- Risk detection still runs against the submitted content before masking, preserving detection quality for DLP and secret-leakage rules.
- This is not yet full encryption-at-rest or an approval-based raw reveal workflow.

Verification:

- `pnpm build` passes.
- Smoke test confirms ingestion still evaluates sensitive raw content before masking.
- Smoke test confirms newly ingested prompt, output, RAG context, and tool call values are stored and returned in masked form.
- Smoke test confirms ingestion response includes data protection metadata.
- Smoke test confirms Call Log detail returns masked content.
- Smoke test confirms Risk Event detail source call log returns masked content.
- `pnpm run db:seed` was rerun after mutation smoke tests to restore baseline demo data.

## 32. Backend V1 Ingestion Request Audit

Completed:

- Added `IngestionRequestAudit` to the Prisma data model.
- Seeded successful and failed ingestion audit examples.
- Added `GET /api/admin/ingestion-audit` for Platform Admin ingestion health monitoring.
- Records audit metadata for ingestion success and failure paths.
- Captures status, auth mode, ingestion source, application, credential, trace ID, profile, HTTP status, error code, latency, call log ID, risk event ID, model, environment, and data protection mode.
- Connected Admin / Application Setup to the ingestion audit API with summary metrics and recent request rows.

Backend implication:

- Admins can now see whether production ingestion is actually working and why requests fail.
- Ingestion audit records intentionally avoid storing raw prompt, output, RAG context, or tool call content.
- This creates a foundation for future rate limiting, reliability monitoring, and integration troubleshooting.

Verification:

- `pnpm run prisma:generate` passes.
- `pnpm run db:seed` passes after generating the new Prisma Client.
- `pnpm build` passes.
- Smoke test confirms Platform Admin can read ingestion audit records.
- Smoke test confirms Global User receives `FORBIDDEN`.
- Smoke test confirms successful ingestion creates an audit record.
- Smoke test confirms failed ingestion creates an audit record.
- Smoke test confirms homepage returns HTTP 200 after a clean `.next` rebuild.
- `pnpm run db:seed` was rerun after mutation smoke tests to restore baseline demo data.

## 33. Backend V1 Policy Center APIs

Completed:

- Added `GET /api/admin/policy-center` for Platform Admin policy configuration visibility.
- Added `POST /api/admin/policy-center/templates/[id]/toggle` for enabling or disabling policy templates.
- Added `POST /api/admin/policy-center/rules/[id]/toggle` for enabling or disabling a risk rule across all bound policy templates.
- Connected Admin / Policy Center to backend policy template, rule binding, and operational-stat data.
- Preserved Policy Simulation as a frontend rule-engine sandbox for this milestone.

Backend implication:

- Policy Center is no longer purely mock-backed.
- Platform Admin can inspect current policy-template coverage, enabled rule bindings, 24h rule hits, and reviewed false-positive rates from persisted data.
- Rule toggles update `PolicyRule` bindings and synchronize `RuleOperationalStat.enabled`.
- This is still lightweight configuration control, not a full policy lifecycle system.

Verification:

- `pnpm build` passes.
- Smoke test confirms Platform Admin can read Policy Center data.
- Smoke test confirms Global User receives `FORBIDDEN`.
- Smoke test confirms policy template toggle works.
- Smoke test confirms risk rule toggle works.
- `pnpm run db:seed` was rerun after mutation smoke tests to restore baseline demo data.

## 34. Backend V1 Application Setup APIs

Completed:

- Added `GET /api/admin/application-setup` for Platform Admin setup visibility.
- Returns application setup status, integration method, field coverage, policy binding, environment state, validation checks, and latest credential state.
- Connected Admin / Application Setup top summary metrics to backend data.
- Connected Application Setup Status rows to backend application setup data.
- Kept credential generation, rotation, revocation, and ingestion audit on their existing backend APIs.

Backend implication:

- Application Setup is now mostly backend-backed without introducing application creation or editing yet.
- Platform Admin can see setup readiness from persisted application, environment, validation, policy, and credential records.
- This keeps Applications as the risk visibility surface while Application Setup remains the admin-only integration configuration surface.

Verification:

- `pnpm build` passes.
- Smoke test confirms Platform Admin can read Application Setup data.
- Smoke test confirms Global User receives `FORBIDDEN`.
- Smoke test confirms homepage returns HTTP 200 after restarting the built server.

## 35. Backend V1 Risk Analytics Drill-down API

Completed:

- Added `GET /api/analytics/drilldown` for backend-backed drill-down evidence.
- Supports application, category, rule, environment, department/data, model, and user driver scopes.
- Returns scoped risk-event count, High+Severe Rate, average score, max score, top application, top category, top rule, top event, event rows, and generated insight text.
- Connected Risk Analytics / Drill-down Evidence to the backend API with frontend fallback behavior.

Backend implication:

- Risk Analytics now handles one more analysis layer on the backend instead of relying only on frontend filtering over loaded events.
- Rule and category drill-downs are computed from persisted `RiskEventRuleMatch` records.
- The drill-down API supports analysis and investigation entry points, but does not create case-management or remediation workflow state.

Verification:

- `pnpm build` passes after a clean `.next` rebuild.
- Smoke test confirms drill-down API returns scoped evidence for a rule driver.
- Smoke test confirms homepage returns HTTP 200 after restarting the built server.

## 36. Backend V1 Risk Analytics Aggregation-First Frontend

Completed:

- Removed full Risk Events and Call Logs list loading from the Risk Analytics page initialization path.
- Risk Analytics now uses backend summary, driver, application drill-down, and evidence drill-down APIs for analytical values.
- The frontend still loads Applications as lightweight context for filters, application labels, field coverage, and drill-through IDs.
- Summary count badges now use backend `analyticsSummary` values instead of frontend-filtered event/log arrays.

Backend implication:

- Risk Analytics is now closer to a scalable analytics surface: it no longer needs raw event and log rows to render its core metrics.
- Raw Risk Event and Call Log loading remains in the dedicated Risk Events and Call Logs pages, where row-level investigation belongs.
- Frontend fallback paths remain available but are no longer the primary analytics data source.

Verification:

- `pnpm build` passes.
- Smoke test confirms Risk Analytics summary, driver, and drill-down APIs still return valid data.
- Smoke test confirms homepage returns HTTP 200 after restarting the built server.

## 37. Backend V1 Operations Write and Export Thin Slice

Completed:

- Added `GET /api/session` to expose the active profile, simulated user ID, data scope, and capability flags.
- Added `PATCH /api/risk-events/[id]` for lightweight review metadata updates.
- Added `POST /api/admin/application-setup` for Platform Admin application registration.
- Added `GET /api/analytics/report` for JSON and CSV analytics report export.
- Connected Risk Event detail review metadata updates to the backend.
- Connected Admin / Application Setup application registration to the backend.
- Connected Risk Analytics CSV export to the backend report API.

Backend implication:

- AI RiskOps now supports a minimal write path for review metadata without becoming a case-management workflow.
- Application Setup can create persisted application records before credential generation and ingestion validation.
- Permission capability discovery is explicit, but still profile-query based until a real identity provider is selected.
- Analytics export is backend-generated from aggregated data, not assembled from frontend row state.

Verification:

- `pnpm build` passes.
- Smoke test confirms session permissions API.
- Smoke test confirms review metadata update and restored baseline seed data.
- Smoke test confirms application registration and restored baseline seed data.
- Smoke test confirms analytics JSON/CSV report export.
- Smoke test confirms homepage returns HTTP 200 after restarting the built server.

## 38. Backend V1.1 Capability-Based Permission Refactor

Completed:

- Added centralized capability helpers in `lib/api/permissions.ts`.
- Replaced hard-coded Platform Admin checks in Admin, Policy Center, Credential, Application Setup, Ingestion Audit, and Analytics Report APIs.
- Kept profile-query based session simulation for the prototype.
- Preserved `GET /api/session` as the capability discovery endpoint for the frontend and future auth integration.

Backend implication:

- Route authorization now depends on capabilities such as `canManageCredentials`, `canCreateApplications`, `canViewPolicyCenter`, and `canExportAnalytics`.
- The product can later map SSO users, groups, or permission sets into the same capability model without rewriting each route.
- This is not yet real authentication, tenant isolation, SCIM provisioning, or enterprise SSO.

Verification:

- `pnpm build` passes.
- Smoke test confirms admin capability access and non-admin rejection for protected APIs.
- Smoke test confirms session capability discovery and analytics export behavior.
- Smoke test confirms homepage returns HTTP 200 after restarting the built server.

## 39. Backend V1.2 Persistent Permission Sets

Completed:

- Added persistent permission models: `PermissionSet`, `PermissionSetCapability`, and `UserPermissionSetAssignment`.
- Seeded permission sets for Global User, App Owner, and Platform Admin.
- Updated `/api/session` to return permissions from database-backed permission set assignments first.
- Updated protected API route authorization to use database-backed capability checks with profile-derived fallback behavior.

Backend implication:

- Permissions are no longer only hard-coded from the selected prototype profile.
- The same capability model can now support future admin-managed permission assignment, SSO group mapping, or provisioning sync.
- App Owner still uses assigned-application data scope, while Global User and Platform Admin use global data scope.
- This is still not real login, SSO, tenant isolation, SCIM, or a permission administration UI.

Verification:

- `pnpm run prisma:generate` passes.
- `pnpm run db:seed` passes.
- `pnpm build` passes.

## 40. Backend V1.3 User Access Administration

Completed:

- Added `canManageUserAccess` as a dedicated Platform Admin capability.
- Added `GET /api/admin/user-access` for users, permission sets, assigned applications, and access summary metrics.
- Added `PATCH /api/admin/user-access` for changing a user's permission set and assigned application scope.
- Added Admin / User Access frontend with user table, selected user detail, capability display, permission set selector, and assigned application editor.

Backend implication:

- Permission Sets are now visible and editable through a lightweight platform administration surface.
- App Owner access can be represented as multiple assigned applications instead of one hard-coded owner mapping.
- This is still not a full IAM system, approval workflow, SSO, SCIM, or custom capability builder.

Verification:

- `pnpm run prisma:generate` passes.
- `pnpm run db:seed` passes.
- `pnpm build` passes.

## 41. Backend V1.4 Backend Coverage Cleanup

Completed:

- Removed Policy Center frontend fallback to local policy template and rule operational sample data.
- Removed Application Setup frontend fallback to local connected application sample data.
- Removed Home-level initialization from local risk event and call log sample data.
- Added clearer Policy Center empty states when policy templates or rules are not returned by the API.
- Removed Risk Analytics fallback calculations from frontend event and call-log arrays.
- Removed the unused local connected application sample dataset from the frontend bundle.
- Updated Applications to wait for backend application data before selecting a default application.

Backend implication:

- Policy Center and Application Setup now behave as backend-backed Admin surfaces instead of silently rendering frontend sample data when API data is missing.
- Risk Events and Call Logs selection now starts empty and is populated by their dedicated backend APIs.
- Risk Analytics metrics, drivers, application drill-down, and evidence drill-down now show backend values or explicit empty states instead of frontend-derived fallback values.
- Some presentation-level logic remains frontend-side, especially Applications explanation and capability labels.

Verification:

- `pnpm build` passes.
- Smoke test confirms Policy Center, Application Setup, Risk Events, and Call Logs pages return HTTP 200.
- Smoke test confirms Policy Center and Application Setup APIs return backend data for Platform Admin.

## 42. Backend V1.5 API Contract Documentation

Completed:

- Added `docs/api-contract.md` as the current backend API contract reference.
- Documented response envelopes, scope simulation, capability checks, and data protection behavior.
- Documented API groups for Session, Overview, Risk Analytics, Risk Events, Call Logs, Applications, Admin, and Model Call Ingestion.
- Captured current limitations before real authentication, tenant isolation, and production deployment.

Backend implication:

- The project now has a single API reference for frontend/backend handoff, future auth design, and backend hardening.
- The contract reflects the current implementation rather than an aspirational production OpenAPI spec.

Verification:

- Documentation added and reviewed against existing route handlers.

## 43. Backend V1.6 Auth And Permission Design

Completed:

- Added `docs/auth-permission-design.md` as the backend-ready access-control design reference.
- Clarified that User Profile is a prototype/demo abstraction, while production authorization should use authenticated users, permission sets, capabilities, data scope, and application assignments.
- Documented default permission sets, capability matrix, App Owner multi-application scope, route authorization order, application credential ingestion, and implementation gaps.

Backend implication:

- The project now has a clear migration path from query-parameter profile simulation to real authenticated sessions.
- Existing Prisma models for users, permission sets, capabilities, and application access are aligned with the recommended V1 direction.
- Full SSO, SCIM, tenant isolation, custom capability editing, and enterprise provisioning remain intentionally out of scope for the immediate next step.

Verification:

- Design reviewed against `lib/api/scope.ts`, `lib/api/permissions.ts`, `prisma/schema.prisma`, seeded permission sets, and the current API contract.

## 44. Backend V1.7 Access Audit Log

Completed:

- Added `AccessAuditLog` to the Prisma schema and SQLite seed initialization.
- Added transactional audit writes to `PATCH /api/admin/user-access`.
- Added recent access audit logs to `GET /api/admin/user-access`.
- Updated `docs/api-contract.md` with the User Access audit behavior.

Backend implication:

- User Access changes now have a persistent before/after record covering actor, target user, permission set, and assigned application scope.
- The audit table is intentionally lightweight and does not depend on a foreign-key relationship to the actor user, keeping it compatible with future external identity providers.
- The current audit behavior covers User Access changes only; Policy Center, Application Credentials, and Application Setup changes can be added later through the same pattern.

Verification:

- `pnpm run prisma:generate` passes.
- `pnpm run db:seed` passes.
- `pnpm build` passes.
- Smoke test confirms Platform Admin can update App Owner access and the response includes the generated access audit log.

## 45. Backend V1.8 Recent Access Changes UI

Completed:

- Added a lightweight `Recent Access Changes` table to Admin / User Access.
- Connected the UI to backend `accessAuditLogs`.
- Displayed audit timestamp, action, actor, permission-set before/after state, and assigned-application scope count change.

Backend implication:

- Access audit logs are now visible in the same Admin surface where permission changes occur.
- This is intentionally not a full audit center; broader audit coverage can wait until the project is online and ingesting real data.

Verification:

- `pnpm build` passes.

## 46. Online Readiness And Real Data Focus

Immediate focus:

- Prepare a clean GitHub-ready repository state.
- Choose deployment target and production database approach.
- Define required environment variables and secret-handling rules.
- Verify production build and startup on the target environment.
- Confirm real data ingestion through application credentials.
- Document local setup, deployment setup, API contract, and demo flow in README.

Completed:

- Added GitHub-ready README, `.env.example`, and expanded `.gitignore`.
- Initialized local Git.
- Added GitHub Actions CI for install, Prisma Client generation, and production build.
- Added `docs/online-launch-plan.md`.
- Updated `pnpm build` to run Prisma Client generation before `next build`.

Defer:

- Full SSO, SCIM, tenant isolation, and custom capability builder.
- Dedicated audit center.
- More frontend-only analytics or governance workflow expansion.

## 47. Decisions Before Backend Implementation

Need product confirmation:

- Authentication provider and user identity source
- Whether raw prompt/output should be encrypted at rest in V1
- Whether `review_status` is read-only metadata or editable in V1
- Whether Policy Center is read-only in backend V1 or supports rule edits
- Whether Application Setup is read-only in backend V1 or supports real app creation
- Which database to use
- Which production authentication provider to use

Recommended V1 stance:

- Start with seeded data, read APIs, and single-call ingestion.
- Harden ingestion after the read model stabilizes.
- Keep Policy Center and Application Setup mostly read-only until the data model is proven.
