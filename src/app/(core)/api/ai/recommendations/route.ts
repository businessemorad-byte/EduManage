import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { generateAllRecommendations, saveRecommendations, listRecommendations, updateRecommendationStatus } from "@/lib/ai/recommendations";
import { checkAIProtection } from "@/lib/ai/protection";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "AI_RECOMMENDATIONS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;

    const recommendations = await listRecommendations(organizationId, status);
    return NextResponse.json(recommendations);
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
    const { user, organizationId } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "AI_RECOMMENDATIONS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (body.action === "generate") {
      const protection = await checkAIProtection(organizationId, user.id);
      if (!protection.allowed) {
        return NextResponse.json({ error: protection.error, code: protection.code }, { status: 403 });
      }

      const recs = await generateAllRecommendations(organizationId);
      await saveRecommendations(organizationId, recs);
      return NextResponse.json({ count: recs.length, recommendations: recs });
    }

    if (body.action === "update" && body.id && body.status) {
      await updateRecommendationStatus(organizationId, body.id, body.status);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {

    const message = err instanceof Error ? err.message : "";

    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";

    const status = isKnownAuth ? 401 : 500;

    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");

    return NextResponse.json({ error }, { status });
  }
}
