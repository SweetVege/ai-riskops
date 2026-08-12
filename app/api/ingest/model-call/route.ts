import { randomUUID } from "crypto";
import {
  hashCredentialSecret,
  normalizeCredentialSource,
  normalizeCredentialStatus,
} from "@/lib/api/application-credentials";
import { updateApplicationIngestionValidation } from "@/lib/api/application-setup";
import { dataProtectionMeta, protectCapturedFields, protectCapturedText } from "@/lib/api/data-protection";
import {
  dataTypes,
  ingestionContract,
  ingestionContractVersion,
  isIngestionDataType,
  isIngestionSource,
  type IngestionDataType,
  type IngestionSource,
  type ProductionModelCallIngestionBody,
} from "@/lib/api/ingestion-contract";
import { apiCreated, apiError, apiOk } from "@/lib/api/response";
import { resolveRequestScope, scopedApplicationWhere, scopeResponse } from "@/lib/api/scope";
import { prisma } from "@/lib/prisma";
import { evaluateAiCall, type SandboxInput } from "@/lib/risk-engine";

export const dynamic = "force-dynamic";

type ModelCallIngestionBody = {
  contractVersion?: string;
  ingestionSource?: IngestionSource;
  application?: ProductionModelCallIngestionBody["application"];
  request?: ProductionModelCallIngestionBody["request"];
  user?: ProductionModelCallIngestionBody["user"];
  content?: ProductionModelCallIngestionBody["content"];
  context?: ProductionModelCallIngestionBody["context"];
  agent?: ProductionModelCallIngestionBody["agent"];
  applicationId?: string;
  applicationName?: string;
  app?: string;
  userRef?: string;
  userRole?: string;
  model?: ProductionModelCallIngestionBody["model"];
  environment?: "Production" | "Test" | "production" | "test";
  dataType?: SandboxInput["dataType"];
  prompt?: string;
  output?: string;
  ragContext?: string;
  toolCall?: string;
  templateId?: string;
};

type NormalizedIngestion = {
  contractVersion: string;
  ingestionSource: IngestionSource;
  applicationId: string;
  applicationName: string;
  traceId: string;
  sessionId: string;
  occurredAt: Date;
  userRef: string;
  userRole: string;
  userDepartment: string;
  modelName: string;
  environment: "Production" | "Test";
  dataType: IngestionDataType;
  prompt: string;
  output: string;
  ragContext: string;
  toolCall: string;
  templateId: string;
};

type CredentialAuthResult = {
  credential: {
    id: string;
    applicationId: string;
    status: string;
    integrationSource: string;
  };
} | {
  error: {
    status: number;
    code: "UNAUTHORIZED" | "FORBIDDEN";
    message: string;
    details: Record<string, unknown>;
  };
} | null;

type ResolvedCredential = Extract<CredentialAuthResult, { credential: unknown }>["credential"];

type IngestionAuditInput = {
  request: Request;
  body: ModelCallIngestionBody | null;
  requestProfile: string;
  startedAt: number;
  status: "success" | "failed";
  httpStatus: number;
  authMode: "application_credential" | "profile_scope";
  credential?: ResolvedCredential | null;
  applicationId?: string | null;
  callLogId?: string | null;
  riskEventId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  dataProtectionMode?: string | null;
};

const defaultOutputByAction = {
  block: "The request was blocked and no model output was returned.",
  allow: "No model output sample.",
  flag: "No model output sample.",
  redact: "No model output sample.",
  review: "No model output sample.",
};

const maxTextFieldLength = 8000;

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function headerValue(request: Request, name: string) {
  return request.headers.get(name)?.trim() ?? "";
}

function bearerToken(request: Request) {
  const authorization = headerValue(request, "authorization");
  const [scheme, token] = authorization.split(/\s+/, 2);

  return scheme?.toLowerCase() === "bearer" && token ? token.trim() : "";
}

async function readJsonBody(request: Request) {
  try {
    return (await request.json()) as ModelCallIngestionBody;
  } catch {
    return null;
  }
}

