import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "ROOMS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [academicYears, levels, subjects, programs, groups, enrollments] = await Promise.all([
      db.academicYear.count({ where: { organizationId } }),
      db.level.count({ where: { organizationId } }),
      db.subject.count({ where: { organizationId } }),
      db.program.count({ where: { organizationId } }),
      db.group.count({ where: { organizationId } }),
      db.enrollment.count({ where: { organizationId, status: "ACTIVE" } }),
    ]);

    return NextResponse.json({ academicYears, levels, subjects, programs, groups, enrollments });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
