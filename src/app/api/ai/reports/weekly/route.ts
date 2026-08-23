import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { generateReport } from "@/lib/ai/reports";
import { saveInsight } from "@/lib/ai/reports";
import { checkAIProtection } from "@/lib/ai/protection";

export async function GET() {
  try {
    const { user, organizationId } = await requireOrgContext();

    const protection = await checkAIProtection(organizationId, user.id);
    if (!protection.allowed) {
      return NextResponse.json({ error: protection.error, code: protection.code }, { status: 403 });
    }

    const report = await generateReport(organizationId, "weekly");

    await saveInsight({
      organizationId,
      category: "report",
      title: "Weekly Report",
      summary: report.summary,
      severity: "INFO",
      details: report as unknown as Record<string, unknown>,
    });

    return NextResponse.json(report);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