function validateIngestionBody(body: ModelCallIngestionBody | null, hasCredentialAuth: boolean) {
  if (!body) {
    return {
      code: "INVALID_JSON" as const,
      message: "Request body must be valid JSON.",
      details: { body: "invalid_json" },
    };
  }

  const applicationIdentifier =
    stringValue(body.applicationId) ||
    stringValue(body.application?.id) ||
    stringValue(body.applicationName) ||
    stringValue(body.application?.name) ||
    stringValue(body.application?.slug) ||
    stringValue(body.app);
  const prompt = stringValue(body.content?.prompt) || stringValue(body.prompt);
  const output = stringValue(body.content?.output) || stringValue(body.output);
  const ragContext = stringValue(body.context?.ragContext) || stringValue(body.ragContext);
  const toolCall = stringValue(body.agent?.toolCall) || stringValue(body.agent?.toolName) || stringValue(body.toolCall);
  const environment = body.environment ? String(body.environment).toLowerCase() : "";
  const ingestionSource = body.ingestionSource ? String(body.ingestionSource) : "";
  const dataType = stringValue(body.context?.dataType) || stringValue(body.dataType);
  const oversizedFields = [
    ["prompt", prompt],
    ["output", output],
    ["ragContext", ragContext],
    ["toolCall", toolCall],
  ].filter(([, value]) => value.length > maxTextFieldLength).map(([field]) => field);

  if (!applicationIdentifier && !hasCredentialAuth) {
    return {
      code: "VALIDATION_ERROR" as const,
      message: "Application identifier is required.",
      details: { required: ["Authorization: Bearer <application_api_key>", "applicationId or applicationName"] },
    };
  }

  if (!prompt && !output && !ragContext && !toolCall) {
    return {
      code: "VALIDATION_ERROR" as const,
      message: "At least one captured AI call field is required.",
      details: { requiredAnyOf: ["prompt", "output", "ragContext", "toolCall"] },
    };
  }

  if (environment && environment !== "production" && environment !== "test") {
    return {
      code: "VALIDATION_ERROR" as const,
      message: "Environment must be Production or Test.",
      details: { environment: body.environment },
    };
  }

  if (ingestionSource && !isIngestionSource(ingestionSource)) {
    return {
      code: "VALIDATION_ERROR" as const,
      message: "Ingestion source is not supported.",
      details: { supportedSources: ingestionContract.integrationMethods.map((method) => method.source) },
    };
  }

  if (dataType && !isIngestionDataType(dataType)) {
    return {
      code: "VALIDATION_ERROR" as const,
      message: "Data type is not supported.",
      details: { supportedDataTypes: [...dataTypes] },
    };
  }

  if (oversizedFields.length) {
    return {
      code: "VALIDATION_ERROR" as const,
      message: "One or more captured fields exceed the maximum length.",
      details: { maxLength: maxTextFieldLength, fields: oversizedFields },
    };
  }

  return null;
}

async function resolveCredentialAuth(request: Request): Promise<CredentialAuthResult> {
  const token = bearerToken(request);

  if (!token) {
    return null;
  }

  const credential = await prisma.applicationCredential.findUnique({
    where: { keyHash: hashCredentialSecret(token) },
    select: {
      id: true,
      applicationId: true,
      status: true,
      integrationSource: true,
    },
  });

  if (!credential) {
    return {
      error: {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Application API key is invalid.",
        details: { authMode: "application_credential" },
      },
    };
  }

  const credentialStatus = normalizeCredentialStatus(credential.status);

  if (credentialStatus === "revoked" || credentialStatus === "not_created") {
    return {
      error: {
        status: 401,
        code: "UNAUTHORIZED",
        message: "Application API key is not active.",
        details: {
          authMode: "application_credential",
          credentialId: credential.id,
          status: credentialStatus,
        },
      },
    };
  }

  return { credential };
}

