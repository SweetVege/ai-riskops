# Real Data Intake Plan

This plan defines how AI RiskOps should start ingesting real AI application data without turning the public demo into an unsafe production data store.

## Intake Goal

The first real-data milestone is not full production monitoring. The goal is to validate that AI RiskOps can ingest real application-shaped model-call records, preserve traceability, generate useful risk events, and update analytics with enough signal quality for product evaluation.

## Recommended First Integration

Start with one low-risk internal AI application or a controlled demo application that resembles a real enterprise workflow.

Preferred first source:

- A RAG assistant, support copilot, or internal knowledge assistant.
- Low business impact if ingestion fails.
- Able to send `Test` environment traffic first.
- Able to provide prompt, output, user role, model name, timestamp, and trace ID.

Avoid for the first source:

- Payment, HR, legal, or production customer-data workflows.
- Agent systems that can execute destructive tools.
- Any flow that requires storing raw secrets, payment cards, government IDs, or highly sensitive personal data.

## Phased Rollout

| Phase | Data Type | Volume | Environment | Goal |
|---|---|---:|---|---|
| 1. Contract sample | Real schema, synthetic or masked content | 10 to 20 calls | Test | Validate payload mapping and credential auth |
| 2. Historical replay | Masked historical logs | 50 to 200 calls | Test | Validate timestamps, categories, rules, and analytics |
| 3. Shadow live feed | Live low-risk traffic, masked where possible | 1 to 5 percent sample | Test | Validate stability, audit records, and risk signal quality |
| 4. Controlled production observability | Production traffic with approved retention policy | Limited scope | Production | Validate operational dashboard and event usefulness |

Do not move to Phase 4 until production authentication, tenant boundaries, and retention policy are decided.

## Minimum Payload Contract

Use the existing endpoint:

```text
POST https://ai-riskops.vercel.app/api/ingest/model-call
Authorization: Bearer <application_api_key>
Content-Type: application/json
```

Minimum useful fields:

```json
{
  "contractVersion": "2026-08-06.v1",
  "ingestionSource": "sdk",
  "request": {
    "traceId": "trace-real-sample-001",
    "sessionId": "session-real-sample-001",
    "occurredAt": "2026-08-16T10:00:00.000Z"
  },
  "user": {
    "id": "masked_user_123",
    "role": "Support Agent",
    "department": "Customer Service"
  },
  "model": {
    "provider": "openai",
    "name": "gpt-4.1"
  },
  "environment": "Test",
  "content": {
    "prompt": "Summarize the latest customer support issue.",
    "output": "The customer asked about invoice timing."
  },
  "context": {
    "dataType": "Customer Data",
    "ragContext": "Masked CRM and support-ticket context."
  },
  "agent": {
    "toolCall": "lookup_ticket(ticket_id=masked_ticket_001)"
  }
}
```

At least one of these fields is required:

- `content.prompt`
- `content.output`
- `context.ragContext`
- `agent.toolCall`

## Field Mapping Checklist

| AI RiskOps Field | Source System Example | Required For First Test | Notes |
|---|---|---:|---|
| `request.traceId` | request ID, log ID, span ID | Yes | Needed for debugging and cross-system traceability |
| `request.sessionId` | chat session ID | Preferred | Useful for session-level analysis |
| `request.occurredAt` | model-call timestamp | Yes | Required for accurate trend charts |
| `user.id` | internal user ID | Preferred | Use masked or hashed IDs |
| `user.role` | employee role, customer role, service role | Yes | Important for driver analysis |
| `user.department` | team or department | Preferred | Useful for business context |
| `model.name` | model deployment name | Yes | Useful for future model-level analysis |
| `environment` | Test, Production | Yes | First tests should use `Test` |
| `content.prompt` | input prompt | Preferred | Mask before sending when possible |
| `content.output` | model response | Preferred | Mask before sending when possible |
| `context.ragContext` | retrieved documents or snippets | Optional | Send short masked snippets first |
| `context.dataType` | Customer, Financial, Employee, General | Yes | Drives risk context |
| `agent.toolCall` | tool name and action | Optional | Required for Agent risk evaluation |

## Data Protection Rules For First Intake

For the first real-data intake, use conservative handling:

