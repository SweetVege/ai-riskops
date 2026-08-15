# AI RiskOps Demo Script

Use this script for portfolio walkthroughs, recruiter screens, product interviews, and technical interviews. It is written to be usable as a spoken track, not only as product documentation.

Live demo:

```text
https://ai-riskops.vercel.app
```

Repository:

```text
https://github.com/SweetVege/AI-RiskOps
```

## One-Minute Pitch

AI RiskOps is an enterprise AI application risk operations platform for LLM, RAG, Copilot, and Agent applications.

The problem is that enterprises are shipping AI applications faster than governance teams can understand what those apps are doing. Traditional logs can show requests and errors, but they do not explain AI-specific risks like prompt injection, sensitive data leakage, unsafe agent tool use, unauthorized access, or risky model output.

AI RiskOps provides an observability and risk operations layer. It records model calls, detects risk events, explains matched rules and evidence, and helps governance leaders, analysts, app owners, and platform admins understand AI risk from the right scope.

## What To Emphasize

- This is a working online prototype, not a static mockup.
- The demo uses Neon Postgres with 5,000+ seeded model calls, 620+ risk events, and 5,000+ ingestion audit records.
- Product surfaces are API-backed: Overview, Risk Analytics, Risk Events, Call Logs, Applications, and Admin.
- The product focuses on recording, measuring, and explaining AI risk; it does not try to replace full audit, case management, or remediation platforms.
- User Profile switching is demo-mode access simulation, not production authentication.

## 3-Minute Demo Flow

### 1. Overview: Enterprise AI Risk Posture

Click path:

```text
Overview
```

Talk track:

- This is the executive and governance view of AI application risk.
- It separates model-call volume from actual risk events and blocked actions.
- The goal is to help leaders quickly see whether AI risk is increasing, which applications are driving it, and which risk categories matter most.

Point out:

- Model Calls Today
- Risk Events
- Blocked
- Average Event Risk Score
- Risk Level Trend
- Risk Category Distribution
- Top Risky Applications
- Severe Event Snapshot

Explain:

- The stacked bars show event volume by severity.
- The blue line shows High+Severe Rate.
- Top Risky Applications is ranked by Severe Count first.
- Severe Event Snapshot gives a direct path into detailed event investigation.

### 2. Risk Analytics: Explain What Changed

Click path:

```text
Risk Analytics
```

Talk track:

- Overview tells us what happened; Risk Analytics helps explain why it happened.
- Analysts can break down risk by application, category, matched rule, environment, user role, and data type.
- The LLM-style insight copy is designed to help analysts summarize the likely drivers behind severe-risk increases.

Point out:

- Risk Event Rate
- High+Severe Rate
- Average Risk Score
- Block Rate
- Driver analysis
- Drill-down entry points into Risk Events

### 3. Risk Events: Evidence-Based Investigation

Click path:

```text
Risk Events
```

Talk track:

- Risk Events is the analyst workbench.
- It is not intended to be a full remediation workflow; it helps security, risk, and compliance teams discover issues and build governance actions with app teams.
- Each event has severity, system action, human review status, owner, SLA, matched rules, and evidence.

Point out:

- Search
- Risk level filter
- System action filter
- Human review filter
- Event title
- Risk level
- System action
- Human review status
- SLA

Open one severe event and explain:

- Matched Rules & Evidence connects the detection rule to concrete model-call evidence.
- System Action shows what AI RiskOps did automatically, such as block, redact, review, or flag.
- Human Review Status shows what the operations team has determined after review.
- Linked Call Log keeps the event traceable back to the original model call.

### 4. Call Logs: The Audit Backbone

Click path:

```text
Call Logs
```

Talk track:

- Call Logs are the audit backbone of the product.
- Every risk event should be traceable to a source model call.
- Logs include application, model, environment, prompt, output, RAG context, tool call, score, action, and linked risk event metadata.
- Standard API responses mask sensitive raw content by default.

Point out:

- Call ID
- Trace ID
- Application
- Model
- Risk score
- Action
- Linked event

### 5. Applications: App-Level Risk Profiles

Click path:

```text
Applications
```

Talk track:

