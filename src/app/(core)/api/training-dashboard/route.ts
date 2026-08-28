import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { getTrainingDashboard, getProgramProfitability, getCohortProfitability } from "@/lib/training-dashboard";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "PROGRAMS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const searchParams = new URL(request.url).searchParams;

    if (searchParams.get("action")! === "programProfitability") {
      const programId = searchParams.get("programId")!;
      const month = searchParams.get("month") ? Number(searchParams.get("month")!) : new Date().getMonth() + 1;
      const year = searchParams.get("year") ? Number(searchParams.get("year")!) : new Date().getFullYear();
      if (!programId) return NextResponse.json({ error: "programId is required" }, { status: 400 });
      const result = await getProgramProfitability(organizationId, programId, month, year);
      return NextResponse.json(result);
    }

    if (searchParams.get("action")! === "cohortProfitability") {
      const cohortId = searchParams.get("cohortId")!;
      if (!cohortId) return NextResponse.json({ error: "cohortId is required" }, { status: 400 });
      const result = await getCohortProfitability(organizationId, cohortId);
      return NextResponse.json(result);
    }

    const dashboard = await getTrainingDashboard(organizationId);
    return NextResponse.json(dashboard);
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}
