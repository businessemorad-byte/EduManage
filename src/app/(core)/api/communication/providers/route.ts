import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { listProviders, testProvider, sendCommunication } from "@/lib/communication";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "COMMUNICATION_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const providers = await listProviders(organizationId);
    return NextResponse.json({ providers });
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
    const allowed = await hasPermission(user.id, organizationId, "PROVIDERS_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "test") {
      if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
      const result = await testProvider(body.id, organizationId);
      return NextResponse.json(result);
    }

    if (body.action === "send_test") {
      if (!body.channel || !body.to) {
        return NextResponse.json({ error: "channel and to are required" }, { status: 400 });
      }
      const log = await sendCommunication({
        organizationId,
        recipientType: "TEST",
        recipientId: body.to,
        channel: body.channel,
        subject: body.subject ?? "Test Message",
        body: body.body ?? "This is a test message from EduManage.",
      });
      return NextResponse.json({ log });
    }

    if (!body.name || !body.channel || !body.provider || !body.config) {
      return NextResponse.json({ error: "name, channel, provider, and config are required" }, { status: 400 });
    }

    const provider = await db.communicationProvider.create({
      data: {
        organizationId,
        name: body.name,
        channel: body.channel,
        provider: body.provider,
        config: body.config,
      },
    });

    return NextResponse.json({ provider }, { status: 201 });
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}
