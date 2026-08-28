import { NextResponse } from "next/server";
import { requireOrgId } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { checkCertificateEligibility } from "@/lib/training-enrollment";
import { issueCertificate } from "@/lib/certificates";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgId();
    const allowed = await hasPermission(user.id, organizationId, "CERTIFICATES_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const searchParams = new URL(request.url).searchParams;

    const studentId = searchParams.get("studentId")!;
    const programId = searchParams.get("programId")!;
    if (!studentId || !programId) {
      return NextResponse.json({ error: "studentId and programId are required" }, { status: 400 });
    }

    const eligibility = await checkCertificateEligibility(organizationId, studentId, programId);
    return NextResponse.json(eligibility);
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
    const allowed = await hasPermission(user.id, organizationId, "CERTIFICATES_MANAGE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    if (!body.studentId || !body.programId) {
      return NextResponse.json({ error: "studentId and programId are required" }, { status: 400 });
    }

    const eligibility = await checkCertificateEligibility(organizationId, body.studentId, body.programId);
    if (!eligibility.eligible) {
      return NextResponse.json({
        error: "Certificate eligibility requirements not met",
        eligibility,
      }, { status: 400 });
    }

    const certificate = await issueCertificate({
      organizationId,
      studentId: body.studentId,
      programId: body.programId,
      cohortId: body.cohortId,
      issuedBy: user.id,
    });
    return NextResponse.json({ certificate }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const isKnownAuth = message === "Not authenticated" || message === "No organization context" || message === "Organization not selected";
    const status = isKnownAuth ? 401 : 500;
    const error = isKnownAuth ? message : (process.env.NODE_ENV === "production" ? "Internal server error" : message || "Internal server error");
    return NextResponse.json({ error }, { status });
  }
}
