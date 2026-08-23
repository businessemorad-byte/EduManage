import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createProposal, listProposals, updateProposalStatus } from "@/lib/proposals";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "PROPOSALS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const searchParams = new URL(request.url).searchParams;

    const result = await listProposals(organizationId, {
      corporateClientId: searchParams.get("corporateClientId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "PROPOSALS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "updateStatus") {
      if (!body.id || !body.status) {
        return NextResponse.json({ error: "id and status are required" }, { status: 400 });
      }
      const proposal = await updateProposalStatus(body.id, organizationId, body.status);
      return NextResponse.json({ proposal });
    }

    if (!body.title || !body.proposedPrice) {
      return NextResponse.json({ error: "title and proposedPrice are required" }, { status: 400 });
    }

    const proposal = await createProposal({ ...body, organizationId });
    return NextResponse.json({ proposal }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
