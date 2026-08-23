import { db } from "@/lib/prisma";

export async function uploadDocument(data: {
  organizationId: string;
  studentId: string;
  name: string;
  category: string;
  description?: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy?: string;
}) {
  return db.schoolDocument.create({
    data: {
      organizationId: data.organizationId,
      studentId: data.studentId,
      name: data.name,
      category: data.category,
      description: data.description ?? null,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize ?? null,
      mimeType: data.mimeType ?? null,
      uploadedBy: data.uploadedBy ?? null,
    },
  });
}

export async function listDocuments(organizationId: string, params?: { studentId?: string; category?: string; page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.studentId) where.studentId = params.studentId;
  if (params?.category) where.category = params.category;

  const [documents, total] = await Promise.all([
    db.schoolDocument.findMany({
      where,
      include: {
        student: { include: { person: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.schoolDocument.count({ where }),
  ]);

  return { documents, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function deleteDocument(id: string, organizationId: string) {
  return db.schoolDocument.delete({ where: { id, organizationId } });
}

export async function getDocument(id: string, organizationId: string) {
  return db.schoolDocument.findFirst({
    where: { id, organizationId },
    include: {
      student: { include: { person: { select: { firstName: true, lastName: true } } } },
    },
  });
}
