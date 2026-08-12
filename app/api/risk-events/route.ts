import { apiOk } from "@/lib/api/response";
import { resolveRequestScope, scopedRiskEventWhere, scopeResponse } from "@/lib/api/scope";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = await resolveRequestScope(searchParams);
  const level = searchParams.get("level");
  const action = searchParams.get("action");
  const reviewStatus = searchParams.get("review_status");
  const applicationId = searchParams.get("application_id");
  const environment = searchParams.get("environment");
  const q = searchParams.get("q")?.trim();

  const riskEvents = await prisma.riskEvent.findMany({
    where: {
      ...scopedRiskEventWhere(scope, applicationId),
      ...(level ? { level } : {}),
      ...(action ? { action } : {}),
      ...(reviewStatus ? { reviewStatus } : {}),
      ...(environment ? { environment } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { userRef: { contains: q } },
              { department: { contains: q } },
              { riskExplanation: { contains: q } },
              { recommendation: { contains: q } },
              { application: { name: { contains: q } } },
              {
                ruleMatches: {
                  some: {
                    riskRule: {
                      OR: [
                        { id: { contains: q } },
                        { name: { contains: q } },
                        { category: { contains: q } },
                      ],
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { occurredAt: "desc" },
    include: {
      application: true,
      ruleMatches: {
        include: {
          riskRule: true,
        },
      },
      evidence: true,
      sourceCallLog: true,
    },
  });

  return apiOk({
    scope: scopeResponse(scope),
    filters: {
      applicationId,
      level,
      action,
      reviewStatus,
      environment,
      q,
    },
    data: riskEvents.map((event) => ({
      id: event.id,
      occurredAt: event.occurredAt.toISOString(),
      application: {
        id: event.application.id,
        name: event.application.name,
        slug: event.application.slug,
      },
      title: event.title,
      userRef: event.userRef,
      department: event.department,
      model: event.model,
      environment: event.environment,
      score: event.score,
      level: event.level,
      action: event.action,
      reviewStatus: event.reviewStatus,
      owner: event.owner,
      sla: event.sla,
      affectedAsset: event.affectedAsset,
      matchedRules: event.ruleMatches.map((match) => eventRule(match.riskRule)),
      evidenceCount: event.evidence.length,
      linkedCallLogId: event.sourceCallLog.id,
      updatedAt: event.updatedAt.toISOString(),
    })),
  });
}

function eventRule(rule: {
  id: string;
  name: string;
  category: string;
  trigger: string;
  baseScore: number;
  defaultAction: string;
  iconName: string;
}) {
  return {
    id: rule.id,
    name: rule.name,
    category: rule.category,
    trigger: rule.trigger,
    baseScore: rule.baseScore,
    defaultAction: rule.defaultAction,
    iconName: rule.iconName,
  };
}
