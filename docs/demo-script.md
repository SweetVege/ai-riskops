# AI RiskOps Demo Script

## Audience

This demo is designed for:

- Enterprise security and risk teams
- Internal AI application platform teams
- Compliance and audit stakeholders
- Buyers evaluating GenAI governance, LLM security, or AI risk operations products

## Core Message

AI RiskOps helps enterprises monitor, detect, govern, and review risks introduced by LLM, RAG, Copilot, and Agent applications.

The product chain is:

```text
AI application call
-> call log
-> risk detection
-> risk event
-> system action
-> human review
-> policy tuning
```

## 3-Minute Demo

### 1. Start With Overview

Click path:

```text
Overview
```

Talk track:

- This is the AI application risk overview.
- It shows model call volume, risk event count, blocked calls, and average event risk score.
- The goal is to give security and risk teams a daily operating picture across LLM, RAG, and Agent applications.

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

- Risk Level Trend can switch between Daily, Monthly, and Quarterly.
- The stacked bars show event volume by severity level.
- The blue line shows High+Severe Rate, with a point and percentage label for each period.
- Risk Category Distribution is shown as a solid pie chart.
- Top Risky Applications is a horizontal bar chart ranked by Severe Count, with average risk score as the tie-breaker.

### 2. Open Risk Event Workbench

Click path:

```text
Risk Events
```

Talk track:

- This is the event handling queue.
- Overview is for posture; Risk Events is for operational review and remediation.
- Events are separated by risk level, system action, and human review status.
- Operators can search by app, user, or rule ID, then narrow the list by level, system action, or review status.

Point out:

- Search
- Risk level filter
- System action filter
- Human review filter
- Clear filters
- Pending Review
- In Progress
- Confirmed
- False Positive
- Owner
- SLA

### 3. Explain One Event

Click any severe event.

Talk track:

- Each event preserves the risk score, matched rules, evidence, original prompt, tool call, recommendation, and review workflow.
- The system action shows what AI RiskOps did automatically.
- The human review status shows where the operations team is in the remediation lifecycle.

Point out:

- Matched Rules
- Evidence
- Prompt
- Tool Call
- Recommended Action
- Review & Response

### 4. Trace Back To Call Logs

Click path:

```text
Call Logs
```

Talk track:

- Every risk event should be traceable back to an original AI call.
- Call logs provide auditability: who called which model, with what context, what tool call, and what action was taken.

Point out:

- Call ID
- Trace ID
- Event ID
- Prompt
- Model Output
- RAG Context
- Agent Tool Call

### 5. Show Policy Center

Click path:

```text
Policy Center
```

Talk track:

- Policy Center is where governance teams manage rules and default actions.
- Rules are grouped into strategy templates by application type.
- The formal false-positive metric is based on human review outcomes, not system guesses.

Point out:

- Policy Templates
- Rule Library
- Human-reviewed false-positive rate
- Response Matrix

### 6. Close With Application Onboarding

Click path:

```text
Application Onboarding
```

Talk track:

- Enterprises can connect through an OpenAI-compatible proxy, SDK, log ingestion API, or Agent tool audit integration.
- This answers how teams move from a demo into actual deployment.
- Click a connected application to show its integration method, owner, environment status, field coverage, and validation checklist.

Point out:

- OpenAI-compatible Proxy
- SDK Integration
- Log Ingestion API
- Agent Tool Audit
- Connected App Detail
- Environment Status
- Validation Checklist
- Proxy code example

## 10-Minute Demo

### 1. Establish The Problem

Talk track:

- Enterprises are deploying AI copilots, RAG systems, and Agents quickly.
- Risk teams need visibility into prompt injection, data leakage, unsafe tool use, unauthorized access, and model output risk.
- Traditional application logs do not explain AI-specific behavior well enough.

### 2. Overview: Daily Risk Posture

Click path:

```text
Overview
```

Talk track:

- AI RiskOps starts with an operational view.
- The dashboard separates call volume from risk events and blocked actions.
- It shows risk level trend, risk category distribution, top risky applications, and severe event snapshots.
- The trend combines stacked severity volume with High+Severe Rate so leaders can see both event volume and risk mix.
- The severe snapshot provides an entry point into Risk Events for detailed investigation.

### 3. Risk Events: Human Review Workflow

Click path:

```text
Risk Events
```

Talk track:

- AI risk operations requires a workflow, not only alerts.
- Each event has a review status, owner, SLA, and recommended action.
- This prevents risks from becoming a passive dashboard nobody owns.

