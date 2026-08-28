import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { getLearnerProgress, checkProgramCompletion } from "@/lib/training-progress";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "PROGRESS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const searchParams = new URL(request.url).searchParams;

    if (searchParams.get("action")! === "completion") {
      const studentId = searchParams.get("studentId")!;
      const programId = searchParams.get("programId")!;
      if (!studentId || !programId) {
        return NextResponse.json({ error: "studentId and programId are required" }, { status: 400 });
      }
      const result = await checkProgramCompletion(organizationId, studentId, programId);
      return NextResponse.json(result);
    }

    const studentId = searchParams.get("studentId")!;
    if (!studentId) return NextResponse.json({ error: "studentId is required" }, { status: 400 });

    const progress = await getLearnerProgress(organizationId, studentId);
    return NextResponse.json(progress);
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}