async function writeIngestionAudit(input: IngestionAuditInput) {
  const body = input.body;
  const model = typeof body?.model === "string" ? body.model : body?.model?.name;
  const traceId = stringValue(body?.request?.traceId) || headerValue(input.request, "x-ai-riskops-trace-id");
  const sessionId = stringValue(body?.request?.sessionId);
  const bodySource = stringValue(body?.ingestionSource);
  const headerSource = headerValue(input.request, "x-ai-riskops-source");
  const ingestionSource = input.credential
    ? normalizeCredentialSource(input.credential.integrationSource)
    : isIngestionSource(bodySource)
      ? bodySource
      : isIngestionSource(headerSource)
        ? headerSource
        : "sdk";

  try {
    await prisma.ingestionRequestAudit.create({
      data: {
        id: `audit-${randomUUID().slice(0, 8)}`,
        status: input.status,
        authMode: input.authMode,
        ingestionSource,
        applicationId: input.applicationId ?? input.credential?.applicationId ?? null,
        credentialId: input.credential?.id ?? null,
        traceId: traceId || null,
        sessionId: sessionId || null,
        requestProfile: input.requestProfile,
        httpStatus: input.httpStatus,
        errorCode: input.errorCode ?? null,
        errorMessage: input.errorMessage ?? null,
        latencyMs: Math.max(0, Date.now() - input.startedAt),
        callLogId: input.callLogId ?? null,
        riskEventId: input.riskEventId ?? null,
        model: stringValue(model) || null,
        environment: body?.environment ? String(body.environment).toLowerCase() : null,
        dataProtectionMode: input.dataProtectionMode ?? null,
      },
    });
  } catch (error) {
    console.error("Unable to write ingestion audit", error);
  }
}

function payloadApplicationIdentifier(body: ModelCallIngestionBody) {
  return {
    id: stringValue(body.applicationId) || stringValue(body.application?.id),
    name: stringValue(body.applicationName) || stringValue(body.application?.name) || stringValue(body.application?.slug) || stringValue(body.app),
  };
}

function normalizeIngestionBody(request: Request, body: ModelCallIngestionBody): NormalizedIngestion {
  const headerSource = headerValue(request, "x-ai-riskops-source");
  const bodySource = stringValue(body.ingestionSource);
  const ingestionSource = isIngestionSource(bodySource)
    ? bodySource
    : isIngestionSource(headerSource)
      ? headerSource
      : "sdk";
  const environment = normalizeEnvironment(body.environment);
  const dataType = stringValue(body.context?.dataType) || stringValue(body.dataType);
  const model = typeof body.model === "string" ? body.model : body.model?.name;
  const occurredAtValue = stringValue(body.request?.occurredAt);
  const occurredAt = occurredAtValue ? new Date(occurredAtValue) : new Date();

  return {
    contractVersion: stringValue(body.contractVersion) || headerValue(request, "x-ai-riskops-contract-version") || ingestionContractVersion,
    ingestionSource,
    applicationId: stringValue(body.applicationId) || stringValue(body.application?.id) || headerValue(request, "x-ai-riskops-application-id"),
    applicationName: stringValue(body.applicationName) || stringValue(body.application?.name) || stringValue(body.application?.slug) || stringValue(body.app),
    traceId: stringValue(body.request?.traceId) || headerValue(request, "x-ai-riskops-trace-id") || `trace-${randomUUID().slice(0, 6)}`,
    sessionId: stringValue(body.request?.sessionId),
    occurredAt: Number.isNaN(occurredAt.getTime()) ? new Date() : occurredAt,
    userRef: stringValue(body.user?.id) || stringValue(body.userRef) || stringValue(body.userRole) || "Unknown User",
    userRole: stringValue(body.user?.role) || stringValue(body.userRole) || stringValue(body.userRef) || "Unknown User",
    userDepartment: stringValue(body.user?.department),
    modelName: stringValue(model) || "gpt-4.1",
    environment,
    dataType: isIngestionDataType(dataType) ? dataType : "General Data",
    prompt: stringValue(body.content?.prompt) || stringValue(body.prompt),
    output: stringValue(body.content?.output) || stringValue(body.output),
    ragContext: stringValue(body.context?.ragContext) || stringValue(body.ragContext),
    toolCall: stringValue(body.agent?.toolCall) || stringValue(body.agent?.toolName) || stringValue(body.toolCall),
    templateId: stringValue(body.templateId) || "api-ingestion",
  };
}

function normalizeEnvironment(value: ModelCallIngestionBody["environment"]): "Production" | "Test" {
  return String(value ?? "Production").toLowerCase() === "test" ? "Test" : "Production";
}

function normalizeEnvironmentForDb(value: "Production" | "Test") {
  return value.toLowerCase();
}

function buildEventTitle(appName: string, evaluation: ReturnType<typeof evaluateAiCall>) {
  const firstFinding = evaluation.findings[0];
  return firstFinding
    ? `${appName} matched ${firstFinding.ruleName}`
    : `${appName} generated a risk event`;
}

