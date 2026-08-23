import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { getUserPreferences, updateUserPreference } from "@/lib/communication";

export async function GET() {
  try {
    const { organizationId, user } = await requireOrgContext();
    const preferences = await getUserPreferences(user.id, organizationId);
    return NextResponse.json({ preferences });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const body = await request.json();

    if (!body.category || !body.channel || body.enabled === undefined) {
      return NextResponse.json({ error: "category, channel, and enabled are required" }, { status: 400 });
    }

    const preference = await updateUserPreference(
      user.id,
      organizationId,
      body.category,
      body.channel,
      body.enabled
    );

    return NextResponse.json({ preference });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
