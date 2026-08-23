import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createDiscount, listDiscounts } from "@/lib/finance";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "FINANCE_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const discounts = await listDiscounts(organizationId);
    return NextResponse.json({ discounts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "FINANCE_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (!body.name || !body.type || body.value === undefined) {
      return NextResponse.json({ error: "name, type, value are required" }, { status: 400 });
    }

    const discount = await createDiscount({
      organizationId,
      name: body.name,
      description: body.description,
      type: body.type,
      value: Number(body.value),
      feePlanId: body.feePlanId,
      maxUses: body.maxUses,
    });

    return NextResponse.json({ discount }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
