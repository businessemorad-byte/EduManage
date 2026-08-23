import { db } from "@/lib/prisma";
import { emitEvent, EVENT_TYPES } from "@/lib/events";

export async function createCorporateClient(data: {
  organizationId: string;
  companyName: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  industry?: string;
  taxIdentifier?: string;
  notes?: string;
  status?: string;
}) {
  const client = await db.corporateClient.create({
    data: {
      organizationId: data.organizationId,
      companyName: data.companyName,
      contactName: data.contactName,
      contactEmail: data.contactEmail ?? null,
      contactPhone: data.contactPhone ?? null,
      address: data.address ?? null,
      industry: data.industry ?? null,
      taxIdentifier: data.taxIdentifier ?? null,
      notes: data.notes ?? null,
      status: (data.status as never) ?? "PROSPECT",
    },
  });

  await emitEvent({ type: EVENT_TYPES.CORPORATE_CLIENT_CREATED, organizationId: data.organizationId, payload: { id: client.id, companyName: client.companyName } });
  return client;
}

export async function listCorporateClients(organizationId: string, params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.status) where.status = params.status;
  if (params?.search) {
    where.OR = [
      { companyName: { contains: params.search, mode: "insensitive" } },
      { contactName: { contains: params.search, mode: "insensitive" } },
      { industry: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [clients, total] = await Promise.all([
    db.corporateClient.findMany({
      where,
      include: { contracts: true, learners: true, invoices: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.corporateClient.count({ where }),
  ]);

  return { clients, total, page, totalPages: Math.ceil(total / limit) };
}

export async function updateCorporateClient(id: string, organizationId: string, data: Record<string, unknown>) {
  return db.corporateClient.updateMany({ where: { id, organizationId }, data });
}

export async function createCorporateContract(data: {
  organizationId: string;
  corporateClientId: string;
  programId?: string;
  cohortId?: string;
  startDate: Date;
  endDate?: Date;
  agreedPrice: number;
  learnerCapacity?: number;
  billingModel?: string;
  paymentTerms?: string;
  notes?: string;
}) {
  const contract = await db.corporateContract.create({
    data: {
      organizationId: data.organizationId,
      corporateClientId: data.corporateClientId,
      programId: data.programId ?? null,
      cohortId: data.cohortId ?? null,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      agreedPrice: data.agreedPrice,
      learnerCapacity: data.learnerCapacity ?? null,
      billingModel: (data.billingModel as never) ?? "PER_LEARNER",
      paymentTerms: data.paymentTerms ?? null,
      notes: data.notes ?? null,
      status: "DRAFT",
    },
  });

  await emitEvent({ type: EVENT_TYPES.CORPORATE_CONTRACT_CREATED, organizationId: data.organizationId, payload: { id: contract.id, corporateClientId: data.corporateClientId } });
  return contract;
}

export async function createCorporateLearner(data: {
  organizationId: string;
  corporateClientId: string;
  employeeName: string;
  employeeCode?: string;
  department?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  studentId?: string;
}) {
  return db.corporateLearner.create({
    data: {
      organizationId: data.organizationId,
      corporateClientId: data.corporateClientId,
      employeeName: data.employeeName,
      employeeCode: data.employeeCode ?? null,
      department: data.department ?? null,
      jobTitle: data.jobTitle ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      studentId: data.studentId ?? null,
    },
  });
}

export async function listCorporateLearners(organizationId: string, corporateClientId: string) {
  return db.corporateLearner.findMany({
    where: { organizationId, corporateClientId },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });
}
