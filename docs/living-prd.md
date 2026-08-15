# AI RiskOps Living PRD

## 1. Product Positioning

AI RiskOps is an enterprise AI application risk operations platform.

The product helps internal AI application teams and enterprise security/risk teams monitor, audit, review, and control risks introduced by LLM, RAG, Copilot, and Agent applications.

V0.1 is a demonstrable security operations prototype. It focuses on making AI application risks visible, explainable, and reviewable.

## 2. Target Users

- Enterprise internal AI application teams
- Enterprise security teams
- Enterprise risk control and compliance teams

## 3. V0.1 Scope

V0.1 includes:

- AI application risk overview
- Real-time risk event list
- Risk event details
- V0.1 risk rule overview
- Mock AI call and risk event data
- Rule-based risk scoring concepts
- Evidence chain display

V0.1 does not include:

- Real OpenAI-compatible proxy
- Real database persistence
- Login, RBAC, or multi-tenant management
- Real model API calls
- Production-grade policy engine

## 4. Confirmed Page Copy

Home title:

```text
AI Application Risk Overview
```

Home subtitle:

```text
Monitor call risk, data leakage, prompt attacks, and high-risk tool behavior across enterprise LLM, RAG, and Agent applications
```

## 5. Metric Definitions

### Model Calls Today

Definition: the number of model requests recorded through the AI RiskOps gateway.

It is not strictly equal to the number of user prompts. One user action may trigger multiple model calls, especially in Agent or RAG workflows.

Examples:

- A simple chat turn usually counts as 1 model call.
- An Agent task that plans, retrieves, calls tools, and summarizes may count as multiple model calls.
- Streaming response chunks should not be counted as separate calls.

### Average Event Risk Score

Definition: the average risk score across risk events currently in the event set.

Formula for V0.1 mock data:

```text
Average Event Risk Score = sum of risk event scores / number of risk events
```

Future product versions may separate:

- Average call risk score across all model calls
- Average event risk score across only events that triggered rules

## 6. Risk Levels

| Level | Meaning |
| --- | --- |
| Low | Normal or minor risk, usually allowed |
| Medium | Needs attention, usually flagged for observation |
| High | High-risk event, may require redaction, review, or block |
| Severe | Severe security risk, usually blocked or sent to mandatory review |

## 7. Actions

| Action | Meaning |
| --- | --- |
| allow | Let the request pass normally |
| flag | Let the request pass, but mark it for observation and audit |
| redact | Redact sensitive content before allowing the request |
| review | Pause the action and require human approval |
| block | Stop the request or output from reaching the business application |

## 8. V0.1 Risk Rules

| Rule ID | Risk Type | Trigger | Base Score | Default Action |
| --- | --- | --- | ---: | --- |
| PI-001 | Direct Prompt Injection | User input tries to ignore instructions, reveal system prompt, bypass policy, or invoke jailbreak personas | 45 | review |
| PI-002 | Indirect Prompt Injection | Retrieved documents, webpages, or emails contain hidden instructions that try to redirect model behavior | 55 | block |
| DLP-001 | Personal Sensitive Information | Input or output contains phone numbers, IDs, bank cards, emails, addresses, or similar PII | 40 | redact |
| DLP-002 | Secret Leakage | API keys, tokens, secrets, private keys, or database connection strings appear | 75 | block |
| SYS-001 | System Prompt Leakage | User asks for system prompt, hidden rules, tool list, or internal policies | 60 | block |
| TOOL-001 | High-Risk Tool Call | Agent attempts email sending, deletion, export, payment, permission change, or approval submission | 50 | review |
| ACCESS-001 | Unauthorized Access | User role cannot access the target data, tool, or customer scope | 70 | block |
| ABUSE-001 | Abuse or Anomaly | Repeated jailbreaks, bulk requests, cost spikes, or unusual access patterns | 35 | flag |

## 9. Blocking Mechanism

AI RiskOps should block a request or output when policy indicates that continuing would create unacceptable risk.

V0.1 default blocking scenarios:

- Secret leakage
- System prompt leakage
- Unauthorized access
- Indirect prompt injection
- Risk score at or above severe threshold, unless whitelisted

Blocking happens at the gateway or governance layer. It is not only a model refusal.

## 10. Future Review Workflow

Risk events should use two separate concepts:

- System action: what AI RiskOps automatically did to the call, such as allow, flag, redact, review, or block.
- Review status: where the human review and remediation process currently stands.

V0.2 introduces the following review statuses:

| Status | Meaning |
| --- | --- |
| pending_review | Event is waiting for security or risk staff review |
| in_progress | Someone has taken ownership and is investigating |
| confirmed | Reviewer confirmed this is a real risk |
| false_positive | Reviewer marked the event as acceptable or a rule false positive |
| resolved | The risk has been remediated and closed |
| escalated | The event has been escalated into a security, compliance, or major business incident |

Recommended lifecycle:

```text
pending_review
-> in_progress
-> confirmed
-> resolved

pending_review
-> false_positive

pending_review / in_progress / confirmed
-> escalated
```

Potential review outcomes:

- Confirmed risk
- False positive
- Remediated
- Added to whitelist
- Escalated to security incident

V0.2 event fields:

- Review status
- Owner
- SLA
- Last updated time

Future fields:

- Review notes
- Detailed audit log
- SLA timer and overdue status
- False-positive feedback linked to rule tuning

## 11. Rule Display Strategy

The V0.1 homepage should focus on operational posture: metrics, real-time risk events, and event details. It should not show the risk rule or capability overview directly.

Rule and capability overview should move to Strategy Center.

As the rule set grows, the homepage should not list every rule in full. Recommended future display forms:

- Category summary cards, such as Prompt Injection, Data Leakage, Tool Risk, Access Risk, Abuse
- Rule library table with search, filters, severity, default action, status, and owner
- Strategy templates by application type, such as Customer Service Copilot, HR Agent, Finance Agent, RAG Knowledge Base
- Rule detail drawer for trigger logic, scoring, examples, false positives, and recent hits
- Risk matrix view that maps rule categories to action outcomes
- Trend view showing rule hit counts, false-positive rate, and block/review outcomes

Homepage should stay operational and concise. Deep configuration should live in Strategy Center.

## 12. Open Decisions

- Whether V0.2 should implement a real local risk detection function before building API Proxy.
- Whether the first real integration should be OpenAI-compatible proxy, SDK, or log ingestion API.

## 13. Local Preview Decision

Use production preview for stakeholder review instead of relying on Next.js dev Fast Refresh.

Reason: during rapid edits, Next.js dev mode can leave React Server Components manifests in a bad cache state after transient runtime errors. Production preview is slower to restart but much more stable for reviewing the prototype.

Preferred preview flow:

```bash
pnpm build
pnpm start
```

The project also provides:

```bash
pnpm preview
```

Codex may still use `pnpm dev` for development-only iteration, but user-facing preview should prefer `pnpm start` after a successful build.

## 14. V0.2 Scope

V0.2 added a lightweight detection sandbox for single-call policy testing. In V0.4, this capability is no longer exposed as a primary navigation item and is instead embedded in Policy Center as Policy Simulation.

Positioning:

- Single-call AI risk validation
- Rule debugging
- Policy simulation support
- Foundation for future batch red-team testing

The detection sandbox is not the production enforcement path. Production enforcement should eventually happen through gateway, SDK, proxy, or log ingestion.

### V0.2 Included

- Policy Simulation panel inside Policy Center
- Detection sandbox capability for internal rule testing
- AI call log view
- Call-to-risk-event traceability through call ID, trace ID, and event ID
- Policy Center view
- Strategy templates, rule library, and action matrix
- Four built-in sample scenarios:
  - Customer Service Copilot: customer information leakage
  - RAG Knowledge Base: indirect prompt injection
  - Finance Agent: high-risk payment approval
  - HR Q&A: unauthorized salary access
- Editable fields:
  - Application name
  - User role
  - Environment
  - Data type
  - Prompt
  - Model output
  - RAG context
  - Agent tool call
- Local TypeScript rule engine
- Risk score
- Risk level
- Recommended action
- Matched rules
- Evidence chain
- Review status hint

### V0.2 Not Included

- Sample history
- Saved test cases
- Batch upload
- Red-team report export
- Real model calls
- Real OpenAI-compatible proxy
- Database persistence
- Authentication or RBAC
- Full rule editor
- Rule version release workflow
- Policy inheritance or multi-tenant policy management

### V0.2 Rule Engine

The local rule engine evaluates a single AI call using deterministic rules and contextual weights.

It currently checks:

- Direct prompt injection
- Indirect prompt injection in RAG context
- Personal sensitive information
- API key, token, secret, or private key leakage
- System prompt or internal rule leakage
- High-risk Agent tool calls
- Unauthorized access based on role and data type

Scoring starts from matched rule base scores, then adds context weights for production environment, sensitive data type, multiple findings, and tool calls.

## 15. AI Call Logs

AI call logs are the audit foundation of AI RiskOps.

They answer:

- Which AI application made the request?
- Which user triggered it?
- Which model was used?
- What prompt, output, RAG context, and tool calls were involved?
- What system action was applied?
- Did this call generate or link to a risk event?

V0.2 adds a mock call log view with:

- Call ID
- Trace ID
- Optional risk event ID
- Time
- Application
- User
- Model
- Environment
- Risk score
- Risk level
- System action
- Prompt
- Model output
- RAG context
- Agent tool call
- Matched rules

The intended product chain is:

```text
AI call log
-> risk detection
-> risk event
-> system action
-> human review
```

Future versions should persist call logs in a database and support filtering by application, user, model, environment, risk level, action, time range, and event linkage.

## 16. Policy Center

Policy Center is the product home for rule and action governance.

It answers:

- Which AI risk rules exist?
- Which rules are enabled?
- Which applications use which policy templates?
- What default action should be applied when a rule or score threshold is hit?
- Which rules have high hit counts or high false-positive rates?

V0.2 includes:

- Strategy templates by AI application type
- Rule library table
- Rule enabled state
- Base score
- Default action
- 24-hour hit count
- Manual review false-positive rate
- Action matrix mapping risk score bands to default handling

V0.2 does not include:

- Custom regex editor
- Complex condition builder
- Rule version publishing
- Approval workflow for policy changes
- Tenant-level policy inheritance
- Real persistence

Future versions should support policy versioning, rule simulation, scoped rollout, approval before publish, ownership, and rollback.

### Manual Review False-Positive Rate

The formal false-positive rate should come from completed human review or explicit business feedback.

Recommended formula:

```text
Human-reviewed false-positive rate = false_positive / (confirmed + false_positive + resolved + escalated)
```

Events in `pending_review` or `in_progress` should not enter the denominator because they have not reached a review outcome yet.

System analysis may identify suspected false positives, but suspected false positives should not be mixed into the official false-positive KPI.

Suggested thresholds:

- Minimum sample size: 20 completed review outcomes
- Watch threshold: 8%
- High false-positive threshold: 15%
- Severe false-positive threshold: 25%

### Disabled Strategy Template Semantics

Disabling a strategy template does not mean AI applications become unprotected.

Recommended semantics:

- Disabled templates cannot be selected by newly onboarded applications.
- Applications already bound to a disabled template continue using the last effective version until migrated.
- Disabled templates should show migration warnings when applications are still bound to them.
- Historical call logs and risk events keep the policy template name and version used at the time.
- Disabled templates should not accept new rule publishing as an active policy path.
- Enterprise baseline rules still apply regardless of template state.

Recommended policy hierarchy:

```text
Enterprise baseline policy
-> Application strategy template
-> Application-level exceptions
```

Baseline rules such as secret leakage blocking, unauthorized access blocking, high-risk tool review, and system prompt leakage blocking should not be disabled through an application template.

