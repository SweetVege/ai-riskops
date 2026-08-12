import type { ApiProfile, RequestScope } from "@/lib/api/scope";
import { prisma } from "@/lib/prisma";

export type ApiPermissions = {
  dataScope: "global" | "assigned_applications";
  canViewOverview: boolean;
  canViewRiskAnalytics: boolean;
  canViewRiskEvents: boolean;
  canViewCallLogs: boolean;
  canViewApplications: boolean;
  canViewPolicyCenter: boolean;
  canManagePolicyCenter: boolean;
  canViewApplicationSetup: boolean;
  canManageApplicationSetup: boolean;
  canCreateApplications: boolean;
  canManageCredentials: boolean;
  canManageUserAccess: boolean;
  canUpdateRiskEventReview: boolean;
  canExportAnalytics: boolean;
};

export function permissionsForProfile(profile: ApiProfile): ApiPermissions {
  const isAdmin = profile === "platform-admin";
  const isGlobalUser = profile === "global-user";

  return {
    dataScope: profile === "app-owner" ? "assigned_applications" : "global",
    canViewOverview: true,
    canViewRiskAnalytics: true,
    canViewRiskEvents: true,
    canViewCallLogs: true,
    canViewApplications: true,
    canViewPolicyCenter: isAdmin,
    canManagePolicyCenter: isAdmin,
    canViewApplicationSetup: isAdmin,
    canManageApplicationSetup: isAdmin,
    canCreateApplications: isAdmin,
    canManageCredentials: isAdmin,
    canManageUserAccess: isAdmin,
    canUpdateRiskEventReview: isAdmin || isGlobalUser,
    canExportAnalytics: true,
  };
}

export async function permissionsForScope(scope: RequestScope): Promise<ApiPermissions> {
  const assignments = await prisma.userPermissionSetAssignment.findMany({
    where: { userId: scope.userId },
    include: {
      permissionSet: {
        include: {
          capabilities: true,
        },
      },
    },
  });

  if (!assignments.length) {
    return permissionsForProfile(scope.profile);
  }

  const capabilities = new Set(assignments.flatMap((assignment) =>
    assignment.permissionSet.capabilities.map((capability) => capability.capability),
  ));
  const dataScope = assignments.some((assignment) => assignment.permissionSet.dataScope === "assigned_applications")
    ? "assigned_applications"
    : "global";

  return {
    dataScope,
    canViewOverview: capabilities.has("canViewOverview"),
    canViewRiskAnalytics: capabilities.has("canViewRiskAnalytics"),
    canViewRiskEvents: capabilities.has("canViewRiskEvents"),
    canViewCallLogs: capabilities.has("canViewCallLogs"),
    canViewApplications: capabilities.has("canViewApplications"),
    canViewPolicyCenter: capabilities.has("canViewPolicyCenter"),
    canManagePolicyCenter: capabilities.has("canManagePolicyCenter"),
    canViewApplicationSetup: capabilities.has("canViewApplicationSetup"),
    canManageApplicationSetup: capabilities.has("canManageApplicationSetup"),
    canCreateApplications: capabilities.has("canCreateApplications"),
    canManageCredentials: capabilities.has("canManageCredentials"),
    canManageUserAccess: capabilities.has("canManageUserAccess"),
    canUpdateRiskEventReview: capabilities.has("canUpdateRiskEventReview"),
    canExportAnalytics: capabilities.has("canExportAnalytics"),
  };
}

export type ApiCapability = {
  [Key in keyof ApiPermissions]: ApiPermissions[Key] extends boolean ? Key : never;
}[keyof ApiPermissions];

export async function hasCapability(scope: RequestScope, capability: ApiCapability) {
  return (await permissionsForScope(scope))[capability];
}

export function capabilityErrorMessage(capability: ApiCapability) {
  const labels: Record<ApiCapability, string> = {
    canViewOverview: "view Overview",
    canViewRiskAnalytics: "view Risk Analytics",
    canViewRiskEvents: "view Risk Events",
    canViewCallLogs: "view Call Logs",
    canViewApplications: "view Applications",
    canViewPolicyCenter: "view Policy Center",
    canManagePolicyCenter: "manage Policy Center",
    canViewApplicationSetup: "view Application Setup",
    canManageApplicationSetup: "manage Application Setup",
    canCreateApplications: "create applications",
    canManageCredentials: "manage application credentials",
    canManageUserAccess: "manage user access",
    canUpdateRiskEventReview: "update risk event review metadata",
    canExportAnalytics: "export analytics reports",
  };

  return `This profile cannot ${labels[capability]}.`;
}
