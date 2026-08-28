import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { generateReport, saveInsight } from "@/lib/ai/reports";
import { checkAIProtection } from "@/lib/ai/protection";

export async function GET(request: Request) {
  try {
    const { user, organizationId } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "AI_INSIGHTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") ?? "daily") as "daily" | "weekly" | "monthly";

    const protection = await checkAIProtection(organizationId, user.id);
    if (!protection.allowed) {
      return NextResponse.json({ error: protection.error, code: protection.code }, { status: 403 });
    }

    const report = await generateReport(organizationId, type);

    // Save as insight
    await saveInsight({
      organizationId,
      category: "report",
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      summary: report.summary,
      severity: "INFO",
      details: report as unknown as Record<string, unknown>,
    });

    return NextResponse.json(report);
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}