- Applications shows risk posture by AI application.
- This matters because app owners usually care about the apps they own, while governance leaders care about the global portfolio.
- In demo mode, App Owner profile only sees assigned applications and related data.

Point out:

- Application status
- Owner team
- Integration method
- Field coverage
- Application-level risk profile
- App Owner scoped access behavior

### 6. Admin: Platform Configuration

Click path:

```text
Admin
```

Talk track:

- Admin separates platform configuration from normal risk observation.
- Platform Admin users can manage Policy Center, Application Setup, application credentials, ingestion audit, and User Access.
- This keeps sensitive platform controls away from normal read-only users.

Point out:

- Policy Center
- Application Setup
- Credential generation, rotation, and revocation
- Ingestion audit
- User Access

Close:

- The full path is: AI application call -> ingestion API -> risk rules -> call log -> risk event -> analytics and dashboards.
- The current product is ready as a portfolio demo and product prototype; production use would require real authentication, tenant boundaries, credential rotation, and data-retention decisions.

## 10-Minute Demo Flow

### 1. Establish The Business Problem

Talk track:

- Enterprises are adopting copilots, RAG systems, and Agents quickly.
- These systems introduce new operational risks: prompt injection, RAG contamination, sensitive data leakage, unsafe tool execution, unauthorized access, and abuse patterns.
- Governance teams need more than raw logs. They need risk metrics, evidence, application-level views, and policy controls.

### 2. Start With Overview

Click path:

```text
Overview
```

Talk track:

- This page is built for governance leaders and AI risk owners.
- It gives a portfolio-level view across enterprise AI applications.
- The charts are designed to answer: How much usage do we have, how much risk is being detected, what is being blocked, and which apps or categories are driving the risk?

Demo actions:

- Switch Daily / Monthly / Quarterly on Risk Level Trend.
- Point to High+Severe Rate and explain it as risk mix, not only volume.
- Open the Severe Event Snapshot entry point into Risk Events.

### 3. Use Risk Analytics To Explain Drivers

Click path:

```text
Risk Analytics
```

Talk track:

- Risk Analytics is the bridge between a management dashboard and detailed event investigation.
- It helps analysts explain why metrics moved.
- The page supports application, category, rule, environment, user role, and data-type analysis.

Demo actions:

- Apply a filter.
- Open an application drill-down if available.
- Use drill-through into Risk Events.

### 4. Investigate A Severe Event

Click path:

```text
Risk Events
```

Talk track:

- This page is for security, risk, and compliance teams.
- It intentionally avoids becoming a full case-management workflow.
- The product records and explains risk, while downstream remediation can happen in existing governance or ticketing systems.

Demo actions:

- Search for a rule such as `PI-001`, `DLP-001`, `ACCESS-001`, or `TOOL-001`.
- Filter by Severe or High.
- Select a severe event.
- Walk through matched rules, evidence, affected asset, recommended action, linked call log, owner, SLA, and review status.

### 5. Trace To The Source Call

Click path:

```text
Call Logs
```

Talk track:

- The event is not an isolated alert.
- It is connected to the original model call, context, output, and tool action.
- This lets teams explain the event to the application owner and tune policy only when evidence supports it.

### 6. Show Application Scope

Click path:

```text
Applications
```

Talk track:

- A governance leader can see the global portfolio.
- An app owner should only see assigned applications.
- The prototype demonstrates this with User Profile switching and application-scoped API responses.

Demo actions:

- Switch to App Owner profile.
- Show that Overview, Risk Analytics, Risk Events, Call Logs, and Applications are scoped to assigned apps.
- Switch back to Platform Admin.

### 7. Show Admin Configuration

Click path:

```text
Admin
```

Talk track:

- Platform Admin is where the system itself is configured.
- Policy Center controls templates and rules.
- Application Setup controls onboarding, credentials, and validation checks.
- User Access controls who can view or manage platform capabilities.

Demo actions:

- Open Policy Center and explain rule templates.
- Open Application Setup and show credential / validation status.
- Open ingestion audit to show records of accepted and rejected ingestion requests.
- Open User Access and explain capability-based access instead of hard-coded job roles.

### 8. Close With Delivery Scope

Talk track:

