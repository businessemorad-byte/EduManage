import { db } from "@/lib/prisma";
import { emitEvent, EVENT_TYPES } from "@/lib/events";

export async function createAdmission(data: {
  organizationId: string;
  branchId?: string;
  academicYearId?: string;
  applicantName: string;
  applicantEmail?: string;
  applicantPhone?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  previousSchool?: string;
  desiredLevelId?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  relationship?: string;
  notes?: string;
}) {
  const admission = await db.admission.create({
    data: {
      organizationId: data.organizationId,
      branchId: data.branchId ?? null,
      academicYearId: data.academicYearId ?? null,
      applicantName: data.applicantName,
      applicantEmail: data.applicantEmail ?? null,
      applicantPhone: data.applicantPhone ?? null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      gender: data.gender as "MALE" | "FEMALE" | "OTHER" | null | undefined,
      nationality: data.nationality ?? null,
      previousSchool: data.previousSchool ?? null,
      desiredLevelId: data.desiredLevelId ?? null,
      guardianName: data.guardianName ?? null,
      guardianPhone: data.guardianPhone ?? null,
      guardianEmail: data.guardianEmail ?? null,
      relationship: data.relationship as "FATHER" | "MOTHER" | "GUARDIAN" | "OTHER" | null | undefined,
      notes: data.notes ?? null,
    },
    include: { organization: { select: { name: true } } },
  });

  await emitEvent({
    type: EVENT_TYPES.ADMISSION_CREATED,
    organizationId: data.organizationId,
    payload: { id: admission.id, name: data.applicantName },
  });

  return admission;
}

export async function listAdmissions(organizationId: string, params?: { status?: string; academicYearId?: string; search?: string; page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.status) where.status = params.status;
  if (params?.academicYearId) where.academicYearId = params.academicYearId;
  if (params?.search) {
    where.OR = [
      { applicantName: { contains: params.search, mode: "insensitive" } },
      { applicantEmail: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [admissions, total] = await Promise.all([
    db.admission.findMany({
      where,
      include: {
        academicYear: { select: { name: true } },
        desiredLevel: { select: { name: true } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.admission.count({ where }),
  ]);

  return { admissions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function updateAdmissionStatus(id: string, organizationId: string, status: string, reviewedBy?: string) {
  const admission = await db.admission.findFirst({ where: { id, organizationId } });
  if (!admission) throw new Error("Admission not found");

  const updated = await db.admission.update({
    where: { id },
    data: {
      status: status as "PENDING" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED" | "WAITLISTED" | "WITHDRAWN",
      reviewedAt: new Date(),
      reviewedBy: reviewedBy ?? null,
    },
  });

  if (status === "ACCEPTED") {
    await emitEvent({
      type: EVENT_TYPES.ADMISSION_ACCEPTED,
      organizationId,
      payload: { id: updated.id, name: updated.applicantName },
    });
  } else if (status === "REJECTED") {
    await emitEvent({
      type: EVENT_TYPES.ADMISSION_REJECTED,
      organizationId,
      payload: { id: updated.id, name: updated.applicantName },
    });
  }

  return updated;
}

export async function getAdmission(id: string, organizationId: string) {
  return db.admission.findFirst({
    where: { id, organizationId },
    include: {
      academicYear: { select: { id: true, name: true } },
      desiredLevel: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
      student: { include: { person: { select: { firstName: true, lastName: true } } } },
    },
  });
}