## 17. V0.3 Real Detection Flow Demo

V0.3 connects the detection sandbox to the rest of the product as an in-memory demo flow.

Goal:

```text
submit one AI call sample
-> run local risk engine
-> generate AI call log
-> generate risk event when action is not allow
-> update overview and event review flow
-> make the generated call traceable in AI Call Logs
```

Confirmed behavior:

- A risk event is generated when `action !== allow`.
- The sandbox button text is `Simulate Ingestion & Generate Event`.
- Generated call logs and events are in-memory only.
- The flow is a demo of future gateway, SDK, proxy, or log-ingestion behavior.

V0.3 does not include:

- Database persistence
- Real API endpoint
- Real OpenAI-compatible proxy
- Authentication or multi-user ownership
- Streaming model response handling

## 18. Application Onboarding

Application Onboarding answers how enterprise AI applications connect to AI RiskOps.

V0.3 adds a frontend prototype for:

- Integration methods
- Connected application list
- Policy template binding
- Daily call and risk event counts
- Latest call status
- OpenAI-compatible proxy code example
- Standard onboarding flow
- Security notes for secrets, redaction, metadata-only mode, and test-first rollout

Supported integration concepts:

- OpenAI-compatible proxy
- SDK integration
- Log ingestion API
- Agent tool-call audit

Recommended onboarding flow:

```text
create application
-> select policy template
-> generate integration key
-> update model call baseURL or SDK config
-> verify call log ingestion
```

V0.3 does not include:

- Real application creation
- Real key generation
- Real gateway endpoint
- App-level RBAC
- Secret storage
- Runtime health checks

Future versions should support production key management, environment-level configs, traffic sampling, metadata-only mode, redaction policy per app, and onboarding validation tests.

## 19. Risk Event Workbench

Risk Event Workbench is the dedicated queue for security and risk teams to review and handle AI risk events.

It is separate from Overview:

- Overview focuses on operational posture and recent activity.
- Risk Event Workbench focuses on event handling, review status, ownership, and SLA.

V0.3 includes:

- Dedicated Risk Events navigation state
- Status summary cards:
  - Pending review
  - In progress
  - Confirmed
  - False positive
- Full event queue with:
  - Time
  - Event title
  - Event ID
  - Application
  - User
  - Risk level
  - System action
  - Human review status
  - Owner
  - SLA
- Event detail panel with evidence, prompt, tool call, recommendation, and review actions

V0.3 does not include:

- Real filtering
- Assignment workflow
- SLA countdown
- Bulk actions
- Notes and audit trail persistence

Future versions should support owner assignment, queue filters, SLA breach indicators, batch actions, comments, and audit history.

## 20. V0.4 Navigation And Policy Simulation

V0.4 removes Red Team Testing from the primary navigation.

Decision:

- Primary navigation should focus on operational product surfaces: Overview, Risk Events, Call Logs, Policy Center, and Application Onboarding.
- Red-team style single-call testing is useful for demos and rule validation, but it should not appear as a standalone production-facing module in the first product version.
- The same capability should live in Policy Center as Policy Simulation, where governance users naturally test rule behavior before adjusting policies.
- Policy Simulation may still generate in-memory call logs and risk events for prototype demonstration.

V0.4 includes:

- Removed Red Team Testing from the sidebar.
- Added Policy Simulation inside Policy Center.
- Kept the local deterministic risk engine and sample scenarios.
- Kept Simulate Ingestion & Generate Event as an internal testing action.

V0.4 does not include:

- Batch red-team campaigns
- Saved simulation cases
- Formal policy publish workflow
- Real gateway enforcement

## 21. V0.5 Application Onboarding Detail

V0.5 improves Application Onboarding so it feels closer to a real enterprise integration workflow.

Goal:

```text
select connected application
-> inspect app identity, owner, integration method, and bound policy
-> validate Test and Production environments
-> check log field completeness
-> confirm integration readiness before production rollout
```

V0.5 includes:

- Clickable connected application list
- Selected application detail panel
- Application ID, owner, integration method, and bound policy
- Test and Production environment status
- Log field coverage score
- Integration validation checklist
- Selected-app proxy code example
- Selected-app operational summary

Validation checklist:

- API key configured
- Call logs received
- Prompt captured
- Output captured
- RAG context captured
- Tool calls audited
- Policy bound
- Alert route configured

V0.5 does not include:

- Real application creation
- Real API key generation
- Real gateway health checks
- Persisted integration validation history
- Environment-level configuration editing

Future versions should support real app creation, key rotation, environment-specific policy binding, integration health events, endpoint validation, and rollout controls from Test to Production.

## 22. V0.6 Risk Event Queue Controls

V0.6 improves Risk Events as an operational queue for security and risk teams.

Goal:

```text
open Risk Events
-> choose an operational queue
-> search or filter events
-> review the narrowed event list
-> inspect and update the selected event
```

V0.6 includes:

- Queue shortcuts:
  - All
  - Pending Review
  - Severe
  - Blocked
  - My Queue
- Search across event title, application, user, owner, department, event ID, and rule ID
- Risk level filter
- System action filter
- Human review status filter
- Filtered event count
- Summary cards calculated from the current filtered result set
- Automatic selection of the first visible event when filters change

V0.6 does not include:

- Server-side search
- Saved views
- Bulk event actions
- Advanced query syntax
- Export
- Pagination

Future versions should support saved queues, ownership assignment, bulk review actions, SLA breach filtering, export, and server-backed search for large event volumes.

## 23. V0.7 Risk Event Workbench Simplification

V0.7 simplifies the Risk Event Workbench after adding search and filters.

Decision:

- Queue shortcuts are removed because search and structured filters already cover the same use cases.
- Event rows should be optimized for scanning, not for showing every attribute as a table column.
- System action and owner remain visible but move into secondary event metadata.
- The row should prioritize event title, app/user/time, risk level, human review status, and SLA.
- A Clear button should reset search and filters.
- Filters and Clear should sit above the search field so the search input can use the full workbench width.
- Event rows should include lightweight column labels for Risk Event, Risk Level, Risk Status, and SLA.

V0.7 includes:

- Removed queue shortcuts from Risk Events.
- Added Clear filters action.
- Split the Risk Event Workbench controls into a filter row and a full-width search row.
- Added scan-friendly column labels above the risk event rows.
- Simplified each risk event row into a compact scan-friendly layout.
- Kept search across event title, app, user, owner, department, event ID, and rule ID.
- Kept filters for risk level, system action, and human review status.

V0.7 does not include:

- Saved filtered views
- Bulk actions
- Table column customization
- Server-side filtering

## 24. V0.8 Overview Risk Posture Redesign

V0.8 reduces overlap between Overview and Risk Events.

Decision:

- Overview should focus on risk posture, trends, distributions, and rankings rather than full event handling.
- Live Risk Events and full Risk Event Detail are removed from Overview.
- System Action Breakdown is optional and not required for the first Overview redesign.
- Severe Event Snapshot should show the three most severe events and include a clear entry point into Risk Events for detailed investigation.

V0.8 includes:

- Risk level trend with Daily, Monthly, and Quarterly period controls
- Stacked event volume by severity level
- Total event labels above each trend bar
- Native tooltip snapshot for each trend bar
- Blue High+Severe Rate line overlay
- High+Severe Rate points and percentage labels on the trend line
- Risk category distribution as a solid pie chart
- Top risky applications as a horizontal bar chart ranked by severe event count, with average risk score as the secondary tie-breaker
- Severe Event Snapshot
- View in Risk Events action from each severe snapshot item
- Larger risk event titles in the Risk Events workbench for better scanability

V0.8 does not include:

- Real charting library
- Custom date range selector
- System Action Breakdown
- Drill-down from every chart segment
- Custom chart tooltip

Trend formula:

```text
High+Severe Rate = (High events + Severe events) / Total risk events
```

Top Risky Applications ranking:

```text
Primary sort: Severe Count descending
Tie-breaker: Average Event Risk Score descending
```

## 25. V0.9 Risk Evidence Detail

V0.9 strengthens risk event explainability without expanding AI RiskOps into a full incident-response or audit-workflow product.

Decision:

- The first product version should record and explain AI application risk, not own the full risk remediation lifecycle.
- Review status remains useful as event metadata, but V0.9 does not add audit trails, comments, approvals, assignment workflow, or SLA automation.
- Risk Event Detail should make it clear why an event was classified as risky and which evidence supports that classification.

V0.9 includes:

- Risk Explanation summary in Risk Event Detail
- Affected Asset field for the selected event
- Detection Basis summary showing matched rule and evidence counts
- Matched Rules & Evidence as a single integrated section:
  - Matched rule
  - Rule trigger
  - Detection signal
  - Supporting evidence
  - Risk impact
- Source Context as a single section:
  - Prompt
  - Model output
  - Agent tool call
- Review Metadata as a read-only event metadata section:
  - Review status
  - Owner
  - SLA
  - Last updated time
- Fallback explanation behavior for simulated events that do not yet carry structured evidence mapping

V0.9 does not include:

- Review audit trail
- In-panel review status actions
- Case notes
- Multi-user comments
- Assignment workflow
- Approval workflow
- SLA countdown or breach handling
- Audit export

Future versions may add workflow integrations with ticketing, SIEM, SOAR, or GRC tools, but those should remain integrations around the risk record rather than replacing the core risk observability use case.

## 26. V0.10 Applications Risk Profile

V0.10 changes the former Application Onboarding surface into an Applications page focused on application-level risk visibility.

Decision:

- The primary navigation should expose high-frequency risk visibility surfaces, not low-frequency setup workflows.
- Applications should be the application-level risk profile page.
- Application Onboarding remains a valid admin workflow, but it should live under Admin surfaces rather than the Applications risk inventory page.
- The first Applications version should prioritize risk profile over integration setup.

Primary users:

- AI governance leaders use Applications to see monitored application coverage and risk concentration.
- Security, risk, and compliance analysts use Applications to identify high-risk AI applications and prepare governance recommendations.
- AI application owners use Applications to understand their own application risk profile, policy binding, and integration health.
- AI platform admins use Applications to monitor application risk and integration health; setup actions belong under Admin surfaces.

V0.10 includes:

- Primary navigation label changed from Application Onboarding to Applications.
- Application risk inventory table:
  - Application
  - Risk level
  - Event count
  - Severe event count
  - Bound policy
  - Integration status
- Application-level summary cards:
  - Monitored Applications
  - Production Apps
  - Apps with Severe Events
  - Coverage Gaps
- Selected application risk profile:
  - Risk level
  - Average risk score
  - Severe event count
  - Top risk category
  - Owner
  - Integration status
- Recent risk events for the selected application, with links into Risk Events.
- Bound policy and capability tags.
- Integration health as supporting context.
- Integration health as supporting context; admin setup actions are intentionally excluded from the Applications page.

V0.10 does not include:

- Real role-based access control
- Real application creation
- Integration key generation
- Full onboarding workflow
- Editable application configuration
- Production gateway configuration

Future versions should add a dedicated Admin setup surface for application onboarding, integration management, and key/configuration workflows.

## 27. V0.11 Admin Navigation

V0.11 separates daily risk visibility navigation from administrator-only configuration surfaces.

Decision:

- The primary navigation should focus on high-frequency risk visibility and analysis:
  - Overview
  - Risk Events
  - Call Logs
  - Applications
- Admin contains administrator-only setup and configuration surfaces.
- Policy Center affects detection rules, policy templates, thresholds, and policy simulation.
- Application Setup covers application onboarding, integration methods, setup flow, and validation status.
- Admin surfaces should therefore appear under an Admin navigation group rather than the primary navigation group.
- V0.11 is an information architecture and visual hierarchy change only; it does not implement real role-based access control.