- The prototype is online and API-backed.
- It uses Next.js, Prisma, Neon Postgres, GitHub Actions, and Vercel.
- The seeded dataset demonstrates scale with 5,000+ model calls and 620+ risk events.
- The next production steps would be authentication, tenant isolation, credential rotation, and raw-data retention policy.

## Technical Interview Track

Use this section when the interviewer asks how the system is implemented.

### Architecture

```text
LLM / RAG / Agent application
-> model-call ingestion API
-> policy and risk rule evaluation
-> call log persistence
-> risk event persistence
-> matched rule and evidence records
-> analytics aggregation APIs
-> scoped frontend views
```

### Backend Highlights

- Next.js API routes provide scoped reads and write paths.
- Prisma connects the app to Neon Postgres.
- Model-call ingestion can create Call Logs, Risk Events, matched evidence, ingestion audit records, and Application Setup validation updates.
- API responses use stable success/error envelopes.
- Normal read APIs mask raw prompt, output, context, and tool content by default.

### Frontend Highlights

- Product surfaces are built in Next.js App Router with React and TypeScript.
- Overview and Risk Analytics use API-backed aggregates.
- Risk Events supports URL-persisted filters and event drill-through.
- User Profile switching demonstrates access scope for Global User, App Owner, and Platform Admin.

### Data And Metrics

- Seeded demo dataset: 5,000+ model calls, 620+ risk events, and 5,000+ ingestion audit records.
- Core metrics include Risk Event Rate, High+Severe Rate, Average Risk Score, Block Rate, Rule Hit Rate, and Log Coverage Score.
- Top Risky Applications sort by Severe Count, then High Count, then Max Risk Score.
- Human-reviewed false-positive rate should be based on completed review outcomes, not system guesses.

### Quality And Deployment

- GitHub Actions runs contract tests and build checks.
- A risk status contract test prevents backend/frontend enum drift from breaking Risk Events.
- Vercel hosts the public demo.
- Neon Postgres stores persistent demo data.

## Common Questions

### Is this a security scanner?

Not exactly. AI RiskOps is an observability and risk operations layer. It records model-call activity, detects risk events, explains evidence, and helps teams understand and govern AI application risk.

### Does it replace remediation or audit systems?

No. The product intentionally avoids becoming a full audit, ticketing, or case-management platform. It helps teams find and explain risk, then existing governance or remediation systems can handle downstream workflow.

### Where does false-positive rate come from?

The formal metric should come from completed human review outcomes.

```text
Human-reviewed false-positive rate =
false_positive / (confirmed + false_positive + resolved + escalated)
```

Pending and in-review events should not enter the denominator.

### What happens if a policy template is disabled?

Disabled templates should not be assigned to newly onboarded applications. Existing applications should keep a stable last-effective policy until a Platform Admin migrates them. Enterprise baseline rules should still apply.

### Does this require sending private data to another model?

Not necessarily. The first implementation can use deterministic rule evaluation and metadata-driven scoring. Future LLM-as-judge features should be optional, scoped, and governed by the enterprise data handling policy.

### What is the difference between Call Logs and Risk Events?

Call Logs are the source audit trail of AI activity. Risk Events are generated when the system detects a meaningful risk that requires visibility, action, or review.

### Why have User Profiles instead of hard-coded roles?

Companies often have teams that do not map cleanly to fixed job titles. AI RiskOps uses capability and scope concepts so a user can request or receive the level of access they need.

## Current Prototype Limitations

- User Profile switching is demo-mode access simulation, not production authentication.
- The demo is single-tenant and should not be used for sensitive production data without tenant isolation.
- Raw-content retention, masking, and deletion policy still need a production decision.
- Application credentials should be managed in source-system secret stores before real sensitive data use.
- The detection logic is deterministic and early-stage; richer semantic detection should be added carefully with data-governance controls.

## Suggested Next Roadmap

1. Add production authentication and session identity.
2. Add tenant isolation and production authorization boundaries.
3. Finalize application credential handling and source-system secret-management guidance.
4. Add API route tests for scoped reads and ingestion writes.
5. Define production raw-content retention, masking, and deletion policy.
6. Add policy versioning and publish workflow.
7. Add optional LLM-assisted analysis for complex semantic risk cases.
