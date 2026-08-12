import { normalizeCredentialSource, normalizeCredentialStatus } from "@/lib/api/application-credentials";

export function formatApplicationSetup(application: {
  id: string;
  name: string;
  slug: string;
  ownerTeam: string;
  status: string;
  integrationMethod: string;
  fieldCoverage: number;
  policyTemplate: {
    id: string;
    name: string;
  } | null;
  environments: Array<{
    id: string;
    name: string;
    status: string;
    callsToday: number;
    lastSeenAt: Date | null;
  }>;
  validationChecks: Array<{
    id: string;
    checkKey: string;
    label: string;
    status: string;
    updatedAt: Date;
  }>;
  credentials: Array<{
    id: string;
    keyPrefix: string;
    status: string;
    integrationSource: string;
    lastUsedAt: Date | null;
    createdAt: Date;
    rotatedAt: Date | null;
    revokedAt: Date | null;
  }>;
}) {
  const latestCredential = application.credentials[0] ?? null;

  return {
    id: application.id,
    name: application.name,
    slug: application.slug,
    ownerTeam: application.ownerTeam,
    status: application.status,
    integrationMethod: application.integrationMethod,
    fieldCoverage: application.fieldCoverage,
    policyTemplate: application.policyTemplate,
    environments: application.environments.map((environment) => ({
      id: environment.id,
      name: environment.name,
      status: environment.status,
      callsToday: environment.callsToday,
      lastSeenAt: environment.lastSeenAt?.toISOString() ?? null,
    })),
    validationChecks: application.validationChecks.map((check) => ({
      id: check.id,
      checkKey: check.checkKey,
      label: check.label,
      status: check.status,
      updatedAt: check.updatedAt.toISOString(),
    })),
    credential: latestCredential
      ? {
          id: latestCredential.id,
          keyPrefix: latestCredential.keyPrefix,
          status: normalizeCredentialStatus(latestCredential.status),
          integrationSource: normalizeCredentialSource(latestCredential.integrationSource),
          lastUsedAt: latestCredential.lastUsedAt?.toISOString() ?? null,
          createdAt: latestCredential.createdAt.toISOString(),
          rotatedAt: latestCredential.rotatedAt?.toISOString() ?? null,
          revokedAt: latestCredential.revokedAt?.toISOString() ?? null,
        }
      : {
          id: null,
          keyPrefix: null,
          status: "not_created" as const,
          integrationSource: normalizeCredentialSource(application.integrationMethod),
          lastUsedAt: null,
          createdAt: null,
          rotatedAt: null,
          revokedAt: null,
        },
  };
}
