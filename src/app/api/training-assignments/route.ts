import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createTrainingAssignment, listTrainingAssignments, submitAssignment, gradeAssignment } from "@/lib/training-assignments";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "TRAINING_ASSIGNMENTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const searchParams = new URL(request.url).searchParams;

    const result = await listTrainingAssignments(organizationId, {
      cohortId: searchParams.get("cohortId") ?? undefined,
      moduleId: searchParams.get("moduleId") ?? undefined,
      programId: searchParams.get("programId") ?? undefined,
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
    const allowed = await hasPermission(user.id, organizationId, "TRAINING_ASSIGNMENTS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "submit") {
      if (!body.assignmentId || !body.studentId) {
        return NextResponse.json({ error: "assignmentId and studentId are required" }, { status: 400 });
      }
      const submission = await submitAssignment(body.assignmentId, body.studentId, organizationId);
      return NextResponse.json({ submission }, { status: 201 });
    }

    if (body.action === "grade") {
      if (!body.submissionId || body.score === undefined) {
        return NextResponse.json({ error: "submissionId and score are required" }, { status: 400 });
      }
      const submission = await gradeAssignment(body.submissionId, organizationId, body.score, body.feedback);
      return NextResponse.json({ submission });
    }

    if (!body.title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const assignment = await createTrainingAssignment({ ...body, organizationId });
    return NextResponse.json({ assignment }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
