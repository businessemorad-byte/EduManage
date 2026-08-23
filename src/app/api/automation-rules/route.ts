import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createRule, listRules } from "@/lib/automation";
import { checkPaidAccess } from "@/lib/billing/enforcement";
import { FeatureKey } from "@/lib/constants";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "AUTOMATIONS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rules = await listRules(organizationId);
    return NextResponse.json({ rules });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "AUTOMATIONS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Automation is a paid plan feature — enforced server-side.
    const access = await checkPaidAccess(organizationId, { featureKey: FeatureKey.AUTOMATION });
    if (!access.ok) return NextResponse.json(access.payload, { status: access.status });

    const body = await request.json();

    if (!body.name || !body.trigger || !body.conditions || !body.actions) {
      return NextResponse.json({ error: "name, trigger, conditions, and actions are required" }, { status: 400 });
    }

    const rule = await createRule({
      organizationId,
      name: body.name,
      description: body.description,
      trigger: body.trigger,
      conditions: body.conditions,
      actions: body.actions,
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