- Send `environment: "Test"` unless explicitly approved.
- Use masked or hashed user IDs.
- Avoid sending full raw documents as RAG context.
- Truncate long prompts, outputs, and retrieved context before ingestion.
- Do not send secrets, API keys, payment card numbers, private keys, access tokens, government IDs, or full legal/medical records.
- Store application API keys only in the source application's secret manager.
- Use separate credentials for Test and Production integrations.

Current AI RiskOps behavior:

- Captured text fields are protected with masking before storage and response.
- Standard read APIs do not expose raw sensitive content.
- Ingestion audit records avoid storing raw model-call content.

Remaining production decisions:

- Raw-content retention period.
- Whether any raw prompt/output storage is allowed.
- Tenant isolation and authorization boundaries.
- Production authentication to replace demo User Profile switching.

## Acceptance Criteria

Phase 1 is successful when:

- 10 to 20 calls are accepted through application credential auth.
- Call Logs show the ingested records with correct application, environment, model, timestamp, and trace ID.
- Ingestion Audit shows success records and no unexpected failures.
- Application Setup validation checks update for captured fields.
- At least one intentionally risky sample creates a Risk Event.
- Risk Events show matched rules and evidence linked to the originating Call Log.
- Overview and Risk Analytics reflect the new records after refresh.

Phase 2 is successful when:

- 50 to 200 masked historical calls can be replayed without schema errors.
- Trend charts use source timestamps correctly.
- Risk category distribution and Top Risky Applications update predictably.
- Analysts can explain the top risk drivers from Risk Analytics.
- False-positive candidates can be identified for later human review.

## First Test Dataset Proposal

Create 12 sample calls from one selected application:

| Sample Type | Count | Expected Outcome |
|---|---:|---|
| Normal Q&A | 3 | Allow or low-risk signal |
| Sensitive data request | 2 | Data leakage or access-risk event |
| Prompt injection attempt | 2 | Input attack event |
| RAG context contamination | 2 | Context contamination event |
| Agent tool export attempt | 2 | Agent behavior or access-risk event |
| Benign tool lookup | 1 | Allow or low-risk signal |

This gives enough variety to validate ingestion, risk event creation, evidence mapping, and analytics movement without sending large data volume.

## Implementation Options

### Option A: SDK Hook

Best when we control the application code.

- Add a small post-call hook after the model response is generated.
- Send prompt, output, metadata, and trace ID to AI RiskOps.
- Lowest architecture complexity for the first test.

### Option B: Log Replay Script

Best when we have exported logs.

- Convert existing logs into AI RiskOps payload shape.
- Replay a masked sample into the ingestion API.
- Good for validating analytics before live integration.

### Option C: Gateway Or Proxy

Best for production later.

- Route model calls through a central gateway.
- Capture pre-call and post-call data consistently.
- Better for enforcement, but more complex than the first test needs.

Recommended first step: use Option B if we have logs, otherwise Option A.

## Open Decisions

Before implementation, confirm:

1. Which application will be the first real-data source?
2. Is the first source a RAG assistant, chatbot, Copilot, or Agent?
3. Will data arrive through SDK hook, exported logs, or gateway/proxy?
4. Are prompt and output allowed after masking, or should we store metadata-only records first?
5. What is the allowed sample size for Phase 1?
6. Who owns the source application's API key and secret storage?

## Next Build Tasks

Once the first data source is selected:

1. Create or choose the target application in `Admin > Application Setup`.
2. Generate a Test application credential.
3. Prepare 10 to 20 masked payloads.
4. Send the sample through `POST /api/ingest/model-call`.
5. Validate Call Logs, Risk Events, Risk Analytics, Overview, and Ingestion Audit.
6. Document mapping issues and update the ingestion contract only if needed.

## Replay Tool

AI RiskOps includes a local replay tool for the first masked sample set.

Dry-run validation:

```bash
node scripts/replay-real-sample.mjs
```

Equivalent package script:

```bash
pnpm run replay:sample
```

Send to an AI RiskOps ingestion endpoint:

```bash
AI_RISKOPS_APPLICATION_KEY="<application_api_key>" \
node scripts/replay-real-sample.mjs --send
```

Optional environment variables and flags:

- `AI_RISKOPS_INGEST_URL`: override the default production demo ingestion endpoint.
- `AI_RISKOPS_APPLICATION_KEY`: required only when `--send` is used.
- `--file <path>`: replay a different sample JSON file.
- `--limit <number>`: replay only the first N samples.

Default mode is dry-run. Do not use `--send` until a Test application credential has been generated and stored outside the repository.