Demo action:

- Search for a rule ID such as `PI-001` or an application name.
- Apply a risk level or human review filter.
- Clear filters to return to the full list.
- Select a pending event.
- Click Take Ownership.
- Then click Confirm Risk or Mark False Positive.

Explain:

- `System Action` is what the platform did automatically.
- `Human Review` is what the security or risk team has decided after review.

### 4. Evidence Chain

Click an event with a tool call or prompt injection.

Talk track:

- The event explains why the risk was detected.
- Evidence is preserved for audit and communication with business owners.
- This is critical for explainability and trust.

### 5. Call Logs: Audit Backbone

Click path:

```text
Call Logs
```

Talk track:

- Call logs are the audit foundation.
- They preserve the model request, response, RAG context, tool call, risk score, action, and event linkage.
- This makes the risk event traceable.

### 6. Policy Simulation: Simulate A New Risk

Click path:

```text
Policy Center -> Policy Simulation
```

Demo action:

- Choose `RAG Knowledge Base: Indirect Prompt Injection` or `Finance Agent: High-Risk Payment Approval`.
- Click `Run Detection`.
- Explain the risk score, matched rules, evidence, and recommended action.
- Click `Simulate Ingestion & Generate Event`.

Talk track:

- This simulates what would happen when a real AI app sends a call through AI RiskOps.
- The platform creates a call log and, when action is not allow, generates a risk event.
- Policy Simulation is an internal testing capability inside Policy Center, not a primary production navigation module.

### 7. Show The Generated Call Log

The app should navigate to:

```text
Call Logs
```

Talk track:

- The new call is now visible in the audit trail.
- If the action was not allow, it is linked to a newly generated risk event.

### 8. Show Policy Governance

Click path:

```text
Policy Center
```

Talk track:

- The policy layer controls how AI RiskOps behaves.
- Different applications can use different strategy templates.
- Enterprise baseline rules should always remain active even if an application strategy is disabled.

Point out:

- Strategy templates
- Rule base score
- Default action
- Manual review false-positive rate
- Action matrix

### 9. Show Application Onboarding

Click path:

```text
Application Onboarding
```

Talk track:

- Application teams can start with proxy, SDK, log API, or Agent tool audit.
- The OpenAI-compatible proxy is the recommended path for central enforcement.
- Metadata-only and redaction modes can support sensitive environments.
- Selecting an app shows whether Test and Production are ready, which fields are captured, and which validation checks are still missing.

### 10. Close With Roadmap

Talk track:

- Current prototype is an in-memory product demo.
- Next phases would add persistence, real proxy integration, application keys, rule versioning, workflow audit logs, and enterprise deployment controls.

## Common Questions

### Is this only a manual scanner?

No. The detection sandbox is a demo and rule-debugging tool. The target production path is automated integration through proxy, SDK, or log ingestion.

### Where does false-positive rate come from?

The formal metric should come from completed human review or explicit business feedback.

```text
Human-reviewed false-positive rate = false_positive / (confirmed + false_positive + resolved + escalated)
```

Pending and in-progress events should not enter the denominator.

### What happens if a strategy template is disabled?

Disabled templates cannot be selected by newly onboarded applications. Existing bound applications should continue using the last effective version until migrated. Enterprise baseline rules should still apply.

### Does AI RiskOps replace model safety controls?

No. It complements model safety by adding enterprise-specific logging, policy, review, evidence, and governance workflows around AI applications.

### Does this require sending private data to another model?

Not necessarily. The first implementation can use deterministic local rules. Future LLM-as-judge features should be optional, scoped, and governed by data handling policy.

### What is the difference between call logs and risk events?

Call logs are the raw audit trail of AI activity. Risk events are generated when the system detects a meaningful risk requiring visibility, action, or review.

## Current Prototype Limitations

- Data is mock or in-memory.
- No database persistence.
- No real authentication or RBAC.
- No real gateway endpoint.
- No real API key generation.
- No streaming model proxy.
- No persistent audit trail for status changes.
- Detection rules are deterministic and early-stage.

## Suggested Next Roadmap

1. Persist call logs and risk events.
2. Add application keys and real app onboarding flow.
3. Build an OpenAI-compatible proxy endpoint.
4. Store review comments and status change audit history.
5. Add rule versioning and policy publish workflow.
6. Add filtering, search, and export.
7. Add batch red-team testing and report generation.
8. Add optional LLM judge for complex semantic cases.
