import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { getDeliveryLogs, getDeliveryStats } from "@/lib/communication";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "DELIVERY_LOGS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const searchParams = new URL(request.url).searchParams;

    if (searchParams.get("action")! === "stats") {
      const stats = await getDeliveryStats(organizationId);
      return NextResponse.json(stats);
    }

    const result = await getDeliveryLogs(
      organizationId,
      {
        channel: searchParams.get("channel") ?? undefined,
        status: searchParams.get("status") ?? undefined,
        campaignId: searchParams.get("campaignId") ?? undefined,
        recipientType: searchParams.get("recipientType") ?? undefined,
      },
      searchParams.get("page") ? Number(searchParams.get("page")!) : 1
    );

    return NextResponse.json(result);
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}
