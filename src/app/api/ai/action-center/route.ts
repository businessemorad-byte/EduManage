import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { detectAllAnomalies } from "@/lib/ai/anomaly";
import { generateAllRecommendations } from "@/lib/ai/recommendations";
import {
  aggregateStudentData,
  aggregateFinancialData,
  aggregateAttendanceData,
  aggregateAcademicData,
} from "@/lib/ai/context-engine";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "AI_RECOMMENDATIONS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [anomalies, recommendations, students, financial, attendance, academic] = await Promise.all([
      detectAllAnomalies(organizationId),
      generateAllRecommendations(organizationId),
      aggregateStudentData(organizationId),
      aggregateFinancialData(organizationId),
      aggregateAttendanceData(organizationId),
      aggregateAcademicData(organizationId),
    ]);

    return NextResponse.json({
      anomalies,
      recommendations,
      overview: {
        students,
        financial,
        attendance,
        academic,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