V0.11 includes:

- Removed Policy Center from the primary navigation group.
- Added an Admin navigation group at the bottom of the sidebar.
- Moved Policy Center into the Admin group.
- Added Application Setup under the Admin group.
- Added an Admin badge next to admin surfaces.
- Updated Policy Center subtitle to indicate admin-only controls.

V0.11 does not include:

- Real authentication
- Real authorization
- Admin role switching
- Hidden routes based on user role
- Separate Platform Settings page

Future versions should add role-aware navigation and expand Application Setup once the production setup workflow is redesigned.

## 28. V0.12 Role-Aware Navigation Prototype

V0.12 adds a lightweight role switcher to validate how different product users should experience the navigation.

Decision:

- The prototype should make role differences visible before implementing real authentication or authorization.
- Role-aware navigation helps validate whether AI RiskOps serves governance leaders, security analysts, application owners, and platform admins with the right information architecture.
- This is a product-design prototype only; it does not enforce backend access control.
- Read-only auditor is not a current first-version user profile; audit viewing may be revisited as a future extension.

Roles represented:

- Governance Leader
- Security Analyst
- AI App Owner
- AI Platform Admin

V0.12 includes:

- Header role selector.
- Role scope indicator.
- Admin navigation visibility only for AI Platform Admin.
- Policy Center hidden from non-admin roles.
- Call Logs visible to Governance Leader as a read-only, low-frequency traceability surface.
- Automatic fallback to Overview when the current page is not available for the selected role.

V0.12 does not include:

- Real authentication
- Real authorization
- Data-level filtering
- Field-level masking
- Tenant or business-domain scoping
- Persisted user preferences

Future versions should connect role-aware navigation to real RBAC, data scoping, and masking once the backend model exists.

## 29. V0.13 User Profile Model

V0.13 replaces the role selector concept with User Profile templates.

Decision:

- Company job titles should not be hard-coded as permission boundaries.
- User roles are useful for understanding needs, but the prototype should expose simple user profiles.
- User Profile represents a permission template made from:
  - Resources
  - Actions
  - Scope
- The prototype should express access templates without implementing real backend RBAC.
- The early version intentionally keeps permissions simple and does not include Data Mode.

User profiles represented:

- Global User
- App Owner
- Platform Admin

V0.13 includes:

- Header label changed from Role to User Profile.
- Profile selector options changed from job-like roles to access templates.
- Scope indicator:
  - Global
  - Assigned Applications
- Admin access indicator.
- Admin navigation remains visible only for Platform Admin.

V0.13 does not include:

- Real authentication
- Real authorization
- Resource-level permission checks
- Data-level filtering
- Editable access-profile administration

Future versions should support real user-profile configuration using Resource + Action + Scope. Data Mode may be revisited later if the product needs field-level masking or summary-only views.

## 30. V0.14 Assigned Applications Scope Prototype

V0.14 makes the App Owner user profile affect visible sample data.

Decision:

- User Profile should not only be a header label; the prototype should demonstrate at least one real data-scope behavior.
- App Owner should represent an Assigned Applications scope.
- The first assigned-applications prototype uses multiple sample applications.

V0.14 includes:

- App Owner filters Risk Events to assigned applications.
- App Owner filters Call Logs to assigned applications.
- App Owner filters Applications to assigned applications.
- App Owner Overview metrics use the scoped event and call-log data.
- App Owner Overview charts use the scoped event data instead of global chart samples.
- Assigned application sample data includes enough scoped events across severity levels to make the App Owner trend and category charts meaningful.
- Header scope label shows the assigned application count.
- Application admin actions remain hidden when the selected user profile has no admin permission.

V0.14 does not include:

- Configurable application ownership
- Real backend authorization
- Field-level masking
- Policy Center access for App Owner

Future versions should support configurable assignment groups, business-unit scopes, and backend-enforced filtering.

## 31. V0.15 Simplified Permission Model

Decision:

- The early product version should use the simplest permission model that is easy to explain and test.
- App Owner is the only non-global scope in the first prototype.
- Global User and Platform Admin can view global data.
- Data Mode, summary-only views, and redacted views are intentionally deferred.
- Platform Admin is the only profile that can access Policy Center and admin actions.

V0.15 includes:

- Removed Data Mode from the User Profile header.
- Removed Summary / Redacted behavior from the prototype.
- Merged Global Viewer and Risk Analyst into Global User.
- App Owner continues to see only assigned application sample data.
- Global User and Platform Admin continue to see global data.
- Policy Center remains visible only to Platform Admin.
- Application admin actions remain visible only to Platform Admin.

V0.15 does not include:

- Summary-only or redacted views
- Field-level masking
- Backend-enforced authorization
- Configurable permissions UI
- Separate view/edit/manage action matrix

Future versions may add field-level masking, summary-only views, or configurable Data Mode if real customer requirements make that complexity necessary.

## 32. V0.16 User Profile Page Positioning

V0.16 clarifies how each User Profile uses the product without adding new permissions.

Decision:

- The early product should keep three user profiles:
  - Global User
  - App Owner
  - Platform Admin
- User Profile should explain product context, not create a complex role matrix.
- Global User and Platform Admin keep global data scope.
- App Owner keeps Assigned Applications scope.
- Platform Admin remains the only profile with Admin surfaces.

User Profile page usage:

| User Profile | Overview | Risk Events | Call Logs | Applications | Admin |
|---|---|---|---|---|---|
| Global User | View global AI risk posture, trends, and concentration | Inspect global risk events and patterns | Trace global model calls when deeper context is needed | Compare application risk profiles and coverage | Not visible |
| App Owner | View risk posture for assigned applications | Inspect assigned application risk events and evidence | Trace assigned application model calls and event links | Review assigned application risk profiles and integration health | Not visible |
| Platform Admin | View global risk posture and platform impact | Inspect events to validate policy behavior | Trace calls to validate ingestion and actions | View application risk inventory and integration health | Configure policies and application setup |

V0.16 includes:

- Header profile intent chip:
  - Global risk visibility
  - Own application risk
  - Platform configuration
- Page subtitles adapt to the selected User Profile.
- Sidebar admin empty state uses profile wording instead of role wording.

V0.16 does not include:

- New permissions
- Page hiding beyond existing Admin visibility
- New workflow states
- Backend authorization

Future versions may introduce more granular resource actions only after real customer usage makes the need clear.

## 33. V0.17 Assigned Applications And Applications Page Boundary

V0.17 updates App Owner scope and clarifies the Applications page boundary.

Decision:

- One App Owner user may be assigned to multiple AI applications.
- App Owner scope should be Assigned Applications, not a single owned application.
- Global User and Platform Admin both see all applications in Applications.
- Applications is a risk inventory and application risk profile page.
- Application onboarding, integration management, and other setup actions should live under Admin surfaces, not Applications.

V0.17 includes:

- App Owner sample scope now includes multiple assigned applications:
  - Customer Support Copilot
  - HR Policy Assistant
  - Internal Knowledge Assistant
- Overview, Risk Events, Call Logs, and Applications use the assigned application set for App Owner.
- Header scope label shows assigned app count.
- Removed Add Application from Applications.
- Removed Manage Integration from application detail.
- Platform Admin still sees all applications, but does not see setup actions inside Applications.

V0.17 does not include:

- Real assignment management
- Permission request workflow
- Admin application onboarding page
- Backend-enforced assigned-app filtering

Future versions should expand Application Setup into a production-ready app onboarding and integration management workflow.

## 34. V0.18 Admin Application Setup

V0.18 makes Admin the container for two administrator-only surfaces.

Decision:

- Admin should be a navigation group, not a single Policy Center page.
- Policy Center should focus on rules, policy templates, thresholds, and simulation.
- Application Setup should focus on application onboarding, integration methods, setup flow, telemetry validation, and readiness.
- Applications should remain a risk inventory and application profile page for all applicable profiles.
- Platform Admin should not see onboarding or integration-management actions inside Applications.

V0.18 includes:

- Added Application Setup under Admin.
- Application Setup shows setup summary metrics.
- Application Setup shows integration methods.
- Application Setup shows the standard setup flow.
- Application Setup shows application setup status, integration method, field coverage, validation checks, and bound policy.
- Policy Center remains under Admin.
- Applications remains free of Add Application and Manage Integration actions.

V0.18 does not include:

- Real application creation
- Real key generation
- Editable integration configuration
- Environment-specific setup forms
- Backend persistence

Future versions should turn Application Setup into the production admin workflow for creating apps, binding policies, issuing keys, validating telemetry, and managing integration configuration.

## 35. V0.19 Backend Readiness Review

V0.19 prepares the product for backend design and implementation.

Decision:

- The frontend V1 prototype is close enough to define backend read models.
- Backend V1 should support risk observability before workflow automation.
- Backend V1 should prioritize persisted data, scoped reads, and API replacement for mock data.
- Policy Center and Application Setup can start as mostly read-only backend surfaces.
- Real ingestion, editing, and workflow automation can follow after the read model stabilizes.

V0.19 includes:

- Added `docs/backend-readiness.md`.
- Defined current product surfaces and backend dependencies.
- Drafted backend V1 principles.
- Drafted User Profile and assigned-application scope model.
- Drafted core backend data models:
  - Application
  - Application Environment
  - Integration Validation Check
  - AI Call Log
  - Risk Event
  - Rule and Evidence
  - Policy Template
  - User Profile and Application Assignment
- Drafted minimum API inventory for:
  - Overview
  - Risk Events
  - Call Logs
  - Applications
  - Admin / Policy Center
  - Admin / Application Setup
- Drafted mock data replacement plan.
- Drafted backend V1 build order.
- Listed decisions needed before backend implementation.

V0.19 does not include:

- Backend code
- Database schema files
- API route implementation
- Authentication
- Real ingestion
- Write workflows for policies or application setup

Backend V1 recommended stance:

- Start with seeded data and read APIs.
- Replace frontend mock data progressively.
- Add ingestion after the read model stabilizes.
- Keep Policy Center and Application Setup mostly read-only until the data model is proven.

## 36. V0.20 Backend Foundation

V0.20 starts backend implementation with a local persisted data layer.

Decision:

- Backend V1 starts with seeded data and read-model persistence before real ingestion.
- The first local database is SQLite to keep development lightweight.
- Prisma is the backend data model and query layer.
- Prisma 7 requires datasource configuration in `prisma.config.ts` instead of `schema.prisma`.
- Prisma Client uses the `@prisma/adapter-better-sqlite3` adapter.
- In this environment, `prisma db push` returns an empty schema engine error, so the seed script currently initializes SQLite tables before inserting data. This is an implementation workaround, not a product decision.

V0.20 includes:

- Added Prisma and SQLite dependencies.
- Added `prisma/schema.prisma`.
- Added `prisma.config.ts`.
- Added `prisma/seed.mjs`.
- Added `lib/prisma.ts`.
- Added package scripts:
  - `prisma:generate`
  - `db:seed`
  - `db:reset`
- Created local seeded database at `prisma/dev.db`.
- Seeded representative data for:
  - Users and user profiles
  - Assigned applications for App Owner
  - Applications and environments
  - Integration validation checks
  - Policy templates
  - Risk rules and operational stats
  - Risk events, matched rules, evidence, and AI call logs
- Added `.gitignore` entries for local env, build output, dependencies, and local database.

V0.20 verification:

- `pnpm run prisma:generate` passes.
- `pnpm run db:seed` passes.
- Prisma Client count check returns 3 users, 5 applications, 8 rules, 5 policy templates, 4 risk events, and 4 call logs.
- `next build` passes.

V0.20 does not include:

- API routes
- Frontend replacement of mock data
- Authentication
- Real ingestion
- Admin write workflows
- Production database migrations

Next step:

- Add read-only API routes starting with scoped Applications and Risk Events APIs, then progressively replace frontend mock reads.

## 37. V0.21 Scoped Read APIs

V0.21 adds the first backend read APIs.

Decision:

- Backend replacement should begin with read-only APIs before changing the frontend data source.
- V0.21 uses query parameters to simulate the current user profile and user assignment scope.
- `profile=app-owner` returns assigned-application data only.
- `profile=global-user` and `profile=platform-admin` return global data.
- This is a prototype auth simulation, not the final authentication model.

V0.21 includes:

- Added shared scope helper in `lib/api/scope.ts`.
- Added `GET /api/applications`.
- Added `GET /api/applications/:id`.
- Added `GET /api/risk-events`.
- Added `GET /api/risk-events/:id`.
- Added scoped filtering for App Owner assigned applications.
- Added 404 behavior for records outside the current profile scope.
- Added list filters for Risk Events:
  - `application_id`
  - `level`
  - `action`
  - `review_status`
  - `q`

V0.21 verification:

- `next build` passes.
- `GET /api/applications?profile=app-owner` returns only:
  - Customer Support Copilot
  - HR Policy Assistant
  - Internal Knowledge Assistant
- `GET /api/applications?profile=platform-admin` returns all five seeded applications.
- `GET /api/risk-events?profile=app-owner` returns only assigned-application risk events.
- `GET /api/risk-events/evt-1048?profile=app-owner` returns 200.
- `GET /api/risk-events/evt-1047?profile=app-owner` returns 404 because Sales Knowledge Agent is outside the App Owner assignment scope.

V0.21 does not include:

- Frontend API integration
- Call Logs APIs
- Overview aggregation APIs
- Policy Center APIs
- Application Setup APIs
- Real authentication or session handling
- Write APIs

Next step:

- Add Call Logs read APIs, then replace the Risk Events and Applications frontend mock reads with the new backend APIs.

## 38. V0.22 Call Logs Read APIs

V0.22 adds backend read APIs for AI model call logs.

Decision:

- Call Logs should use the same profile and assigned-application scope model as Risk Events and Applications.
- List responses should include compact prompt/output/context previews.
- Detail responses can include full prompt, output, RAG context, tool call, and linked risk event evidence.
- Raw prompt/output access is still a prototype behavior; production data controls will be revisited before real ingestion.

V0.22 includes:

- Added `GET /api/call-logs`.
- Added `GET /api/call-logs/:id`.
- Added `scopedCallLogWhere` to `lib/api/scope.ts`.
- Added App Owner assigned-application filtering for call logs.
- Added 404 behavior for call logs outside the current profile scope.
- Added list filters for Call Logs:
  - `application_id`
  - `environment`
  - `level`
  - `action`
  - `has_event`
  - `q`
- List responses include linked risk event summary when available.
- Detail responses include linked risk event, matched rules, and evidence when available.

V0.22 verification:

- `next build` passes.
- `GET /api/call-logs?profile=app-owner` returns only assigned-application call logs.
- `GET /api/call-logs?profile=platform-admin` returns all seeded call logs.
- `GET /api/call-logs?profile=platform-admin&has_event=true&level=severe` returns severe linked-event call logs.
- `GET /api/call-logs/call-2048?profile=app-owner` returns 200 and includes linked risk event `evt-1048`.
- `GET /api/call-logs/call-2047?profile=app-owner` returns 404 because Sales Knowledge Agent is outside App Owner scope.
- `GET /api/call-logs?profile=platform-admin&q=compensation` returns the HR Policy Assistant compensation-related call log.

V0.22 does not include:

- Frontend API integration
- Overview aggregation APIs
- Policy Center APIs
- Application Setup APIs
- Data masking or role-based raw prompt visibility
- Real authentication or session handling

Next step:

- Add Overview aggregation APIs, then decide whether to migrate frontend pages to API reads before or after Admin read APIs.

## 39. V0.23 Overview Aggregation APIs

V0.23 adds backend aggregation APIs for the Overview page.

Decision:

- Overview APIs should use the same profile and assigned-application scope model as other read APIs.
- Overview should return aggregated risk posture, not raw event queues.
- Risk Level Trend supports `daily`, `monthly`, and `quarterly` periods.
- High+Severe Rate is calculated as `(high events + severe events) / total events`.
- Risk Category Distribution is based on matched rule categories.
- Top Risky Applications is sorted by Severe Count first, then High Count, then Max Risk Score.
- Severe Event Snapshot returns the highest-scoring severe events and keeps a detail entry reference.

V0.23 includes:

- Added `GET /api/overview/summary`.
- Added `GET /api/overview/risk-level-trend`.
- Added `GET /api/overview/risk-categories`.
- Added `GET /api/overview/top-applications`.
- Added `GET /api/overview/severe-events`.
- Added shared overview aggregation helpers in `lib/api/overview.ts`.
- Tightened scope helper behavior so optional application filters are intersected with App Owner assigned-application scope instead of overriding it.

V0.23 verification:

- `next build` passes.
- App Owner summary returns 3 model calls, 3 risk events, 3 blocked events, 84.3 average event risk score, and 3 severe events.
- Platform Admin summary returns 4 model calls, 4 risk events, 3 blocked events, 81.8 average event risk score, 3 severe events, and 1 high event.
- App Owner daily trend returns one bucket for `Jul 08` with 3 severe events and 100% High+Severe Rate.
- App Owner risk category distribution is based only on assigned-application matched rules.
- App Owner top applications returns Customer Support Copilot before HR Policy Assistant because Severe Count is higher.
- App Owner severe snapshot returns `evt-1048`, `evt-1044`, and `evt-1051` ordered by score.

V0.23 does not include:

- Frontend API integration
- Admin / Policy Center APIs
- Admin / Application Setup APIs
- Real authentication or session handling
- Time-window filters for Overview APIs
- Synthetic multi-day seed data for richer trend charts

Next step:

- Decide whether to connect the frontend Overview page to backend APIs now, or first add Admin read APIs for Policy Center and Application Setup.

## 40. V0.24 Overview Frontend API Integration

V0.24 connects the Overview page to backend aggregation APIs.

Decision:

- Overview should be the first frontend surface migrated from mock-derived data to backend API data.
- Risk Events, Call Logs, Applications, Policy Center, and Application Setup remain mock-backed for now.
- Overview API reads still use `profile` query parameter simulation until real authentication is selected.
- Risk Level Trend fetches its API data per selected period because the chart has Daily / Monthly / Quarterly controls.

V0.24 includes:

- Added Overview API response types in `app/page.tsx`.
- Added frontend fetching for:
  - `/api/overview/summary`
  - `/api/overview/risk-categories`
  - `/api/overview/top-applications`
  - `/api/overview/severe-events`
  - `/api/overview/risk-level-trend`
- Updated Overview KPI cards to use backend summary data.
- Updated Risk Level Trend to fetch backend data by User Profile and selected period.
- Updated Risk Category Distribution to use backend category aggregation.
- Updated Top Risky Applications to use backend ranking.
- Updated Severe Event Snapshot to use backend severe-event snapshot.
- Added loading and error states for Overview API reads.
- Removed old local mock trend/category aggregation code from Overview.

V0.24 verification:

- `next build` passes.
- Browser verification on `http://127.0.0.1:3001/` passes.
- Platform Admin Overview shows backend API values:
  - Model Calls Today: 4
  - Risk Events: 4
  - Average Event Risk Score: 81.8
- Switching to App Owner updates Overview to assigned-application API values:
  - Scope: Assigned Apps: 3
  - Model Calls Today: 3
  - Risk Events: 3
  - Average Event Risk Score: 84.3
- App Owner Overview no longer shows Sales Knowledge Agent in Top Risky Applications.

V0.24 does not include:

- Risk Events frontend API integration
- Call Logs frontend API integration
- Applications frontend API integration
- Admin read APIs
- Real authentication or session handling
- Persisting simulated ingestion into the backend database

Next step:

- Add Admin read APIs for Policy Center and Application Setup, or migrate Risk Events / Call Logs / Applications frontend pages to existing backend APIs.

## 41. V0.25 Risk Events Frontend API Integration

V0.25 connects the Risk Events page to backend APIs.

Decision:

- Risk Events should be the second frontend surface migrated from mock data to backend API data.
- The Risk Event Workbench should request filtered backend data directly instead of filtering local mock events.
- Event detail should be loaded separately so the list stays lightweight while the detail panel can show source context, matched rules, and evidence.
- Risk Events still uses `profile` query parameter simulation until real authentication is selected.

V0.25 includes:

- Added frontend API response types for Risk Event list and detail payloads.
- Added adapter functions to map backend event payloads into the existing UI event shape.
- Updated Risk Event Workbench to fetch `/api/risk-events`.
- Updated Risk Event detail panel to fetch `/api/risk-events/:id`.
- Connected existing filters to backend query parameters:
  - `level`
  - `action`
  - `review_status`
  - `q`
- Added loading and error states for event list and detail.
- Preserved existing UI layout, row density, status pills, evidence panel, source context panel, and review metadata.
- Cleaned corrupted `.next` cache by moving it to `.next.bak-v025-risk-events-api` and rebuilding.

V0.25 verification:

- `next build` passes.
- Clean build restored `.next/server/app` route artifacts.
- `GET /` on local production server returns 200.
- `GET /api/risk-events?profile=app-owner` returns only assigned-application events:
  - `evt-1048`
  - `evt-1044`
  - `evt-1051`
- Browser verification passes on the local production server.
- Platform Admin Risk Events shows 4 backend events.
- App Owner Risk Events shows 3 backend events.
- App Owner Risk Events excludes Sales Knowledge Agent.
- Risk Event detail loads backend source prompt and evidence.

V0.25 does not include:

- Applications frontend API integration
- Admin read APIs
- Real authentication or session handling
- Persisting Policy Simulation-generated events to the backend database

Next step:

- Migrate Applications frontend to backend APIs.

## 42. V0.26 Call Logs Frontend API Integration

V0.26 connects the Call Logs page to backend APIs.

Decision:

- Call Logs should be the third core observability surface migrated from mock data to backend API data.
- The Call Logs list should remain a trace-oriented record view, while detail loading should fetch full prompt, model output, RAG context, tool call, and linked risk event metadata.
- Call Logs should use the same `profile` query parameter simulation as Overview and Risk Events until real authentication is selected.

V0.26 includes:

- Added frontend API response types for Call Log list and detail payloads.
- Added adapter functions to map backend call-log payloads into the existing UI call-log shape.
- Updated Call Logs to fetch `/api/call-logs`.
- Updated Call Log detail to fetch `/api/call-logs/:id`.
- Added loading and error states for call-log list and detail.
- Preserved the existing Call Logs UI layout, KPI cards, row structure, linked risk event panel, matched rules, and source context blocks.
- Applied App Owner assigned-application scope through backend API responses.

V0.26 verification:

- `next build` passes.
- Call Logs API routes are included in the production build.
- Platform Admin Call Logs shows 4 global backend logs and includes Sales Knowledge Agent.
- App Owner Call Logs shows 3 assigned-application backend logs and excludes Sales Knowledge Agent.
- Call Log detail loads backend full prompt, model output, RAG context, and linked risk event metadata.

V0.26 does not include:

- Admin read APIs
- Real authentication or session handling
- Persisting Policy Simulation-generated logs to the backend database

Important limitation:

- Policy Simulation still creates local in-memory events and call logs. Because Call Logs is now backend-driven, simulated logs will not appear in Call Logs until backend ingestion/write APIs exist.

Next step:

- Add Admin read APIs for Policy Center and Application Setup, or add backend ingestion/write APIs.

## 43. V0.27 Applications Frontend API Integration

V0.27 connects the Applications page to backend APIs.

Decision:

- Applications should be the fourth core observability surface migrated from mock data to backend API data.
- The page should remain a risk inventory for monitored AI applications, not an application setup workflow.
- The list should use `/api/applications`, while the detail panel should use `/api/applications/:id` to load policy binding, integration health, validation checks, and recent risk events.
- Applications should use the same `profile` query parameter simulation as Overview, Risk Events, and Call Logs until real authentication is selected.

V0.27 includes:

- Added frontend API response types for Application list and detail payloads.
- Added adapter functions to map backend application payloads into the existing UI application shape.
- Updated Applications to fetch `/api/applications`.
- Updated Application detail to fetch `/api/applications/:id`.
- Added loading and error states for application list and detail.
- Preserved the existing Applications UI layout, KPI cards, application risk inventory, integration health panel, bound policy panel, and recent risk events panel.
- Applied App Owner assigned-application scope through backend API responses.

V0.27 verification:

- `next build` passes.
- Platform Admin Applications shows 5 global backend applications and includes Sales Knowledge Agent and Finance Approval Agent.
- App Owner Applications shows 3 assigned applications and excludes Sales Knowledge Agent and Finance Approval Agent.
- Application detail loads backend policy binding, integration health, validation checks, and recent risk events.

V0.27 does not include:

- Admin read APIs
- Real authentication or session handling
- Application creation or edit workflows

Important limitation:

- Policy Simulation still creates local in-memory events and call logs. Because Applications is now backend-driven, simulated records will not change application metrics until backend ingestion/write APIs exist.

Next step:

- Add backend ingestion/write APIs for persistent simulation and model-call intake.

## 44. V0.28 Model Call Ingestion API

V0.28 adds the first backend write path for model-call ingestion.

Decision:

- The product should move from read-only seeded data toward a working AI risk recording loop.
- Policy Simulation should no longer create only local in-memory records.
- The first write API should be intentionally narrow: ingest a single model call, evaluate it with the current risk rules, persist the call log, and create a linked risk event when the call is risky.
- This keeps AI RiskOps focused on recording and displaying AI application risk, while avoiding a full remediation workflow.

V0.28 includes:

- Added `POST /api/ingest/model-call`.
- The API accepts application, user, model, environment, data type, prompt, output, RAG context, tool call, and template metadata.
- The API reuses the existing risk evaluation logic from `lib/risk-engine.ts`.
- The API writes an `AiCallLog` record for every ingested model call.
- The API creates a linked `RiskEvent` when the evaluated action is not `allow`.
- The API creates matched rule records and evidence records for generated risk events.
- The API enforces the current profile-based application scope, so App Owner writes cannot target applications outside their assigned scope.
- Policy Simulation now calls the ingestion API instead of only mutating local frontend state.
- Successful Policy Simulation ingestion selects the generated call log and refreshes Overview data.

V0.28 verification:

- `next build` passes.
- `POST /api/ingest/model-call?profile=platform-admin` successfully created:
  - `call-50e32a96`
  - `evt-85101aa0`
- `GET /api/call-logs?profile=platform-admin` returns the generated call log.
- `GET /api/risk-events?profile=platform-admin` returns the generated risk event.
- `GET /api/overview/summary?profile=platform-admin` reflects the new aggregate totals:
  - Model Calls Today: 5
  - Risk Events: 5
  - Blocked: 4
  - Average Event Risk Score: 85.4
- Browser UI verification was not completed because browser automation was blocked by local browser security policy for `127.0.0.1:3001`.

V0.28 does not include:

- Production authentication
- API keys or application credentials
- Idempotency keys
- Request schema validation beyond minimal runtime checks
- Policy-template-specific rule execution
- Streaming ingestion or gateway proxy behavior
- Admin read APIs

Next step:

- Discuss whether V0.29 should harden ingestion for product realism, or switch back to Admin read APIs for Policy Center and Application Setup.

## 45. V0.29 Risk Analytics Frontend Template

V0.29 returns to frontend product design and adds a data-analysis-oriented Risk Analytics surface.

Decision:

- The product should not become a full remediation or audit workflow platform in this phase.
- The next product capability should help users understand why AI risk is happening, not only list that risk happened.
- Risk Analytics should reuse the current backend read APIs and prototype data, avoiding new API scope for this iteration.
- The first version should be a clear frontend template for future analytics depth rather than a finished statistical analysis engine.

V0.29 includes:

- Added a top-level Risk Analytics navigation item.
- Added Risk Analytics profile-aware page subtitles for Global User, App Owner, and Platform Admin.
- Added metric cards for:
  - High+Severe Rate
  - Risk Event Rate
  - Block Rate
  - Average Risk Score
- Added driver analysis cards for:
  - Application Drivers
  - Risk Category Drivers
  - Rule Drivers
- Added Top Driver Contribution summary to explain which application, category, and rule are driving current risk pressure.
- Added Suggested Investigation Path to guide security, risk, compliance, and AI application teams from analytics into Applications, Risk Events, and Call Logs.
- Added segment breakdowns by:
  - Environment
  - Data Type
  - Model
  - User / Role
- Risk Analytics reads existing backend APIs:
  - `GET /api/risk-events`
  - `GET /api/call-logs`
  - `GET /api/applications`
- App Owner scope is inherited from the same backend API profile filtering already used by Overview, Risk Events, Call Logs, and Applications.

V0.29 does not include:

- New backend analytics APIs
- Statistical anomaly detection
- Cohort analysis persistence
- Saved analytic views
- Export or report generation
- Remediation workflow
- Audit workflow

V0.29 verification:

- `next build` passes.
- Local production preview starts on `http://127.0.0.1:3000/`.
- `GET /` returns `200 OK` from the local production server.
- Browser verification passed: Risk Analytics opens from navigation and renders metric cards, driver lists, investigation path, and segment breakdowns without backend API errors.

Next step:

- Review the Risk Analytics page in the browser, then decide whether to refine its layout and metrics or add an application-level "why is this app risky?" analytics module.

## 46. V0.30 Application Risk Explanation Template

V0.30 adds an application-level explanation module to the Applications detail view.

Decision:

- Applications should help users understand application-level risk, not only compare application inventory rows.
- The new module should answer "why is this app risky?" using the same evidence already available in the prototype.
- The module should remain analytical and advisory. It should not introduce remediation workflow, audit workflow, or risk-state editing.
- The first version should reuse existing application detail data and recent risk events instead of adding new backend endpoints.

V0.30 includes:

- Added "Why Is This App Risky?" to the Applications detail panel.
- Added an application-level summary based on:
  - Recent risk events
  - Matched rule concentration
  - Risk category concentration
  - System action concentration
  - Integration field coverage
  - Application capability context
- Added compact driver bars for:
  - Risk Category
  - Matched Rules
  - System Actions
- Added an Investigation Focus section that points users toward the highest-risk event or telemetry coverage gap.
- Added a direct "Open Highest-Risk Event" entry point when a recent event exists.

V0.30 does not include:

- New backend analytics APIs
- Saved application risk explanations
- Root-cause inference beyond rule/event aggregation
- Remediation workflow
- Audit workflow
- Policy editing from Applications

V0.30 verification:

- `next build` passes.
- Browser verification passed: Applications detail renders "Why Is This App Risky?", compact driver bars, Investigation Focus, and the highest-risk event entry point without application API errors.

Next step:

- Review the Applications detail page in the browser, then decide whether this explanation module should be refined visually or whether Risk Analytics needs filters and drill-downs next.

## 47. V0.31 Risk Analytics Filters And Drill-down

V0.31 makes Risk Analytics more useful as an investigation entry point.

Decision:

- Risk Analytics should help users narrow the analysis scope before moving into Risk Events, Call Logs, or Applications.
- First-version analytics filters should run on the current profile-scoped API response, without adding backend analytics endpoints yet.
- Drill-down should expose evidence and event signals, not create a remediation or audit workflow.

V0.31 includes:

- Added Analytics Filters for:
  - Application
  - Severity
  - Environment
  - System Action
- Added filtered metric recalculation for:
  - High+Severe Rate
  - Risk Event Rate
  - Block Rate
  - Average Risk Score
- Made Application Drivers, Risk Category Drivers, and Rule Drivers clickable.
- Added selected driver state and active drill-down indicator.
- Added Drill-down Evidence with:
  - Focused event count
  - Focused High+Severe Rate
  - Highest-risk event summary
  - Top matching event rows
- Added Clear control to reset filters and drill-down state.

V0.31 does not include:

- New backend analytics APIs
- URL-persisted filters
- Saved analytic views
- Export or reporting
- Cross-page automatic filter handoff
- Remediation workflow

V0.31 verification:

- `next build` passes.
- Browser verification passed: Risk Analytics renders filters and Drill-down Evidence, and clicking an Application Driver activates the focused drill-down state.

Next step:

- Review Risk Analytics filter and drill-down behavior in the browser, then decide whether cross-page drill-through into Risk Events should be added next.

## 48. V0.32 Risk Analytics To Risk Events Drill-through

V0.32 connects Risk Analytics drill-downs to the Risk Events workbench.

Decision:

- Risk Analytics should not become the event investigation table itself.
- Once a user identifies a driver, they should be able to open Risk Events with the relevant scope already applied.
- This should remain an internal frontend navigation pattern for now, not a full URL routing or saved-view feature.

V0.32 includes:

- Added "Open in Risk Events" to the Risk Analytics Drill-down Evidence panel.
- Added internal drill-through state from Risk Analytics to Risk Events.
- Risk Events now accepts analytics-originated filters for:
  - Search query
  - Severity
  - System Action
  - Application scope
  - Environment scope
- Risk Events displays an "Applied from Risk Analytics" source banner when drill-through filters are active.
- Risk Events Clear resets normal filters and analytics-originated hidden filters.
- Extended the existing Risk Events API search to include matched rule id, rule name, and rule category.
- Added environment filtering to the existing Risk Events API.

V0.32 does not include:

- URL-persisted filters
- Saved analytic views
- Browser history state
- Cross-page drill-through from every chart or table
- Case management workflow

V0.32 verification:

- `next build` passes.
- Browser verification passed: clicking a Risk Analytics Application Driver and then "Open in Risk Events" opens Risk Events with the source banner and application-scoped event list.

Next step:

- Review cross-page drill-through behavior in the browser, then decide whether to add URL-persisted filters or keep the prototype state internal.

## 49. V0.33 Risk Events URL-persisted Filters

V0.33 makes Risk Events filters shareable and refresh-safe.

Decision:

- URL-persisted filters should start with Risk Events because it is the primary investigation table.
- Risk Analytics drill-through should generate the same URL state that manual Risk Events filtering uses.
- This should remain lightweight query-string state, not a full saved-view system.

V0.33 includes:

- Added `page` query parameter for top-level navigation state.
- Risk Events can initialize from URL query parameters:
  - `q`
  - `level`
  - `action`
  - `review_status`
  - `application_id`
  - `environment`
  - `source`
  - `label`
- Risk Events updates the URL when filters change.
- Risk Events Clear removes persisted filter parameters.
- Risk Analytics to Risk Events drill-through writes shareable Risk Events URL state.
- Direct links can open Risk Events with filters already applied.

V0.33 does not include:

- Saved named views
- Server-side analytic sessions
- URL persistence for every product page
- Browser back/forward workflow polish
- User-specific saved filter presets

V0.33 verification:

