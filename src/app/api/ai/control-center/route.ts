import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { detectAllAnomalies } from "@/lib/ai/anomaly";
import { generateAllRecommendations } from "@/lib/ai/recommendations";
import { getInsightStats, listInsights } from "@/lib/ai/reports";
import { getUsageStats } from "@/lib/ai-gateway";
import { getBalance } from "@/lib/ai-credits";
import {
  aggregateStudentData,
  aggregateFinancialData,
  aggregateAttendanceData,
  aggregateAcademicData,
} from "@/lib/ai/context-engine";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "AI_INSIGHTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [
      anomalies,
      recommendations,
      insightStats,
      recentInsights,
      usageStats,
      creditBalance,
      students,
      financial,
      attendance,
      academic,
    ] = await Promise.all([
      detectAllAnomalies(organizationId),
      generateAllRecommendations(organizationId),
      getInsightStats(organizationId),
      listInsights(organizationId),
      getUsageStats(organizationId, 30),
      getBalance(organizationId),
      aggregateStudentData(organizationId),
      aggregateFinancialData(organizationId),
      aggregateAttendanceData(organizationId),
      aggregateAcademicData(organizationId),
    ]);

    return NextResponse.json({
      anomalies: anomalies.slice(0, 10),
      recommendations: recommendations.slice(0, 10),
      insights: { stats: insightStats, recent: recentInsights.slice(0, 10) },
      usage: usageStats,
      credits: {
        monthly: creditBalance.monthlyAllowance,
        used: creditBalance.usedThisMonth,
        extra: creditBalance.extraCredits,
      },
      overview: {
        students,
        financial,
        attendance,
        academic,
      },
    });
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}
