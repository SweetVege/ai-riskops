import { apiOk } from "@/lib/api/response";
import { percentage } from "@/lib/api/overview";
import { resolveRequestScope, scopedRiskEventWhere, scopeResponse } from "@/lib/api/scope";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = await resolveRequestScope(searchParams);

  const riskEvents = await prisma.riskEvent.findMany({
    where: scopedRiskEventWhere(scope),
    include: {
      ruleMatches: {
        include: {
          riskRule: true,
        },
      },
    },
  });

  const categoryCounts = new Map<string, number>();

  for (const event of riskEvents) {
    for (const match of event.ruleMatches) {
      const category = match.riskRule.category;
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }
  }

  const totalMatches = Array.from(categoryCounts.values()).reduce((sum, count) => sum + count, 0);

  return apiOk({
    scope: scopeResponse(scope),
    data: Array.from(categoryCounts.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: percentage(count, totalMatches),
      }))
      .sort((a, b) => b.count - a.count),
  });
}