- `next build` passes.
- Browser verification passed:
  - Direct URL `?page=risk-events&q=DLP-001&level=severe&source=Shared&label=DLP-001` opens Risk Events with filters restored.
  - Risk Analytics Application Driver drill-through writes a shareable Risk Events URL with `application_id`, `source`, and `label`.

Next step:

- Review URL-persisted Risk Events filtering in the browser, then decide whether saved views or broader page-level URL state should be prioritized.

## 50. V0.34 Risk Events Saved Views

V0.34 adds lightweight saved views to Risk Events.

Decision:

- Saved Views should improve repeated investigation workflows without turning Risk Events into a full case-management or remediation platform.
- The first version should be frontend-only and stored locally in the browser.
- Saved Views should reuse existing Risk Events filters and URL persistence rather than creating a separate query model.

V0.34 includes:

- Save the current Risk Events filter set as a named view.
- Apply a saved view to restore search, severity, action, review state, application scope, and environment scope.
- Delete saved views from the Workbench.
- Keep up to eight recent saved views in local browser storage.
- Show applied saved views through the existing source banner and URL state.

V0.34 does not include:

- Backend persistence for saved views
- Team-shared saved views
- Permission-scoped saved view ownership
- Saved views outside Risk Events
- Audit history for saved view changes

V0.34 verification:

- `next build` passes.
- Browser verification should confirm save, clear, apply, delete, and refresh behavior.

Next step:

- Decide whether saved views should remain browser-local for the prototype or become backend-backed user/team saved views.

## 51. V0.35 Risk Analytics Application Drill-down

V0.35 adds the next layer of Risk Analytics analysis: application-level risk interpretation.

Decision:

- Risk Analytics should explain why a risk metric or driver is changing before users move into Risk Events.
- Application drill-down should remain analytical and evidence-oriented; it should not become a remediation, audit, or case-management workflow.
- LLM-powered insight is represented in the prototype as deterministic AI Insight copy generated from the current filtered data, without adding a live LLM API dependency.

V0.35 includes:

- Application Risk Drill-down panel driven by the selected Application Driver or current application filter.
- App-level metrics for risk events, High+Severe Rate, Block Rate, average risk score, and max risk score.
- AI Insight summary that explains application contribution, leading category, leading rule, and prioritization direction.
- Application Driver Mix for category and environment concentration.
- Recent High-Risk Examples for the focused application.
- Direct "Open Events" drill-through into Risk Events with application-scoped filters.

V0.35 does not include:

- Backend analytics endpoint
- Real LLM API integration
- Editable remediation status
- Audit workflow
- Cross-application comparison view

V0.35 verification:

- `pnpm build` passes.

Next step:

- Review the Application Risk Drill-down in the browser, then decide whether V0.36 should add a Compare View across applications, environments, departments, models, or policies.

## 52. Backend V1 Data Model Alignment

Backend V1 moves from prototype read APIs toward a stricter data foundation.

Decision:

- Risk Event V1 must originate from one source Call Log.
- Application V1 binds one active Policy Template.
- App Owner access should support multiple assigned applications and explicit application-level permissions.
- Evidence remains attached to Risk Event and can optionally point to a matched Risk Rule.
- Policy Rule is the per-policy join layer where rule enablement and future threshold/action overrides belong.

Completed:

- Updated Prisma schema with `UserApplicationAccess`, `PolicyRule`, and required `RiskEvent.sourceCallLogId`.
- Updated seed data and local SQLite initialization for the new V1 schema.
- Updated ingestion so call logs are persisted before risk events are created.
- Updated read APIs to keep current frontend response shapes while using the stricter backend model.

Verification:

- `pnpm run prisma:generate` passes.
- `pnpm run db:seed` passes.
- Local consistency check passes for seeded users, applications, access records, policy rules, call logs, and risk events.
- `pnpm build` passes.

Next step:

- Decide whether the next backend step should be API response hardening, richer ingestion validation, or backend-backed Risk Analytics aggregations.

## 53. Backend V1 API Hardening

Backend V1 now has a more stable API response and ingestion validation layer.

Decision:

- API hardening should preserve the existing frontend response shape while adding a consistent product API envelope.
- Ingestion should validate incoming model-call data before database writes.
- Invalid requests should return structured error codes rather than unhandled server errors.

Completed:

- Added shared response helpers for success, created, and error responses.
- Added `success` and `meta.requestId` to successful API responses.
- Standardized error responses with `errorCode` and `details`.
- Added ingestion validation for application identity, captured AI-call fields, environment, and text length.
- Updated detail API 404 errors for Applications, Risk Events, and Call Logs.

Verification:

- `pnpm build` passes.
- Smoke tests confirm affected pages return HTTP 200 and Admin APIs return backend data.
- Smoke tests confirm Risk Analytics and Applications pages return HTTP 200, Risk Analytics APIs return backend data, and App Owner Applications API remains scoped.
- API smoke test confirms success envelope, validation error envelope, and successful ingestion write path.
- Seed data was reset after smoke testing.

Next step:

- Decide whether to continue with backend-backed Risk Analytics aggregations or expand ingestion into SDK/proxy-style integration contracts.

## 54. Backend V1 Risk Analytics Aggregation APIs

Backend V1 now exposes analytics aggregation APIs for Risk Analytics.

Decision:

- Backend analytics should first support the current Risk Analytics product model before adding complex compare views or real LLM interpretation.
- Aggregation APIs should respect profile scope and the same filter dimensions used by the frontend analytics surface.
- Frontend migration can happen incrementally after backend aggregation contracts are stable.

Completed:

- Added `GET /api/analytics/summary`.
- Added `GET /api/analytics/drivers`.
- Added shared backend aggregation logic for risk metrics and driver groups.
- Supported analytics filters for application, severity, environment, and system action.
- Returned application, category, rule, environment, department, user, and model driver groups.

Verification:

- `pnpm build` passes.
- API smoke test confirms Platform Admin and App Owner scoped analytics summaries.
- API smoke test confirms driver aggregation and filtered analytics responses.

Next step:

- Decide whether to connect the Risk Analytics frontend to these backend aggregation APIs or add `GET /api/analytics/applications/:id` first for application drill-down.

## 55. Backend-backed Risk Analytics Integration

Risk Analytics now starts consuming backend aggregation APIs.

Decision:

- Summary metrics and driver groups should come from backend analytics APIs where available.
- Application Risk Drill-down should use a dedicated application analytics endpoint.
- Raw event/log APIs remain useful for evidence previews and fallback behavior during migration.

Completed:

- Added `GET /api/analytics/applications/:id`.
- Connected Risk Analytics metric cards to backend summary data.
- Connected Application, Risk Category, Rule, Environment, Department, User, and Model driver lists to backend driver data.
- Connected Application Risk Drill-down metrics, driver mix, recent high-risk examples, and AI Insight to backend application analytics data.
- Preserved existing Risk Events drill-through behavior.

Verification:

- `pnpm build` passes.
- API smoke test confirms summary, drivers, application drill-down, and page loading.

Next step:

- Decide whether to continue backend work on production ingestion contracts or improve Risk Analytics UI to expose backend aggregation provenance and compare/prioritization views.

## 56. Backend V1 Production Ingestion Contract

AI RiskOps now defines the first production-facing ingestion contract for model-call intake.

Decision:

- Production ingestion should support SDK, gateway proxy, log API, and agent tool audit integration methods.
- The first backend implementation should normalize production-style payloads into Call Logs, Risk Events, and risk evaluation outputs.
- The old prototype ingestion payload should remain compatible during the frontend transition.
- Real API-key authentication and application credential lifecycle are deferred to a later backend milestone.

Completed:

- Added a versioned ingestion contract with supported headers, integration methods, and example payload shape.
- Added `GET /api/ingest/model-call` so integrators can inspect the active contract.
- Extended `POST /api/ingest/model-call` to accept nested production payloads for application, request, user, model, content, context, and agent tool call data.
- Returned ingestion metadata, including contract version, ingestion source, trace ID, session ID, and application ID.
- Updated Policy Simulation to submit production-style model-call payloads.

Verification:

- `pnpm build` passes.
- Smoke test confirms the ingestion contract endpoint.
- Smoke test confirms production-style model-call ingestion creates a persistent Call Log and linked Risk Event.
- Smoke test confirms validation rejects unsupported data types.
- Smoke test confirms the homepage returns HTTP 200.
- Demo seed data was restored after smoke testing.

Next step:

- Validate the ingestion contract with API smoke tests, then decide whether to implement application credential management or continue connecting frontend pages to backend APIs.

## 57. Backend V1 Application Credential Management

Application Setup now includes the first backend-backed credential management workflow.

Decision:

- Application credential management belongs in Admin / Application Setup, not in the Applications risk visibility page.
- Only Platform Admin can view, generate, rotate, or revoke application credentials.
- Generated API secrets should only be shown once.
- The database stores key prefix and key hash, not the raw secret.
- Ingestion API key enforcement is the next backend step, not part of this UI-first credential milestone.

Completed:

- Added an `ApplicationCredential` data model.
- Added seeded credential records for active, rotation-required, and revoked credential states.
- Added Admin credential APIs for list, generate, rotate, and revoke actions.
- Added Integration Credentials UI to Application Setup.
- Added credential status counts, API key prefix display, last-used timestamp, source label, and admin action controls.
- Added one-time secret reveal after generate or rotate.

Verification:

- `pnpm run prisma:generate` passes.
- `pnpm run db:seed` passes.
- `pnpm build` passes.
- Smoke tests confirm User Access read, protected API rejection, App Owner assignment save, and running page availability.
- Smoke tests confirm session capability discovery, protected API rejection, App Owner CSV export, and homepage availability after restart.
- Smoke test confirms Platform Admin credential access and Global User rejection.
- Smoke test confirms generate, rotate, and revoke actions.
- Demo seed data was restored after mutation tests.

Next step:

- Connect model-call ingestion to application credentials by validating `Authorization: Bearer <application_api_key>` against stored credential hashes.

## 58. Backend V1 Credential-authenticated Ingestion

Model-call ingestion now supports application API key authentication.

Decision:

- Production model-call ingestion should authenticate with `Authorization: Bearer <application_api_key>`.
- The credential determines the application identity.
- Payload-provided `application.id` is optional when Bearer auth is present.
- If payload `application.id` conflicts with the authenticated credential, ingestion should be rejected.
- Active and Rotation Required credentials can ingest calls; Revoked credentials cannot.
- Profile-based ingestion remains available for prototype simulation and admin demo flows.

Completed:

- Added Bearer key parsing to `POST /api/ingest/model-call`.
- Added credential hash lookup against `ApplicationCredential.keyHash`.
- Added credential status enforcement for ingestion.
- Updated credential `lastUsedAt` after successful ingestion.
- Added response metadata for auth mode, credential ID, and credential status.
- Updated the ingestion contract to describe current credential-authenticated behavior.

Verification:

- `pnpm run prisma:generate` passes.
- `pnpm run db:seed` passes.
- `pnpm build` passes.
- Smoke test confirms a generated application credential can authenticate model-call ingestion.
- Smoke test confirms credential-authenticated ingestion resolves the application without payload `application.id`.
- Smoke test confirms invalid Bearer keys are rejected.
- Smoke test confirms payload application mismatch is rejected.
- Smoke test confirms credential `lastUsedAt` updates after successful ingestion.
- Demo seed data was restored after mutation tests.

Next step:

- Decide whether to add rate limiting and request audit metadata for ingestion, or move to raw prompt/output data protection.

## 59. Backend V1 Raw Content Protection

AI RiskOps now applies a first layer of protection to raw model-call content.

Decision:

- Normal product APIs should return masked prompt, output, RAG context, and tool call content.
- Newly ingested model calls should be evaluated first, then stored in masked form.
- Raw prompt/output reveal is not included in this milestone.
- Full encryption-at-rest and approval-based raw reveal remain future product decisions.

