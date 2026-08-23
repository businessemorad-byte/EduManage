import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/org-context";
import { hasPermission } from "@/lib/rbac";
import { createStaff, createTeacher, createTrainer, listStaff } from "@/lib/staff";

export async function GET(request: Request) {
  try {
    const { organizationId, user } = await requireOrgContext();
    const allowed = await hasPermission(user.id, organizationId, "TEACHERS_READ");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { searchParams } = new URL(request.url);

    const result = await listStaff({
      organizationId,
      branchId: searchParams.get("branchId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      department: searchParams.get("department") ?? undefined,
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
    const allowed = await hasPermission(user.id, organizationId, "TEACHERS_CREATE");
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();

    const { firstName, lastName, roleType } = body;
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "firstName and lastName are required" },
        { status: 400 }
      );
    }

    const baseInput = {
      organizationId,
      branchId: body.branchId,
      person: { firstName, lastName, ...body },
      employeeId: body.employeeId,
      hireDate: body.hireDate,
      department: body.department,
      position: body.position,
    };

    let result;
    if (roleType === "teacher") {
      result = await createTeacher({
        ...baseInput,
        subjects: body.subjects,
        qualification: body.qualification,
        yearsExperience: body.yearsExperience,
      });
    } else if (roleType === "trainer") {
      result = await createTrainer({
        ...baseInput,
        specialization: body.specialization,
        certifications: body.certifications,
      });
    } else {
      result = await createStaff(baseInput);
    }

    return NextResponse.json({ staff: result }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Not authenticated" || message === "No organization context" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
