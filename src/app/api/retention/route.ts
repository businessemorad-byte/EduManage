import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { getRetentionMetrics, getStudentRetentionDetail } from "@/lib/retention";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "REPORTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    if (searchParams.get("studentId")) {
      const detail = await getStudentRetentionDetail(organizationId, searchParams.get("studentId")!);
      return NextResponse.json(detail);
    }

    const metrics = await getRetentionMetrics(organizationId, {
      branchId: searchParams.get("branchId") ?? undefined,
      academicYearId: searchParams.get("academicYearId") ?? undefined,
    });
    return NextResponse.json(metrics);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
