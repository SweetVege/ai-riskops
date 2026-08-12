import { apiOk } from "@/lib/api/response";
import { average } from "@/lib/api/overview";
import { resolveRequestScope, scopedCallLogWhere, scopedRiskEventWhere, scopeResponse } from "@/lib/api/scope";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = await resolveRequestScope(searchParams);

  const [callLogs, riskEvents] = await Promise.all([
    prisma.aiCallLog.findMany({
      where: scopedCallLogWhere(scope),
      select: {
        id: true,
        action: true,
        score: true,
      },
    }),
    prisma.riskEvent.findMany({
      where: scopedRiskEventWhere(scope),
      select: {
        id: true,
        action: true,
        score: true,
        level: true,
      },
    }),
  ]);

  return apiOk({
    scope: scopeResponse(scope),
    data: {
      modelCallsToday: callLogs.length,
      riskEvents: riskEvents.length,
      blocked: riskEvents.filter((event) => event.action === "block").length,
      averageEventRiskScore: average(riskEvents.map((event) => event.score)),
      severeEvents: riskEvents.filter((event) => event.level === "severe").length,
      highRiskEvents: riskEvents.filter((event) => event.level === "high").length,
      blockedModelCalls: callLogs.filter((log) => log.action === "block").length,
    },
  });
}

