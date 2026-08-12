import {
  analyticsDrilldown,
  analyticsDrilldownFromSearchParams,
  analyticsFilterResponse,
  analyticsFiltersFromSearchParams,
  loadAnalyticsDataset,
} from "@/lib/api/analytics";
import { apiOk } from "@/lib/api/response";
import { resolveRequestScope, scopeResponse } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = await resolveRequestScope(searchParams);
  const filters = analyticsFiltersFromSearchParams(searchParams);
  const drilldown = analyticsDrilldownFromSearchParams(searchParams);
  const { riskEvents } = await loadAnalyticsDataset(scope, filters);

  return apiOk({
    scope: scopeResponse(scope),
    filters: analyticsFilterResponse(filters),
    data: analyticsDrilldown(riskEvents, drilldown),
  });
}
