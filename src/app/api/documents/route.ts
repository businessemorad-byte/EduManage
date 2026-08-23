import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { uploadDocument, listDocuments, deleteDocument } from "@/lib/documents";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "DOCUMENTS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    const result = await listDocuments(organizationId, {
      studentId: searchParams.get("studentId") ?? undefined,
      category: searchParams.get("category") ?? undefined,
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
    const { user, organizationId } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "DOCUMENTS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "delete" && body.id) {
      await deleteDocument(body.id, organizationId);
      return NextResponse.json({ success: true });
    }

    if (!body.studentId || !body.name || !body.fileUrl) {
      return NextResponse.json({ error: "studentId, name, and fileUrl are required" }, { status: 400 });
    }

    const document = await uploadDocument({ ...body, organizationId, uploadedBy: user.id });
    return NextResponse.json({ document }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
