import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import {
  createCorporateClient,
  listCorporateClients,
  updateCorporateClient,
  createCorporateContract,
  createCorporateLearner,
  listCorporateLearners,
} from "@/lib/corporate";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "CORPORATE_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const searchParams = new URL(request.url).searchParams;

    if (searchParams.get("action")! === "learners") {
      const corporateClientId = searchParams.get("corporateClientId")!;
      if (!corporateClientId) {
        return NextResponse.json({ error: "corporateClientId is required" }, { status: 400 });
      }
      const learners = await listCorporateLearners(organizationId, corporateClientId);
      return NextResponse.json({ learners });
    }

    const result = await listCorporateClients(organizationId, {
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")!) : undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")!) : undefined,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";
    const status = isKnownAuth ? 401 : 500;
    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");
    return NextResponse.json({ error }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "CORPORATE_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "update") {
      const { id, ...data } = body;
      if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
      const client = await updateCorporateClient(id, organizationId, data);
      return NextResponse.json({ client });
    }

    if (body.action === "contract") {
      if (!body.corporateClientId || !body.startDate || !body.agreedPrice) {
        return NextResponse.json({ error: "corporateClientId, startDate, and agreedPrice are required" }, { status: 400 });
      }
      const contract = await createCorporateContract({ ...body, organizationId });
      return NextResponse.json({ contract }, { status: 201 });
    }

    if (body.action === "learner") {
      if (!body.corporateClientId || !body.employeeName) {
        return NextResponse.json({ error: "corporateClientId and employeeName are required" }, { status: 400 });
      }
      const learner = await createCorporateLearner({ ...body, organizationId });
      return NextResponse.json({ learner }, { status: 201 });
    }

    if (!body.companyName || !body.contactName) {
      return NextResponse.json({ error: "companyName and contactName are required" }, { status: 400 });
    }

    const client = await createCorporateClient({ ...body, organizationId });
    return NextResponse.json({ client }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";
    const status = isKnownAuth ? 401 : 500;
    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");
    return NextResponse.json({ error }, { status });
  }
}
