import { prisma } from "@/lib/prisma";

export type ApiProfile = "global-user" | "app-owner" | "platform-admin";

const profileToUserId: Record<ApiProfile, string> = {
  "global-user": "user-demo-global",
  "app-owner": "user-demo-owner",
  "platform-admin": "user-demo-admin",
};

const profileAliases: Record<string, ApiProfile> = {
  "global-user": "global-user",
  "global user": "global-user",
  "app-owner": "app-owner",
  "app owner": "app-owner",
  "platform-admin": "platform-admin",
  "platform admin": "platform-admin",
};

export type RequestScope = {
  profile: ApiProfile;
  userId: string;
  isGlobal: boolean;
  applicationIds?: string[];
};

export function normalizeProfile(value: string | null): ApiProfile {
  if (!value) {
    return "platform-admin";
  }

  return profileAliases[value.trim().toLowerCase()] ?? "platform-admin";
}

export async function resolveRequestScope(searchParams: URLSearchParams): Promise<RequestScope> {
  const profile = normalizeProfile(searchParams.get("profile"));
  const userId = searchParams.get("userId") ?? profileToUserId[profile];

  if (profile !== "app-owner") {
    return {
      profile,
      userId,
      isGlobal: true,
    };
  }

  const assignments = await prisma.userApplicationAccess.findMany({
    where: { userId },
    select: { applicationId: true },
  });

  return {
    profile,
    userId,
    isGlobal: false,
    applicationIds: assignments.map((assignment) => assignment.applicationId),
  };
}

export function scopedApplicationWhere(scope: RequestScope, applicationId?: string | null) {
  if (scope.isGlobal) {
    return applicationId ? { id: applicationId } : {};
  }

  const applicationIds = scopedApplicationIds(scope, applicationId);

  return {
    id: {
      in: applicationIds,
    },
  };
}

export function scopedRiskEventWhere(scope: RequestScope, applicationId?: string | null) {
  if (scope.isGlobal) {
    return applicationId ? { applicationId } : {};
  }

  const applicationIds = scopedApplicationIds(scope, applicationId);

  return {
    applicationId: {
      in: applicationIds,
    },
  };
}

export function scopedCallLogWhere(scope: RequestScope, applicationId?: string | null) {
  if (scope.isGlobal) {
    return applicationId ? { applicationId } : {};
  }

  const applicationIds = scopedApplicationIds(scope, applicationId);

  return {
    applicationId: {
      in: applicationIds,
    },
  };
}

export function scopeResponse(scope: RequestScope) {
  return {
    profile: scope.profile,
    userId: scope.userId,
    mode: scope.isGlobal ? "global" : "assigned_applications",
    applicationIds: scope.applicationIds,
  };
}

function scopedApplicationIds(scope: RequestScope, applicationId?: string | null) {
  const assignedIds = scope.applicationIds ?? [];

  if (!applicationId) {
    return assignedIds;
  }

  return assignedIds.includes(applicationId) ? [applicationId] : [];
}
