# AI RiskOps Authentication And Permission Design

This document defines the recommended authentication and permission model for AI RiskOps after the current prototype stage.

It translates the current User Profile simulation into a backend-ready access model without hard-coding company job roles into product permissions.

## 1. Design Goal

AI RiskOps should support enterprise users who need different levels of product access across global risk posture, assigned applications, admin configuration, and ingestion setup.

The permission model should be simple enough for the early product, but flexible enough for future enterprise roles that do not fit the prototype's three User Profiles.

## 2. Product Position

User Profile is a prototype and demo abstraction.

Production access should be based on:

- authenticated user identity
- assigned permission sets
- granted capabilities
- data scope
- assigned application scope when applicable

Job titles or personas should not be the source of authorization logic.

## 3. Recommended V1 Auth Model

### 3.1 Authentication

Recommended V1 approach:

1. Keep the local prototype profile switcher for demos.
2. Add a production-ready session boundary behind the same `/api/session` contract.
3. Map authenticated users to permission sets stored in the AI RiskOps database.
4. Continue using application API keys for model-call ingestion.

Recommended production identity sources:

| Source | V1 Recommendation |
|---|---|
| Enterprise SSO | Design-compatible, not required for first backend prototype |
| Email/password login | Not recommended as the strategic enterprise path |
| IdP group mapping | Future enhancement after permission sets stabilize |
| SCIM provisioning | Future enterprise readiness feature |
| Application API keys | Required for ingestion and app-to-platform authentication |

### 3.2 Session Resolution

Current prototype:

```text
profile query parameter -> demo user -> scope and capabilities
```

Recommended production flow:

```text
session token -> authenticated user -> permission set assignments -> capabilities and scope
```

The frontend should continue to call:

```text
GET /api/session
```

The response should remain the product's capability discovery contract.

## 4. Permission Model

### 4.1 Core Concepts

| Concept | Meaning |
|---|---|
| User | A human user authenticated into AI RiskOps |
| Permission Set | Reusable access package assigned to users |
| Capability | A specific product action or page access right |
| Data Scope | Whether the user sees global data or assigned-application data |
| Application Access | Which applications an assigned-scope user can view |
| Application Credential | Non-human credential used by an AI app or gateway to ingest model calls |

### 4.2 Data Scope

AI RiskOps V1 should support two data scopes:

| Scope | Meaning |
|---|---|
| `global` | User can see data across all applications in the tenant |
| `assigned_applications` | User can only see data for explicitly assigned applications |

This keeps the early model simple while supporting the important App Owner use case.

### 4.3 Default Permission Sets

The current three User Profiles should become default permission sets, not hard-coded roles.

| Permission Set | Data Scope | Purpose |
|---|---|---|
| Global User | `global` | View global risk posture, analytics, events, logs, and applications |
| App Owner | `assigned_applications` | View risk posture, analytics, events, logs, and applications for assigned apps |
| Platform Admin | `global` | Manage platform policies, application setup, credentials, and user access |

Companies may later create additional permission sets such as Business Unit Viewer, Security Analyst, AI Platform Operator, or Executive Viewer.

## 5. Capability Matrix

| Capability | Global User | App Owner | Platform Admin |
|---|---:|---:|---:|
| `canViewOverview` | Yes | Yes | Yes |
| `canViewRiskAnalytics` | Yes | Yes | Yes |
| `canViewRiskEvents` | Yes | Yes | Yes |
| `canViewCallLogs` | Yes | Yes | Yes |
| `canViewApplications` | Yes | Yes | Yes |
| `canExportAnalytics` | Yes | Yes | Yes |
| `canUpdateRiskEventReview` | Yes | No | Yes |
| `canViewPolicyCenter` | No | No | Yes |
| `canManagePolicyCenter` | No | No | Yes |
| `canViewApplicationSetup` | No | No | Yes |
| `canManageApplicationSetup` | No | No | Yes |
| `canCreateApplications` | No | No | Yes |
| `canManageCredentials` | No | No | Yes |
| `canManageUserAccess` | No | No | Yes |

