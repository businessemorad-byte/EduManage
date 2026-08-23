import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { enrollTrainee, withdrawTrainee, listTrainingEnrollments } from "@/lib/training-enrollment";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "PROGRAMS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const searchParams = new URL(request.url).searchParams;

    const result = await listTrainingEnrollments(organizationId, {
      programId: searchParams.get("programId") ?? undefined,
      cohortId: searchParams.get("cohortId") ?? undefined,
      studentId: searchParams.get("studentId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
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
    const allowed = await hasPermission(user.id, organizationId, "PROGRAMS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "withdraw") {
      if (!body.enrollmentId) {
        return NextResponse.json({ error: "enrollmentId is required" }, { status: 400 });
      }
      const enrollment = await withdrawTrainee(body.enrollmentId, organizationId, body.reason);
      return NextResponse.json({ enrollment });
    }

    if (!body.studentId || !body.programId) {
      return NextResponse.json({ error: "studentId and programId are required" }, { status: 400 });
    }

    const enrollment = await enrollTrainee({
      organizationId,
      studentId: body.studentId,
      programId: body.programId,
      cohortId: body.cohortId,
      feePlanId: body.feePlanId,
      monthlyFee: body.monthlyFee,
    });
    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
