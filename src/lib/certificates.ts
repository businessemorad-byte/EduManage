import { db } from "@/lib/prisma";
import { emitEvent, EVENT_TYPES } from "@/lib/events";
import crypto from "crypto";

export async function issueCertificate(data: {
  organizationId: string;
  studentId: string;
  programId?: string;
  cohortId?: string;
  finalScore?: number;
  issuedBy?: string;
  expirationDate?: Date;
}) {
  const certCount = await db.certificate.count({ where: { organizationId: data.organizationId } });
  const certNumber = `CERT-${String(certCount + 1).padStart(5, "0")}`;

  const certificate = await db.certificate.create({
    data: {
      organizationId: data.organizationId,
      studentId: data.studentId,
      programId: data.programId ?? null,
      cohortId: data.cohortId ?? null,
      certificateNumber: certNumber,
      verificationToken: crypto.randomUUID(),
      finalScore: data.finalScore ?? null,
      issuedBy: data.issuedBy ?? null,
      expirationDate: data.expirationDate ?? null,
      status: "ISSUED",
      issueDate: new Date(),
    },
  });

  await emitEvent({ type: EVENT_TYPES.CERTIFICATE_ISSUED, organizationId: data.organizationId, payload: { id: certificate.id, studentId: data.studentId, certNumber } });
  return certificate;
}

export async function revokeCertificate(id: string, organizationId: string, reason: string) {
  const certificate = await db.certificate.updateMany({
    where: { id, organizationId, status: "ISSUED" },
    data: { status: "REVOKED", revokedReason: reason, revokedAt: new Date() },
  });

  if (certificate.count > 0) {
    await emitEvent({ type: EVENT_TYPES.CERTIFICATE_REVOKED, organizationId, payload: { id } });
  }

  return certificate;
}

export async function verifyCertificate(token: string) {
  const certificate = await db.certificate.findUnique({
    where: { verificationToken: token },
    include: {
      student: { include: { person: true } },
      program: { select: { name: true, code: true } },
      organization: { select: { name: true } },
    },
  });

  if (!certificate) return null;

  return {
    valid: certificate.status === "ISSUED",
    certificateNumber: certificate.certificateNumber,
    learnerName: `${certificate.student.person.firstName} ${certificate.student.person.lastName}`,
    program: certificate.program?.name ?? null,
    organization: certificate.organization.name,
    issueDate: certificate.issueDate,
    expirationDate: certificate.expirationDate,
    status: certificate.status,
  };
}

export async function listCertificates(organizationId: string, params?: {
  studentId?: string;
  programId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.studentId) where.studentId = params.studentId;
  if (params?.programId) where.programId = params.programId;
  if (params?.status) where.status = params.status;

  const [certificates, total] = await Promise.all([
    db.certificate.findMany({
      where,
      include: {
        student: { include: { person: true } },
        program: { select: { name: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.certificate.count({ where }),
  ]);

  return { certificates, total, page, totalPages: Math.ceil(total / limit) };
}