function buildRiskExplanation(evaluation: ReturnType<typeof evaluateAiCall>) {
  if (!evaluation.findings.length) {
    return "The call was retained as an audit log and did not generate a risk event.";
  }

  const ruleSummary = evaluation.findings
    .map((finding) => `${finding.ruleId} (${finding.location})`)
    .join(", ");

  return `This event was generated because the model call matched ${ruleSummary}. The combined score, environment, data type, and tool context produced a ${evaluation.level} risk classification.`;
}

export async function GET() {
  return apiOk({
    data: ingestionContract,
  });
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const { searchParams } = new URL(request.url);
  const scope = await resolveRequestScope(searchParams);
  const body = await readJsonBody(request);
  const credentialAuth = await resolveCredentialAuth(request);

  if (credentialAuth && "error" in credentialAuth) {
    await writeIngestionAudit({
      request,
      body,
      requestProfile: scope.profile,
      startedAt,
      status: "failed",
      httpStatus: credentialAuth.error.status,
      authMode: "application_credential",
      errorCode: credentialAuth.error.code,
      errorMessage: credentialAuth.error.message,
    });

    return apiError(
      credentialAuth.error.status,
      credentialAuth.error.code,
      credentialAuth.error.message,
      credentialAuth.error.details,
    );
  }

  const authenticatedCredential = credentialAuth && "credential" in credentialAuth
    ? credentialAuth.credential
    : null;
  const validationError = validateIngestionBody(body, Boolean(authenticatedCredential));

  if (validationError) {
    await writeIngestionAudit({
      request,
      body,
      requestProfile: scope.profile,
      startedAt,
      status: "failed",
      httpStatus: 400,
      authMode: authenticatedCredential ? "application_credential" : "profile_scope",
      credential: authenticatedCredential,
      errorCode: validationError.code,
      errorMessage: validationError.message,
    });

    return apiError(400, validationError.code, validationError.message, validationError.details);
  }

  const validBody = body as ModelCallIngestionBody;
  const normalized = normalizeIngestionBody(request, validBody);
  const appName = normalized.applicationName;
  const payloadApplication = payloadApplicationIdentifier(validBody);

  if (authenticatedCredential && payloadApplication.id && payloadApplication.id !== authenticatedCredential.applicationId) {
    await writeIngestionAudit({
      request,
      body,
      requestProfile: scope.profile,
      startedAt,
      status: "failed",
      httpStatus: 403,
      authMode: "application_credential",
      credential: authenticatedCredential,
      applicationId: authenticatedCredential.applicationId,
      errorCode: "FORBIDDEN",
      errorMessage: "Payload application does not match the authenticated application credential.",
    });

    return apiError(403, "FORBIDDEN", "Payload application does not match the authenticated application credential.", {
      credentialApplicationId: authenticatedCredential.applicationId,
      payloadApplicationId: payloadApplication.id,
    });
  }

  const appSelector = authenticatedCredential
    ? { id: authenticatedCredential.applicationId }
    : normalized.applicationId
    ? { id: normalized.applicationId }
    : {
        OR: [
          { name: appName },
          { slug: appName },
        ],
      };

  const application = await prisma.application.findFirst({
    where: authenticatedCredential
      ? appSelector
      : {
          AND: [scopedApplicationWhere(scope), appSelector],
        },
  });

  if (!application) {
    await writeIngestionAudit({
      request,
      body,
      requestProfile: scope.profile,
      startedAt,
      status: "failed",
      httpStatus: 404,
      authMode: authenticatedCredential ? "application_credential" : "profile_scope",
      credential: authenticatedCredential,
      applicationId: normalized.applicationId || null,
      errorCode: "NOT_FOUND",
      errorMessage: "Application not found or outside current scope.",
    });

    return apiError(404, "NOT_FOUND", "Application not found or outside current scope.", {
      applicationId: normalized.applicationId,
      applicationName: appName,
    });
  }

  if (authenticatedCredential) {
    await prisma.applicationCredential.update({
      where: { id: authenticatedCredential.id },
      data: { lastUsedAt: new Date() },
    });
  }

  const sandboxInput: SandboxInput = {
    templateId: normalized.templateId,
    app: application.name,
    userRole: normalized.userRole,
    environment: normalized.environment,
    dataType: normalized.dataType,
    prompt: normalized.prompt,
    output: normalized.output,
    ragContext: normalized.ragContext,
    toolCall: normalized.toolCall,
  };
  const evaluation = evaluateAiCall(sandboxInput);
  const occurredAt = normalized.occurredAt;
  const callLogId = `call-${randomUUID().slice(0, 8)}`;
  const riskEventId = evaluation.action === "allow" ? null : `evt-${randomUUID().slice(0, 8)}`;
  const output = sandboxInput.output || defaultOutputByAction[evaluation.action];
  const protectedFields = protectCapturedFields({
    prompt: sandboxInput.prompt,
    output,
    ragContext: sandboxInput.ragContext,
    toolCall: sandboxInput.toolCall || null,
  });

  const callLog = await prisma.aiCallLog.create({
    data: {
      id: callLogId,
      traceId: normalized.traceId,
      applicationId: application.id,
      occurredAt,
      userRef: normalized.userRef,
      model: normalized.modelName,
      environment: normalizeEnvironmentForDb(normalized.environment),
      score: evaluation.score,
      level: evaluation.level,
      action: evaluation.action,
      prompt: protectedFields.prompt,
      output: protectedFields.output,
      ragContext: protectedFields.ragContext,
      toolCall: protectedFields.toolCall,
    },
  });

  let riskEvent = null;

  if (riskEventId) {
    riskEvent = await prisma.riskEvent.create({
      data: {
        id: riskEventId,
        applicationId: application.id,
        sourceCallLogId: callLog.id,
        occurredAt,
        title: buildEventTitle(application.name, evaluation),
        userRef: normalized.userRef,
        department: normalized.userDepartment || sandboxInput.dataType,
        model: normalized.modelName,
        environment: normalizeEnvironmentForDb(normalized.environment),
        score: evaluation.score,
        level: evaluation.level,
        action: evaluation.action,
        reviewStatus: evaluation.reviewRequired ? "pending_review" : "resolved",
        owner: evaluation.reviewRequired ? "Unassigned" : "AI RiskOps",
        sla: evaluation.level === "severe" ? "2 hours" : "8 hours",
        riskExplanation: buildRiskExplanation(evaluation),
        affectedAsset: sandboxInput.dataType,
        recommendation: evaluation.recommendation,
        updatedAt: occurredAt,
        ruleMatches: {
          create: evaluation.findings.map((finding) => ({
            id: `${riskEventId}-${finding.ruleId}`,
            riskRuleId: finding.ruleId,
          })),
        },
        evidence: {
          create: evaluation.findings.map((finding, index) => ({
            id: `${riskEventId}-evidence-${index + 1}`,
            riskRuleId: finding.ruleId,
            signal: `${finding.ruleName} in ${finding.location}`,
            evidence: protectCapturedText(finding.evidence).value,
            impact: `This signal contributed ${finding.score} base points and influenced the ${evaluation.level} classification.`,
          })),
        },
      },
    });
  }

  await writeIngestionAudit({
    request,
    body,
    requestProfile: scope.profile,
    startedAt,
    status: "success",
    httpStatus: 201,
    authMode: authenticatedCredential ? "application_credential" : "profile_scope",
    credential: authenticatedCredential,
    applicationId: application.id,
    callLogId: callLog.id,
    riskEventId,
    dataProtectionMode: protectedFields.mode,
  });

  await updateApplicationIngestionValidation({
    applicationId: application.id,
    hasCredential: Boolean(authenticatedCredential),
    prompt: normalized.prompt,
    output,
    ragContext: normalized.ragContext,
    toolCall: normalized.toolCall,
  });

  return apiCreated(
    {
      scope: scopeResponse(scope),
      data: {
        ingestion: {
          contractVersion: normalized.contractVersion,
          ingestionSource: authenticatedCredential
            ? normalizeCredentialSource(authenticatedCredential.integrationSource)
            : normalized.ingestionSource,
          authMode: authenticatedCredential ? "application_credential" : "profile_scope",
          credentialId: authenticatedCredential?.id ?? null,
          credentialStatus: authenticatedCredential
            ? normalizeCredentialStatus(authenticatedCredential.status)
            : null,
          traceId: normalized.traceId,
          sessionId: normalized.sessionId || null,
          applicationId: application.id,
          dataProtection: dataProtectionMeta(protectedFields.findings),
        },
        callLog,
        riskEvent,
        evaluation,
      },
    },
  );
}
