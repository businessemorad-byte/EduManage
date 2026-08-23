import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createTrainingMaterial, listTrainingMaterials, deleteTrainingMaterial } from "@/lib/training-materials";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "MATERIALS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const searchParams = new URL(request.url).searchParams;

    const result = await listTrainingMaterials(organizationId, {
      moduleId: searchParams.get("moduleId") ?? undefined,
      programId: searchParams.get("programId") ?? undefined,
      cohortId: searchParams.get("cohortId") ?? undefined,
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
    const allowed = await hasPermission(user.id, organizationId, "MATERIALS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "delete") {
      if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
      await deleteTrainingMaterial(body.id, organizationId);
      return NextResponse.json({ success: true });
    }

    if (!body.title || !body.type) {
      return NextResponse.json({ error: "title and type are required" }, { status: 400 });
    }

    const material = await createTrainingMaterial({ ...body, organizationId });
    return NextResponse.json({ material }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
