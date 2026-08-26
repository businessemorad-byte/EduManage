import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { getBalance, getRemainingCredits, getCreditHistory, grantCredits } from "@/lib/ai-credits";
import { getUsageStats, listModels, listProviders } from "@/lib/ai-gateway";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "AI_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const [balance, remaining, models, providers, stats] = await Promise.all([
      getBalance(organizationId),
      getRemainingCredits(organizationId),
      listModels(organizationId),
      listProviders(organizationId),
      getUsageStats(organizationId),
    ]);

    return NextResponse.json({
      balance: {
        monthlyAllowance: balance.monthlyAllowance,
        usedThisMonth: balance.usedThisMonth,
        extraCredits: balance.extraCredits,
        remaining,
        softLimitPct: balance.softLimitPct,
        hardLimitPct: balance.hardLimitPct,
        periodStart: balance.periodStart,
        periodEnd: balance.periodEnd,
      },
      models,
      providers: providers.map((p) => ({ id: p.id, name: p.name, displayName: p.displayName, isActive: p.isActive })),
      stats,
    });
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
    const { organizationId, user, isPlatformOwner } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "AI_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "grant" && typeof body.amount === "number") {
      // Free credits can only be minted by the platform owner
      // (support/goodwill). Organizations must purchase credit packs.
      if (!isPlatformOwner) {
        return NextResponse.json(
          { error: "Seul le propriétaire de la plateforme peut accorder des crédits gratuits. Utilisez l'achat de crédits." },
          { status: 403 }
        );
      }
      if (body.amount <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }
      const tx = await grantCredits(organizationId, body.amount, body.description);
      return NextResponse.json({ transaction: tx });
    }

    if (body.action === "history") {
      const history = await getCreditHistory(organizationId, body.limit);
      return NextResponse.json({ history });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";
    const status = isKnownAuth ? 401 : 500;
    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");
    return NextResponse.json({ error }, { status });
  }
}