Completed:

- Added shared captured-content masking for emails, phone numbers, payment cards, Bearer tokens, API keys, private key blocks, and government-ID-like identifiers.
- Applied masked storage to new model-call ingestion.
- Applied masked API responses to Call Logs and Risk Event detail source call logs.
- Added data protection metadata to relevant API responses.
- Updated the ingestion contract with data protection behavior.

Verification:

- `pnpm build` passes.
- Smoke test confirms risk evaluation still uses submitted content before masking.
- Smoke test confirms newly ingested prompt, output, RAG context, and tool call values are masked.
- Smoke test confirms Call Log detail and Risk Event detail source call logs return masked content.
- Demo seed data was restored after mutation tests.

Next step:

- Decide whether to add raw-content reveal workflow, encryption-at-rest, or retention policy controls.

## 60. Backend V1 Ingestion Request Audit

AI RiskOps now records ingestion request audit metadata for both successful and failed model-call ingestion.

Decision:

- Ingestion audit belongs in Admin / Application Setup because it helps Platform Admin troubleshoot integration health.
- Audit records should not store raw prompt, output, RAG context, or tool call content.
- Successful and failed ingestion requests should both be recorded.
- Non-admin profiles should not access ingestion audit records.

Completed:

- Added an `IngestionRequestAudit` data model.
- Added seeded ingestion audit examples covering success, invalid API key, and validation failure.
- Added `GET /api/admin/ingestion-audit`.
- Added ingestion audit writes to success and failure paths in `POST /api/ingest/model-call`.
- Added an Ingestion Request Audit section to Admin / Application Setup.
- Added summary metrics for total requests, success rate, credential-auth rate, average latency, failed requests, and top failure reason.

Verification:

- `pnpm run prisma:generate` passes.
- `pnpm run db:seed` passes after generating the new Prisma Client.
- `pnpm build` passes.
- Smoke test confirms Platform Admin audit access and Global User rejection.
- Smoke test confirms success and failure ingestion paths create audit records.
- Demo seed data was restored after mutation tests.

Next step:

- Continue the combined backend hardening milestone with Policy Center backend APIs for rule and policy-template state.

## 61. Backend V1 Policy Center APIs

AI RiskOps now uses backend APIs for the Admin / Policy Center rule and policy-template state.

Decision:

- Policy Center remains visible only to Platform Admin.
- Backend V1 should support lightweight enable/disable controls for policy templates and risk rules.
- This milestone should not introduce policy approval workflows, version rollback, threshold editing, or production audit trails.
- Policy Simulation remains a testing surface inside Policy Center and does not yet persist simulation history.

Completed:

- Added a Policy Center read API for policy templates, policy-rule bindings, and rule operational statistics.
- Added policy template enable/disable API.
- Added risk rule enable/disable API that updates all template bindings for that rule.
- Connected the Policy Center frontend to backend API data.
- Preserved the existing policy-template cards, rule library table, response matrix, and simulation surface.

Verification:

- `pnpm build` passes.
- Smoke tests confirm Platform Admin read/write access, Global User rejection, and baseline seed restoration after write tests.

Next step:

- Continue the combined backend hardening milestone with Application Setup backend APIs, or move to Risk Analytics backend enhancement if the admin surfaces are sufficient for the current prototype.

## 62. Backend V1 Application Setup APIs

AI RiskOps now uses backend APIs for Admin / Application Setup status visibility.

Decision:

- Application Setup remains visible only to Platform Admin.
- Backend V1 should make setup readiness visible before adding application creation or editing.
- Applications remains the broad application risk visibility page; Application Setup remains the admin-only integration configuration page.
- Credential management and ingestion audit remain separate backend API modules within the same Admin / Application Setup product surface.

Completed:

- Added an Application Setup read API for application status, integration method, field coverage, policy binding, environment state, validation checks, and latest credential state.
- Connected Application Setup top metrics to backend data.
- Connected Application Setup Status rows to backend data.
- Preserved existing credential management and ingestion request audit sections.

Verification:

- `pnpm build` passes.
- Smoke tests confirm Platform Admin setup access, Global User rejection, and homepage availability after restart.

Next step:

- Continue backend hardening by moving Risk Analytics aggregation deeper into backend APIs, or discuss whether Application Setup should support real app creation in a later admin workflow.

## 63. Backend V1 Risk Analytics Drill-down API

AI RiskOps now uses a backend API for Risk Analytics drill-down evidence.

Decision:

- Risk Analytics should explain risk concentration and provide investigation entry points.
- Drill-down evidence should be backend-backed because category and rule scopes depend on persisted rule-match records.
- Drill-down should not become a case-management, remediation, or audit workflow surface.
- Risk Events remains the place for tabular investigation after analytics users choose a driver.

Completed:

- Added a drill-down API for application, category, rule, environment, department/data, model, and user scopes.
- Returned backend-computed risk-event count, High+Severe Rate, average score, max score, top event, top application, top category, top rule, event rows, and insight text.
- Connected the Risk Analytics / Drill-down Evidence panel to the backend API.
- Kept existing Risk Analytics to Risk Events drill-through behavior.

Verification:

- `pnpm build` passes after a clean `.next` rebuild.
- Smoke tests confirm the drill-down API response and homepage availability after restart.

Next step:

- Continue backend hardening by reducing Risk Analytics dependency on raw event/log list loading, or discuss the next product capability before building.

## 64. Backend V1 Risk Analytics Aggregation-First Frontend

Risk Analytics now relies on backend aggregation APIs for its core page rendering.

Decision:

- Risk Analytics should not need to load all Risk Events and Call Logs just to render metrics, drivers, and drill-down panels.
- Raw row loading should stay in Risk Events and Call Logs, where users inspect individual records.
- Applications can still be loaded as lightweight context for filters, app labels, coverage gaps, and drill-through IDs.

Completed:

- Removed full Risk Events and Call Logs loading from the Risk Analytics page initialization path.
- Kept backend summary, driver, application drill-down, and evidence drill-down APIs as the primary analytical data sources.
- Updated Risk Analytics count badges to use backend summary values.
- Preserved frontend fallback behavior for incomplete API states.

Verification:

- `pnpm build` passes.
- Smoke tests confirm analytics APIs and homepage availability after restart.

Next step:

- Discuss the next backend product capability: real application creation, risk-event status writes, authentication/permissions, or deeper analytics export/reporting.

## 65. Backend V1 Operations Write and Export Thin Slice

AI RiskOps now includes a thin backend slice across application creation, risk-event review metadata updates, permission discovery, and analytics export.

Decision:

- Review metadata updates should remain lightweight and should not turn Risk Events into a remediation workflow surface.
- Application creation belongs in Admin / Application Setup and is restricted to Platform Admin.
- Permission discovery can be represented as profile-based capabilities until real authentication is selected.
- Analytics export should be backend-generated from aggregation APIs rather than frontend-loaded event and log rows.

Completed:

- Added a session capability API.
- Added risk-event review metadata update API and UI controls.
- Added application registration API and Admin / Application Setup form.
- Added analytics report API with JSON and CSV output.
- Added Risk Analytics CSV export button.

Verification:

- `pnpm build` passes.
- Smoke tests confirm the new read/write/export APIs, seed restoration after mutation tests, and homepage availability after restart.

Next step:

- Discuss which thin-slice capability should be hardened next: real auth integration, richer application setup workflow, review history, or scheduled analytics reports.

## 66. Backend V1.1 Capability-Based Permission Refactor

AI RiskOps now authorizes protected backend routes through centralized capability checks.

Decision:

- The prototype should keep User Profile switching, but protected APIs should not hard-code `Platform Admin` checks route by route.
- Capabilities should become the stable bridge between the current profile simulation and future SSO / group-based authorization.
- This milestone does not add real authentication, tenant isolation, SCIM, or enterprise SSO.

Completed:

- Added centralized capability helpers.
- Refactored Admin, Policy Center, Credential, Application Setup, Ingestion Audit, Risk Event review update, and Analytics Report permissions around capabilities.
- Kept `/api/session` as the frontend-visible capability discovery endpoint.

Verification:

- `pnpm build` passes.
- Smoke tests confirm protected API access, rejection behavior, session capability discovery, analytics export behavior, and homepage availability after restart.

Next step:

- Discuss whether to add real auth-provider integration design, permission-set persistence, or UI-driven permission administration.

## 67. Backend V1.2 Persistent Permission Sets

AI RiskOps now persists permission sets in the backend instead of deriving all API permissions directly from the prototype profile.

Decision:

- User Profile switching should remain available in the prototype, but backend authorization should read capability assignments from the database when available.
- Permission Sets should be the bridge from prototype profiles to future admin-managed permissions, SSO group mapping, or provisioning sync.
- This milestone should not add real login, SSO, tenant isolation, SCIM, or a permission administration UI yet.

Completed:

- Added persistent Permission Set, Permission Set Capability, and User Permission Set Assignment models.
- Seeded Global User, App Owner, and Platform Admin permission sets.
- Updated `/api/session` and protected backend routes to use database-backed capability checks first, with profile-based fallback behavior.

Verification:

- `pnpm run prisma:generate` passes.
- `pnpm run db:seed` passes.
- `pnpm build` passes.

Next step:

- Smoke test the running app and then decide whether to build the permission administration UI, harden auth design, or continue backend API coverage.

## 68. Backend V1.3 User Access Administration

AI RiskOps now includes a lightweight Admin / User Access surface for managing product permission sets and application-scoped visibility.

Decision:

- User Access should be an Admin configuration surface, not a full enterprise IAM or approval workflow.
- Platform Admin should be able to assign a reusable Permission Set and, for App Owner scope, multiple assigned applications.
- Custom capability-by-capability editing is intentionally deferred until the permission model has more real usage evidence.

Completed:

- Added a dedicated `canManageUserAccess` capability for Platform Admin.
- Added backend user-access read and update APIs.
- Added Admin / User Access frontend with user list, selected-user detail, Permission Set selector, capability display, and assigned-application editor.

Verification:

- `pnpm run prisma:generate` passes.
- `pnpm run db:seed` passes.
- `pnpm build` passes.

Next step:

- Smoke test the User Access API and running page, then decide whether to continue with auth hardening, backend API coverage, or product polish.

## 69. Backend V1.4 Backend Coverage Cleanup

AI RiskOps now removes high-impact frontend mock fallbacks from Admin surfaces and top-level selection state.

Decision:

- Admin surfaces should show backend API errors or empty states instead of silently falling back to frontend sample data.
- V1.4 should avoid broad rewrites and focus on the most visible backend-coverage cleanup first.
- Applications explanation and capability labels can remain frontend presentation logic until the next backend enrichment pass.

Completed:

- Removed Policy Center fallback to local policy template and rule operational sample data.
- Removed Application Setup fallback to local connected application sample data.
- Removed Home-level default initialization from local risk event and call log sample data.
- Added explicit Policy Center empty states for missing API templates and rules.
- Removed Risk Analytics frontend event/log fallback calculations.
- Removed the unused local connected application sample dataset.
- Updated Applications default selection to depend on backend data.

Verification:

- `pnpm build` passes.
- Smoke tests confirm affected pages return HTTP 200 and Admin APIs return backend data.

Next step:

- Smoke test the running pages, then continue with remaining Risk Analytics / Applications fallback reduction or API contract documentation.

## 70. Backend V1.5 API Contract Documentation

AI RiskOps now has a formal current-state API contract reference.

Decision:

- API documentation should describe the working implementation before introducing real authentication or deployment-specific contracts.
- The contract should be readable by product, frontend, and backend collaborators, not only generated as a machine OpenAPI file.
- Known limitations should stay explicit so the prototype does not appear more production-ready than it is.

