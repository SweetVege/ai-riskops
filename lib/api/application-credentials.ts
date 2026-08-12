import { createHash, randomBytes, randomUUID } from "crypto";
import { isIngestionSource, type IngestionSource } from "@/lib/api/ingestion-contract";

export type CredentialStatus = "active" | "not_created" | "rotation_required" | "revoked";

export function normalizeCredentialStatus(status: string): CredentialStatus {
  if (status === "active" || status === "rotation_required" || status === "revoked") {
    return status;
  }

  return "not_created";
}

export function normalizeCredentialSource(value: string | undefined | null): IngestionSource {
  return value && isIngestionSource(value) ? value : "sdk";
}

export function generateApplicationCredentialSecret(source: IngestionSource) {
  const environmentPrefix = source === "gateway_proxy" || source === "log_api" ? "live" : "test";
  const randomPart = randomBytes(18).toString("base64url");
  const secret = `airk_${environmentPrefix}_${randomPart}`;

  return {
    secret,
    keyPrefix: `${secret.slice(0, 18)}...`,
    keyHash: hashCredentialSecret(secret),
  };
}

export function hashCredentialSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function credentialId() {
  return `cred-${randomUUID().slice(0, 8)}`;
}

export function formatCredential(credential: {
  id: string;
  applicationId: string;
  keyPrefix: string;
  status: string;
  integrationSource: string;
  createdBy: string;
  lastUsedAt: Date | null;
  createdAt: Date;
  rotatedAt: Date | null;
  revokedAt: Date | null;
  application: {
    id: string;
    name: string;
    slug: string;
    ownerTeam: string;
    status: string;
    integrationMethod: string;
  };
}) {
  return {
    id: credential.id,
    applicationId: credential.applicationId,
    applicationName: credential.application.name,
    applicationSlug: credential.application.slug,
    ownerTeam: credential.application.ownerTeam,
    applicationStatus: credential.application.status,
    applicationIntegrationMethod: credential.application.integrationMethod,
    keyPrefix: credential.keyPrefix,
    status: normalizeCredentialStatus(credential.status),
    integrationSource: normalizeCredentialSource(credential.integrationSource),
    createdBy: credential.createdBy,
    lastUsedAt: credential.lastUsedAt?.toISOString() ?? null,
    createdAt: credential.createdAt.toISOString(),
    rotatedAt: credential.rotatedAt?.toISOString() ?? null,
    revokedAt: credential.revokedAt?.toISOString() ?? null,
  };
}
