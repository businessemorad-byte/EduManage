import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { getPersonTypeCounts, listPeople } from "@/lib/people";
import { PersonStatus } from "@/lib/constants";
import type { PersonType } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "STUDENTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action")!;

    if (action === "stats") {
      const counts = await getPersonTypeCounts(organizationId);
      return NextResponse.json(counts);
    }

    const result = await listPeople({
      organizationId,
      branchId: searchParams.get("branchId") ?? undefined,
      status: (searchParams.get("status")! as PersonStatus | undefined) ?? undefined,
      search: searchParams.get("search") ?? undefined,
      type: (searchParams.get("type")! as PersonType | undefined) ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")!) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")!) : undefined,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";
    const status = isKnownAuth ? 401 : 500;
    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");
    return NextResponse.json({ error }, { status });
  }
}
