import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createCompetency, listCompetencies, updateCompetencyRecord, getStudentCompetencies } from "@/lib/competencies";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "COMPETENCIES_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const searchParams = new URL(request.url).searchParams;

    if (searchParams.get("action")! === "student") {
      const studentId = searchParams.get("studentId")!;
      if (!studentId) return NextResponse.json({ error: "studentId is required" }, { status: 400 });
      const records = await getStudentCompetencies(organizationId, studentId, {
        moduleId: searchParams.get("moduleId") ?? undefined,
        programId: searchParams.get("programId") ?? undefined,
      });
      return NextResponse.json({ records });
    }

    const result = await listCompetencies(organizationId, {
      moduleId: searchParams.get("moduleId") ?? undefined,
      programId: searchParams.get("programId") ?? undefined,
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

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "COMPETENCIES_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "updateRecord") {
      if (!body.competencyId || !body.studentId || !body.status) {
        return NextResponse.json({ error: "competencyId, studentId, and status are required" }, { status: 400 });
      }
      const record = await updateCompetencyRecord({ ...body, organizationId });
      return NextResponse.json({ record });
    }

    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const competency = await createCompetency({ ...body, organizationId });
    return NextResponse.json({ competency }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";
    const status = isKnownAuth ? 401 : 500;
    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");
    return NextResponse.json({ error }, { status });
  }
}
