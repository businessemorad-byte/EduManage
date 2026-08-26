import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createAcademicYear, listAcademicYears } from "@/lib/academic";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "ROOMS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const years = await listAcademicYears(organizationId);
    return NextResponse.json({ academicYears: years });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";
    const status = isKnownAuth ? 401 : 500;
    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "ROOMS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (!body.name || !body.startDate) {
      return NextResponse.json({ error: "name and startDate are required" }, { status: 400 });
    }

    const year = await createAcademicYear({ ...body, organizationId });
    return NextResponse.json({ academicYear: year }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";
    const status = isKnownAuth ? 401 : 500;
    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");
    return NextResponse.json({ error }, { status });
  }
}
