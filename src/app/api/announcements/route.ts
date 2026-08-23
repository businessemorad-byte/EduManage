import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createAnnouncement, listAnnouncements, publishAnnouncement, archiveAnnouncement, deleteAnnouncement } from "@/lib/announcements";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "ANNOUNCEMENTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    const result = await listAnnouncements(organizationId, {
      status: searchParams.get("status") ?? undefined,
      audience: searchParams.get("audience") ?? undefined,
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
    const allowed = await hasPermission(user.id, organizationId, "ANNOUNCEMENTS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "publish" && body.id) {
      const updated = await publishAnnouncement(body.id, organizationId);
      return NextResponse.json({ announcement: updated });
    }

    if (body.action === "archive" && body.id) {
      const updated = await archiveAnnouncement(body.id, organizationId);
      return NextResponse.json({ announcement: updated });
    }

    if (body.action === "delete" && body.id) {
      await deleteAnnouncement(body.id, organizationId);
      return NextResponse.json({ success: true });
    }

    if (!body.title || !body.content) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

    const announcement = await createAnnouncement({ ...body, organizationId });
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
