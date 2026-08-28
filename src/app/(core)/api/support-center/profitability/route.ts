import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { getGroupProfitability, getRoomUtilization } from "@/lib/support-center";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "REPORTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    if (searchParams.get("action")! === "rooms") {
      const utilization = await getRoomUtilization(organizationId, {
        branchId: searchParams.get("branchId") ?? undefined,
        roomId: searchParams.get("roomId") ?? undefined,
      });
      return NextResponse.json({ rooms: utilization });
    }

    if (searchParams.get("groupId")!) {
      const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);
      const year = Number(searchParams.get("year") ?? new Date().getFullYear());
      const profitability = await getGroupProfitability(organizationId, searchParams.get("groupId")!, month, year);
      return NextResponse.json(profitability);
    }

    return NextResponse.json({ error: "groupId is required" }, { status: 400 });
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}
