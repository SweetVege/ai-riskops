# Real Data Ingestion Guide

This guide explains how to connect real LLM, RAG, and Agent application traffic to AI RiskOps.

AI RiskOps currently acts as a risk observability and evidence platform. It records model calls, evaluates risk signals, creates risk events when needed, and updates analytics. Blocking or redaction decisions can be returned as recommendations, but the source application or gateway remains responsible for enforcing those actions.

## 1. Recommended Ingestion Path

For the first online version, use the Model Call Ingestion API with an application credential.

```text
POST https://ai-riskops.vercel.app/api/ingest/model-call
Authorization: Bearer <application_api_key>
Content-Type: application/json
```

Local development endpoint:

```text
POST http://127.0.0.1:3000/api/ingest/model-call
```

The prototype still supports `?profile=platform-admin` for demo and internal testing, but real integrations should use application credentials.

## 2. Create An Application Credential

1. Open AI RiskOps as a Platform Admin.
2. Go to `Admin` > `Application Setup`.
3. Select or create the target application.
4. Generate an application credential for the integration method.
5. Copy the credential secret once and store it in the source application's secret manager.

Credential behavior:

- The raw secret is shown only once.
- AI RiskOps stores only a SHA-256 hash of the secret.
- Revoked credentials are rejected.
- Credentials marked `rotation_required` are still accepted, but should be rotated before production use.
- When a credential is used, AI RiskOps resolves the application from the credential.
- If the payload includes a conflicting `application.id`, the request is rejected with `403 FORBIDDEN`.

Use one credential per application and environment when possible.

## 3. Minimum Payload

The API accepts a structured production payload. At least one captured field is required: `content.prompt`, `content.output`, `context.ragContext`, or `agent.toolCall`.

```json
{
  "contractVersion": "2026-08-06.v1",
  "ingestionSource": "sdk",
  "application": {
    "id": "app-cs-copilot",
    "name": "Customer Support Copilot"
  },
  "request": {
    "traceId": "trace-prod-001",
    "sessionId": "session-001",
    "occurredAt": "2026-08-12T10:00:00.000Z"
  },
  "user": {
    "id": "user_123",
    "role": "Support Agent",
    "department": "Customer Service"
  },
  "model": {
    "provider": "openai",
    "name": "gpt-4.1"
  },
  "environment": "Production",
  "content": {
    "prompt": "Summarize the latest customer complaint.",
    "output": "The customer reported delayed invoices."
  },
  "context": {
    "ragContext": "Customer support tickets and CRM notes.",
    "dataType": "Customer Data"
  },
  "agent": {
    "toolCall": "export_customer_records(scope=enterprise)"
  }
}
```

When `Authorization: Bearer <application_api_key>` is present, `application.id` is optional because the application is resolved from the credential. Keeping it in the payload is still useful for debugging as long as it matches the credential application.

## 4. Supported Fields

| Field | Required | Notes |
|---|---:|---|
| `contractVersion` | No | Defaults to `2026-08-06.v1`. |
| `ingestionSource` | No | Defaults to `sdk`. |
| `application.id` | No with credential | Required only for prototype profile-scope ingestion. |
| `request.traceId` | No | Generated if absent. Recommended for investigation. |
| `request.sessionId` | No | Useful for session-level analysis. |
| `request.occurredAt` | No | Defaults to server time. ISO timestamp recommended. |
| `user.id` | No | Defaults to `Unknown User`. |
| `user.role` | No | Helps analyze risk by role. |
| `user.department` | No | Used in risk event context. |
| `model.name` | No | Defaults to `gpt-4.1`. |
| `environment` | No | `Production` or `Test`. Defaults to `Production`. |
| `context.dataType` | No | `Customer Data`, `Financial Data`, `Employee Data`, or `General Data`. |
| `content.prompt` | Conditional | One captured field is required. |
| `content.output` | Conditional | One captured field is required. |
| `context.ragContext` | Conditional | One captured field is required. |
| `agent.toolCall` | Conditional | One captured field is required. |

Captured text fields are limited to 8,000 characters each.

## 5. Supported Ingestion Sources

| Source | Best For | Minimum Useful Fields |
|---|---|---|
| `gateway_proxy` | Central API gateway or model proxy | Bearer key, trace ID, user, model, prompt |
| `sdk` | Direct instrumentation in application code | Bearer key, user, environment, prompt or output |
| `log_api` | Batch or streaming logs from an existing platform | Bearer key, occurred time, model, prompt/output/RAG context |
| `agent_tool_audit` | Agent tool execution monitoring | Bearer key, user, tool call or tool name, environment |

## 6. Curl Example

