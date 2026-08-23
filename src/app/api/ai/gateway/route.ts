import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { executeAIRequest } from "@/lib/ai-flow";

export async function POST(request: Request) {
  try {
    const { user, organizationId } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "AI_USE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (!body.messages?.length) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    const result = await executeAIRequest({
      organizationId,
      userId: user.id,
      modelId: body.modelId,
      messages: body.messages,
      feature: body.feature ?? "chat",
      maxTokens: body.maxTokens,
      temperature: body.temperature,
    });

    if (!result.success) {
      const status = result.code === "AI_DISABLED" ? 403
        : result.code === "CREDITS_EXHAUSTED" ? 429
        : 500;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    return NextResponse.json({ response: result.response });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
