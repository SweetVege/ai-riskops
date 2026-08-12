import { permissionsForScope } from "@/lib/api/permissions";
import { apiOk } from "@/lib/api/response";
import { resolveRequestScope, scopeResponse } from "@/lib/api/scope";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = await resolveRequestScope(searchParams);

  return apiOk({
    scope: scopeResponse(scope),
    data: {
      profile: scope.profile,
      userId: scope.userId,
      permissions: await permissionsForScope(scope),
    },
  });
}