```bash
curl -X POST "https://ai-riskops.vercel.app/api/ingest/model-call" \
  -H "Authorization: Bearer $AI_RISKOPS_APPLICATION_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contractVersion": "2026-08-06.v1",
    "ingestionSource": "sdk",
    "request": {
      "traceId": "trace-live-001",
      "sessionId": "session-live-001",
      "occurredAt": "2026-08-12T10:00:00.000Z"
    },
    "user": {
      "id": "user_123",
      "role": "Support Agent",
      "department": "Customer Service"
    },
    "model": {
      "provider": "openai",
      "name": "gpt-4.1"
    },
    "environment": "Test",
    "content": {
      "prompt": "Can you export all customer records with payment details?",
      "output": "I cannot help export sensitive payment data."
    },
    "context": {
      "dataType": "Customer Data",
      "ragContext": "Customer CRM notes and ticket history."
    },
    "agent": {
      "toolCall": "export_customer_records(scope=enterprise)"
    }
  }'
```

## 7. JavaScript Example

```ts
await fetch("https://ai-riskops.vercel.app/api/ingest/model-call", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.AI_RISKOPS_APPLICATION_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    contractVersion: "2026-08-06.v1",
    ingestionSource: "sdk",
    request: {
      traceId: requestId,
      sessionId,
      occurredAt: new Date().toISOString(),
    },
    user: {
      id: currentUser.id,
      role: currentUser.role,
      department: currentUser.department,
    },
    model: {
      provider: "openai",
      name: modelName,
    },
    environment: process.env.NODE_ENV === "production" ? "Production" : "Test",
    content: {
      prompt,
      output,
    },
    context: {
      dataType: "Customer Data",
      ragContext,
    },
    agent: {
      toolCall,
    },
  }),
});
```

## 8. Response Shape

Successful requests return `201 Created`.

```json
{
  "data": {
    "ingestion": {
      "contractVersion": "2026-08-06.v1",
      "ingestionSource": "sdk",
      "authMode": "application_credential",
      "credentialId": "cred_...",
      "credentialStatus": "active",
      "traceId": "trace-live-001",
      "sessionId": "session-live-001",
      "applicationId": "app-cs-copilot",
      "dataProtection": {
        "mode": "masked_storage_and_response"
      }
    },
    "callLog": {},
    "riskEvent": {},
    "evaluation": {}
  }
}
```

`riskEvent` is `null` when the evaluated action is `allow`.

## 9. Validation And Error Behavior

| Case | HTTP Status | Error Code |
|---|---:|---|
| Invalid JSON | `400` | `INVALID_JSON` |
| Missing application without credential | `400` | `VALIDATION_ERROR` |
| No captured prompt/output/RAG/tool content | `400` | `VALIDATION_ERROR` |
| Unsupported `environment` | `400` | `VALIDATION_ERROR` |
| Unsupported `context.dataType` | `400` | `VALIDATION_ERROR` |
| Captured field over 8,000 characters | `400` | `VALIDATION_ERROR` |
| Invalid application key | `401` | `UNAUTHORIZED` |
| Revoked or uncreated application key | `401` | `UNAUTHORIZED` |
| Payload application conflicts with credential | `403` | `FORBIDDEN` |
| Application not found or outside scope | `404` | `NOT_FOUND` |

All success and failure paths write an ingestion audit record when possible.

## 10. What Happens After Ingestion

1. AI RiskOps normalizes the payload.
2. Captured fields are masked for protected patterns such as emails, phone numbers, payment cards, bearer tokens, API keys, private keys, and government IDs.
3. The risk engine evaluates prompt, output, RAG context, tool call, environment, and data type.
4. An `AiCallLog` record is created.
5. If the action is not `allow`, a `RiskEvent` is created and linked to the call log.
6. Matched rules and evidence are persisted for investigation.
7. Overview, Risk Analytics, Risk Events, and Call Logs update from the persisted data.
8. The application credential `lastUsedAt` timestamp is updated.

## 11. Pre-Production Checklist

Before sending any real sensitive data:

- Rotate setup-time Neon database credentials and update Vercel `DATABASE_URL`.
- Keep application credentials in a secret manager, not in source code or client-side bundles.
- Use HTTPS only.
- Start with `environment: "Test"` and a small sample of 10 to 20 calls.
- Verify records in Call Logs.
- Verify generated events in Risk Events.
- Verify trend movement in Overview and Risk Analytics.
- Confirm ingestion audit records for both success and expected failure cases.
- Avoid sending unnecessary raw sensitive content when upstream masking is available.
- Use separate credentials for production and test applications.

## 12. Rollout Plan

| Stage | Goal | What To Validate |
|---|---|---|
| 1. Sample replay | Replay a small historical log sample | Payload mapping, auth, timestamps, data type mapping |
| 2. Shadow mode | Send live traffic with `environment: "Test"` | Volume, latency, rule hits, false positive review |
| 3. Production observability | Send production traffic for monitoring | Risk trends, top applications, high-severe rate, evidence quality |
| 4. Source enforcement | Let the source app or gateway enforce block/redact decisions | Operational impact, user experience, rollback path |

For the current product positioning, AI RiskOps should remain the system of record for AI risk visibility and evidence. Full case management, audit workflows, and remediation approvals should stay outside the first launch scope unless they become a clear customer requirement.
