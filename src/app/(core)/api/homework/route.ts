import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createHomework, listHomework, updateHomework, submitHomework, gradeSubmission, getStudentHomework } from "@/lib/homework";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "HOMEWORK_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    if (searchParams.get("action")! === "student" && searchParams.get("studentId")!) {
      const result = await getStudentHomework(organizationId, searchParams.get("studentId")!, {
        page: searchParams.get("page") ? Number(searchParams.get("page")!) : undefined,
        limit: searchParams.get("limit") ? Number(searchParams.get("limit")!) : undefined,
      });
      return NextResponse.json(result);
    }

    const result = await listHomework(organizationId, {
      subjectId: searchParams.get("subjectId") ?? undefined,
      groupId: searchParams.get("groupId") ?? undefined,
      isPublished: searchParams.has("isPublished") ? searchParams.get("isPublished")! === "true" : undefined,
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

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "HOMEWORK_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "submit") {
      if (!body.homeworkId || !body.studentId) {
        return NextResponse.json({ error: "homeworkId and studentId are required" }, { status: 400 });
      }
      const submission = await submitHomework({ organizationId, homeworkId: body.homeworkId, studentId: body.studentId, attachments: body.attachments });
      return NextResponse.json({ submission });
    }

    if (body.action === "grade") {
      if (!body.submissionId || body.score === undefined) {
        return NextResponse.json({ error: "submissionId and score are required" }, { status: 400 });
      }
      const submission = await gradeSubmission(body.submissionId, body.score, body.feedback);
      return NextResponse.json({ submission });
    }

    if (!body.title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const homework = await createHomework({ ...body, organizationId });
    return NextResponse.json({ homework }, { status: 201 });
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "HOMEWORK_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const homework = await updateHomework(body.id, organizationId, body);
    return NextResponse.json({ homework });
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}
