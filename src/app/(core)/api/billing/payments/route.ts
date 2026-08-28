import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { listBillingPayments } from "@/lib/billing/payments";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "BILLING_PAYMENTS");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const payments = await listBillingPayments(organizationId);
    return NextResponse.json(payments);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
