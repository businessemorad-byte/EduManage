import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { recordGrade, recordBatchGrades, getStudentGrades, getStudentAcademicSummary } from "@/lib/assessment";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "GRADES_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    if (searchParams.get("summary")! === "true") {
      const studentId = searchParams.get("studentId")!;
      if (!studentId) {
        return NextResponse.json({ error: "studentId required for summary" }, { status: 400 });
      }
      const summary = await getStudentAcademicSummary({ organizationId, studentId });
      return NextResponse.json({ summary });
    }

    const studentId = searchParams.get("studentId")!;
    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const grades = await getStudentGrades({
      organizationId,
      studentId,
      subjectId: searchParams.get("subjectId") ?? undefined,
    });

    return NextResponse.json({ grades });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "GRADES_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.grades && Array.isArray(body.grades)) {
      const validGrades = body.grades
        .filter((g: Record<string, unknown>) => g.studentId && g.assessmentId && g.score !== undefined)
        .map((g: Record<string, unknown>) => ({
          organizationId,
          studentId: g.studentId as string,
          assessmentId: g.assessmentId as string,
          score: Math.min(20, Math.max(0, Number(g.score) || 0)),
          comments: g.comments as string | undefined,
        }));
      const results = await recordBatchGrades(validGrades);
      return NextResponse.json({ grades: results }, { status: 201 });
    }

    if (!body.studentId || !body.assessmentId || body.score === undefined) {
      return NextResponse.json(
        { error: "studentId, assessmentId, score are required" },
        { status: 400 }
      );
    }

    const score = Number(body.score);
    if (isNaN(score) || score < 0 || score > 20) {
      return NextResponse.json({ error: "Score must be a number between 0 and 20" }, { status: 400 });
    }

    const grade = await recordGrade({
      organizationId,
      studentId: body.studentId,
      assessmentId: body.assessmentId,
      score,
      comments: body.comments,
    });

    return NextResponse.json({ grade }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
