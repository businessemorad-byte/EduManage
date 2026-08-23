import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createEnrollment, listEnrollments } from "@/lib/academic";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "STUDENTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const result = await listEnrollments(organizationId, {
      studentId: searchParams.get("studentId") ?? undefined,
      groupId: searchParams.get("groupId") ?? undefined,
      academicYearId: searchParams.get("academicYearId") ?? undefined,
      programId: searchParams.get("programId") ?? undefined,
      status: searchParams.get("status") as "ACTIVE" | "COMPLETED" | "WITHDRAWN" | "TRANSFERRED" | "REPEATING" | undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "STUDENTS_CREATE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (!body.studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const enrollment = await createEnrollment({ ...body, organizationId });
    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