Completed:

- Added `docs/api-contract.md`.
- Documented response envelopes, query-based scope simulation, capability checks, endpoint groups, ingestion contract, data protection behavior, and current limitations.

Verification:

- API contract was reviewed against existing route handlers.

Next step:

- Decide whether to proceed with auth design, API hardening, or a demo-ready product walkthrough package.

## 71. Backend V1.6 Auth And Permission Design

AI RiskOps now has a backend-ready authentication and permission design.

Decision:

- User Profile remains a prototype and demo abstraction.
- Production authorization should be based on authenticated user identity, permission sets, capabilities, data scope, and assigned application access.
- Company job roles should not be hard-coded into product authorization logic.
- Full SSO, tenant isolation, SCIM, and custom capability editing are intentionally deferred until the backend data model is stable.

Completed:

- Added `docs/auth-permission-design.md`.
- Defined the recommended session resolution flow from prototype profile simulation to production authenticated users.
- Documented default permission sets, capability matrix, application-scope rules, API authorization rules, ingestion authentication, implementation gaps, and recommended next build step.

Verification:

- Auth and permission design was reviewed against current `lib/api/scope.ts`, `lib/api/permissions.ts`, Prisma access models, seeded permission sets, and `docs/api-contract.md`.

Next step:

- Decide whether to implement access-audit records for User Access updates, move more frontend authorization to `/api/session` capabilities, or continue backend hardening for data and API coverage.

## 72. Backend V1.7 Access Audit Log

AI RiskOps now records Admin / User Access permission changes as backend audit events.

Decision:

- User Access changes should produce a lightweight audit trail even before building a full IAM or approval workflow.
- Audit logging should happen in the same transaction as the permission update so access state and audit state stay consistent.
- Access audit records should capture before/after permission set and assigned application scope, not raw personal or model-call content.

Completed:

- Added `AccessAuditLog` to the Prisma schema and local SQLite seed setup.
- Updated `PATCH /api/admin/user-access` to write `user_access.updated` audit records.
- Updated `GET /api/admin/user-access` to return the latest access audit logs.
- Updated `docs/api-contract.md`.

Verification:

- `pnpm run prisma:generate` passes.
- `pnpm run db:seed` passes.
- `pnpm build` passes.
- Smoke test confirms User Access PATCH succeeds and `GET /api/admin/user-access` returns the new `accessAuditLogs` record.

Next step:

- Decide whether to expose access audit logs in the Admin UI, continue replacing profile-query simulation with session-driven frontend capabilities, or add backend audit coverage for Policy Center and Application Credential changes.

## 73. Backend V1.8 Recent Access Changes UI

AI RiskOps now exposes User Access audit records in the Admin UI.

Decision:

- Access audit visibility should stay lightweight for the first online-ready version.
- User Access should show recent permission changes in context, without creating a separate audit center or workflow.
- The product roadmap should now prioritize online deployment and real-data integration work over new feature expansion.

Completed:

- Added `Recent Access Changes` to Admin / User Access.
- Displayed audit time, action, actor, permission-set change, and application-scope change.
- Connected the table to `GET /api/admin/user-access` `accessAuditLogs`.

Verification:

- `pnpm build` passes.

Next step:

- Focus only on online readiness: repository setup, deployment target, environment configuration, database choice, production seed/migration path, and first real data ingestion path.

## 74. Online Readiness Focus

AI RiskOps should now move from product expansion to launch preparation.

Necessary work before GitHub and online deployment:

- Initialize or verify Git repository hygiene, ignore generated/cache/database files, and prepare a clean GitHub-ready commit.
- Choose the first deployment target and database path.
- Replace local SQLite assumptions where needed for deployment.
- Define production environment variables and secret handling.
- Keep demo profile switching only if explicitly positioned as demo mode.
- Verify build, startup, primary pages, protected Admin APIs, and model-call ingestion on the deployment target.
- Prepare a concise README with product positioning, local setup, API contract, and demo flow.

Completed:

- Added `README.md`.
- Added `.env.example`.
- Expanded `.gitignore` for GitHub readiness.
- Initialized the local Git repository.
- Added GitHub CI workflow.
- Added `docs/online-launch-plan.md`.
- Updated `pnpm build` so clean environments generate Prisma Client before Next.js build.

Non-essential for immediate launch:

- Full SSO or SCIM.
- Custom permission-set builder.
- Dedicated audit center.
- Full case-management or remediation workflows.
- More frontend analytics features before real data ingestion works.

## 75. Backend V1.9 Neon Postgres Migration Preparation

AI RiskOps now targets Neon Postgres for the first online deployment path.

Decision:

- Use Vercel + Neon Postgres for the fastest online version.
- Stop using local SQLite as the runtime database path.
- Require `DATABASE_URL` to be a Postgres connection string before starting or seeding the product.
- Keep demo User Profile switching for first online demo mode until real authentication is selected.

Completed:

- Changed Prisma datasource provider from SQLite to Postgres.
- Replaced the Prisma SQLite runtime adapter with `@prisma/adapter-pg`.
- Replaced SQLite dependencies with Postgres dependencies.
- Updated local and deployment environment templates for Postgres.
- Updated seed flow so database schema setup uses `prisma db push` and seed only inserts data.
- Updated README and online launch plan for Neon Postgres.
- Updated build and preview scripts to generate Prisma Client before building.

Verification:

- `pnpm install --force` completes.
- `pnpm run prisma:generate` passes with Prisma Client 7.9.1.
- `pnpm build` passes.

Next step:

- Create a Neon Postgres project, set `DATABASE_URL`, run `pnpm run db:reset`, then verify the app against the real Neon database before deploying to Vercel.

## 76. Backend V1.10 Neon Database Initialization

AI RiskOps now has a working Neon Postgres database behind the local production preview.

Decision:

- Use the Neon pooled connection string for serverless-compatible runtime access.
- Keep `.env` local and untracked.
- Rotate the Neon password before public production use because the initial connection string was shared during setup.

Completed:

- Wrote the Neon `DATABASE_URL` to local `.env`.
- Updated the seed script to explicitly load `.env`.
- Ran `pnpm run db:reset` against Neon.
- Started the app against Neon-backed data.
- Verified read APIs and model-call ingestion write path.

Verification:

- `pnpm run db:reset` passes against Neon.
- `pnpm build` passes.
- `/` returns HTTP 200.
- `GET /api/overview/summary?profile=platform-admin` returns seeded Neon metrics.
- `GET /api/admin/user-access?profile=platform-admin` returns seeded users and permission sets.
- `GET /api/risk-events?profile=platform-admin` returns seeded events.
- `POST /api/ingest/model-call?profile=platform-admin` creates a new call log and severe risk event in Neon.
- Overview summary updates from 4 to 5 risk events after ingestion.

Next step:

- Push the repository to GitHub, configure Vercel with the Neon `DATABASE_URL`, and deploy the first online version.

## 77. Launch Demo Dataset Scale-Up

AI RiskOps now uses a larger seeded operating dataset for the online demo.

Decision:

- Keep the launch dataset synthetic and deterministic.
- Increase the seeded dataset from 1,250+ model calls and 140+ risk events to 5,000+ model calls and 620+ risk events.
- Avoid changing product logic or data models in this step; this is a lightweight demo-scale improvement before real data ingestion is hardened.

Completed:

- Updated the scaled seed generator targets in `prisma/seed.mjs`.
- Updated README and delivery summary dataset descriptions.

Next step:

- After confirmation, run `pnpm run db:reset` against the Neon demo database so the online product reflects the larger dataset.

## 78. Decision Notes

- Product name remains AI RiskOps.
- User-facing product content should be displayed in English.
- Formal product documents, including this Living PRD and demo scripts, should be maintained in English.
- Team discussion in this Codex thread can continue in Chinese.
- Example data in the product UI should also be English because the product is not positioned only for Chinese users.
- Product copy should follow a clear, restrained enterprise security SaaS style.
- Red Team Testing should not be a primary navigation item in the first product version; single-call testing belongs under Admin / Policy Center as Policy Simulation.
- Application onboarding should live under Admin / Application Setup; Applications should prioritize application-level risk visibility.
- Policy Center should live under Admin navigation because it controls platform detection policy and simulation.
- User profiles should be used as the product permission abstraction; job roles remain user personas, not hard-coded permission boundaries.
- App Owner should use Assigned Applications scope; the prototype demonstrates this with multiple assigned applications.
- Risk Events should behave like an operational queue with search and filters before adding backend persistence.
- Risk Event rows should be scan-friendly and avoid dense multi-column layouts.
- Overview should become a risk posture page; Severe Event Snapshot needs a clear path into Risk Events.
- V0.9 should prioritize risk evidence and explainability over audit trails or remediation workflow.
- Backend V1 starts with SQLite, Prisma, seeded data, and read APIs before ingestion or write workflows.
- API scope simulation uses `profile` query parameters until real authentication is selected.
- Call Log detail APIs expose full prompt/output/context in the prototype; production raw-data visibility still needs a product decision.
- Top Risky Applications should sort by Severe Count first, then High Count, then Max Risk Score.
- Overview is the first frontend surface migrated to backend API data.
- Risk Events is the second frontend surface migrated to backend API data.
- Call Logs is the third frontend surface migrated to backend API data.
- Production ingestion starts with a versioned model-call contract that supports SDK, gateway proxy, log API, and agent tool audit sources.
- Application credential management belongs in Admin / Application Setup and is visible only to Platform Admin.
- Model-call ingestion supports application credential authentication while keeping profile-based ingestion for prototype flows.
- Normal APIs should return masked raw prompt/output/context/tool content by default.
- Ingestion request audit belongs in Admin / Application Setup and must avoid storing raw model-call content.
- Applications is the fourth frontend surface migrated to backend API data.
- Model Call Ingestion is the first backend write path and makes Policy Simulation persistent.
- Risk Analytics is a frontend-first analysis surface that explains risk drivers using existing backend APIs before adding dedicated analytics endpoints.
- Risk Events Saved Views start as local browser state and should only become backend-backed when team sharing or user identity is required.
- Applications detail should include application-level risk explanation, but should not become a remediation or audit workflow surface.
- Risk Analytics filters and drill-downs should help users investigate risk concentration without turning the page into a case-management workflow.
- Risk Analytics to Risk Events drill-through should pre-filter the event workbench, while keeping Risk Analytics as an analysis page and Risk Events as the investigation table.
- Risk Events filter state should be URL-persisted first because it is the primary table users will share during investigation.
- Risk Analytics application drill-down should summarize application-level drivers and evidence before users enter the event table.
- Backend V1 should enforce that every Risk Event originates from one source Call Log.
- App Owner access should be represented as application-scoped permissions, not hard-coded role ownership.
- Application V1 uses one active policy template; per-rule enablement and overrides live in PolicyRule.
- Backend API responses should use stable success/error envelopes while preserving frontend-compatible `data` fields.
- Model-call ingestion should reject malformed, incomplete, or oversized payloads before writing Call Logs or Risk Events.
- Risk Analytics aggregation should move into backend APIs before adding more frontend-only analytics complexity.
- Risk Analytics frontend should consume backend aggregation APIs incrementally while keeping raw event/log reads for evidence and fallback states.
- Successful model-call ingestion should update Application Setup validation checks so real traffic automatically proves API key configuration, call-log receipt, captured prompt/output/RAG context, and audited tool-call readiness.
- The public demo should display a persistent demo-mode notice because User Profile switching simulates access scope and is not production authentication.
- Risk review statuses should be contract-tested across seed data, backend write allowlists, frontend metadata, and UI selectors to prevent enum drift from breaking Risk Events.