V1 should avoid exposing custom capability editing unless real customer usage requires it.

## 6. Application Scope Rules

### 6.1 App Owner

An App Owner can be assigned to multiple applications.

All product pages should respect the same assigned application scope:

- Overview metrics and charts
- Risk Analytics summaries and drill-downs
- Risk Events list and details
- Call Logs list and details
- Applications inventory and detail views

The backend should enforce the scope in every data API, not only hide UI elements in the frontend.

### 6.2 Global User

Global User can view all application data in the tenant, but cannot access Admin surfaces.

Global User can update lightweight risk-event review metadata in the current prototype because this user represents security, risk, or governance operators who inspect events.

### 6.3 Platform Admin

Platform Admin can view global data and manage platform configuration.

Admin-only areas:

- Policy Center
- Application Setup
- Application credentials
- Ingestion audit
- User Access

## 7. API Authorization Rules

Every backend route should follow the same decision order:

1. Resolve authenticated user or prototype user.
2. Load permission set assignments.
3. Derive capabilities and data scope.
4. Check required capability for the route.
5. Apply data-scope filtering to all database reads and writes.
6. Return `403` for missing capability.
7. Return `404` when the object exists but is outside the user's data scope.

This avoids leaking whether an out-of-scope application, event, or call log exists.

## 8. Ingestion Authentication

Human user authentication and application ingestion authentication should stay separate.

Model-call ingestion should use:

```text
Authorization: Bearer <application_api_key>
```

The credential should identify:

- application
- integration source
- credential status
- last used timestamp
- rotation and revocation state

The ingestion API should not depend on a human user's page permission set.

Prototype `profile`-based ingestion can remain available for demos, but production ingestion should prefer application credentials.

## 9. Recommended Database Direction

Current useful tables:

- `User`
- `PermissionSet`
- `PermissionSetCapability`
- `UserPermissionSetAssignment`
- `UserApplicationAccess`
- `ApplicationCredential`

Recommended future additions:

| Table | Purpose |
|---|---|
| `Tenant` | Multi-tenant boundary for enterprise deployment |
| `UserIdentity` | External IdP subject, email, and provider mapping |
| `AccessAuditLog` | Records permission-set and application-access changes |
| `PermissionSetVersion` | Optional future history for permission model changes |
| `ApplicationCredentialAudit` | Dedicated credential lifecycle audit if ingestion audit becomes too broad |

V1 does not need all of these immediately.

## 10. Frontend Implications

The current User Profile switcher can remain in the demo prototype.

Production UI should eventually replace it with:

- signed-in user display
- data scope label
- assigned application count when scope is not global
- Admin navigation visible only when session capabilities allow it

The frontend should not make authorization decisions by profile label. It should render pages and actions from `/api/session` capabilities.

## 11. Current Implementation Gap

| Area | Current State | Production Direction |
|---|---|---|
| Human auth | Query-parameter profile simulation | Real session identity |
| Permission source | Database permission sets with profile fallback | Database permission sets only |
| App Owner scope | Database-backed assigned applications | Same model with real user identity |
| Admin protection | Capability checks | Same model with authenticated sessions |
| Tenant isolation | Not implemented | Required before enterprise deployment |
| IdP integration | Not implemented | Add after V1 data model is stable |
| Access audit | Limited through current admin surfaces | Add audit log for permission changes |

## 12. Recommended Next Build Step

The next build step should not be full SSO.

Recommended next implementation:

1. Remove route-level reliance on `profile` as the source of truth where practical.
2. Treat `/api/session` as the single frontend permission discovery endpoint.
3. Add access-audit records for User Access updates.
4. Keep profile switching only as a demo mode wrapper around real permission-set assignments.

This gives the product a backend-ready permission foundation without overbuilding enterprise IAM too early.
