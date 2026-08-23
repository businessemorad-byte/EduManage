import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { db } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "AUTOMATIONS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

    const where: Record<string, unknown> = { organizationId };
    if (status) where.status = status;

    const logs = await db.automationExecutionLog.findMany({
      where,
      orderBy: { executedAt: "desc" },
      take: limit,
      include: { rule: { select: { name: true, trigger: true } } },
    });

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        ruleId: l.ruleId,
        ruleName: l.rule.name,
        trigger: l.rule.trigger,
        eventType: l.eventType,
        status: l.status,
        error: l.error,
        conditionsMet: l.conditionsMet,
        actionsExecuted: l.actionsExecuted,
        executedAt: l.executedAt.toISOString(),
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
