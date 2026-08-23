import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createContactRequest, getContactRequests, resolveContactRequest } from "@/lib/communication";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "CONTACT_REQUESTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const searchParams = new URL(request.url).searchParams;

    const result = await getContactRequests(
      organizationId,
      {
        status: searchParams.get("status") ?? undefined,
        category: searchParams.get("category") ?? undefined,
      },
      searchParams.get("page") ? Number(searchParams.get("page")) : 1
    );

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
    const allowed = await hasPermission(user.id, organizationId, "CONTACT_REQUESTS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "resolve") {
      if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
      await resolveContactRequest(body.id, organizationId, body.assignedTo ?? "system");
      return NextResponse.json({ success: true });
    }

    if (!body.senderName || !body.subject || !body.message) {
      return NextResponse.json({ error: "senderName, subject, and message are required" }, { status: 400 });
    }

    const request_ = await createContactRequest({ ...body, organizationId });
    return NextResponse.json({ request: request_ }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
