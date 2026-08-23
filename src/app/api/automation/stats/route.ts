import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "AUTOMATIONS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalRules, activeRules, totalExecutions, todayExecutions, recentLogs] = await Promise.all([
      db.automationRule.count({ where: { organizationId } }),
      db.automationRule.count({ where: { organizationId, enabled: true } }),
      db.automationExecutionLog.count({ where: { organizationId } }),
      db.automationExecutionLog.count({ where: { organizationId, executedAt: { gte: startOfDay } } }),
      db.automationExecutionLog.findMany({
        where: { organizationId },
        orderBy: { executedAt: "desc" },
        take: 10,
        include: { rule: { select: { name: true, trigger: true } } },
      }),
    ]);

    return NextResponse.json({
      totalRules,
      activeRules,
      pausedRules: totalRules - activeRules,
      totalExecutions,
      todayExecutions,
      recentLogs: recentLogs.map((l) => ({
        id: l.id,
        ruleName: l.rule.name,
        trigger: l.rule.trigger,
        status: l.status,
        error: l.error,
        executedAt: l.executedAt.toISOString(),
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
