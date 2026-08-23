import { db } from "@/lib/prisma";
import { emitEvent, EVENT_TYPES } from "@/lib/events";

export async function createProposal(data: {
  organizationId: string;
  corporateClientId?: string;
  leadId?: string;
  title: string;
  programs?: unknown;
  learnerCount?: number;
  estimatedDuration?: string;
  proposedPrice: number;
  validUntil?: Date;
  notes?: string;
}) {
  return db.proposal.create({
    data: {
      organizationId: data.organizationId,
      corporateClientId: data.corporateClientId ?? null,
      leadId: data.leadId ?? null,
      title: data.title,
      programs: (data.programs as never) ?? undefined,
      learnerCount: data.learnerCount ?? null,
      estimatedDuration: data.estimatedDuration ?? null,
      proposedPrice: data.proposedPrice,
      validUntil: data.validUntil ?? null,
      notes: data.notes ?? null,
      status: "DRAFT",
    },
  });
}

export async function listProposals(organizationId: string, params?: { corporateClientId?: string; status?: string; page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = Math.min(params?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId };
  if (params?.corporateClientId) where.corporateClientId = params.corporateClientId;
  if (params?.status) where.status = params.status;

  const [proposals, total] = await Promise.all([
    db.proposal.findMany({
      where,
      include: { corporateClient: { select: { companyName: true } } },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.proposal.count({ where }),
  ]);

  return { proposals, total, page, totalPages: Math.ceil(total / limit) };
}

export async function updateProposalStatus(id: string, organizationId: string, status: string) {
  const proposal = await db.proposal.updateMany({ where: { id, organizationId }, data: { status: status as never } });

  if (status === "SENT") {
    await emitEvent({ type: EVENT_TYPES.PROPOSAL_SENT, organizationId, payload: { id } });
  } else if (status === "ACCEPTED") {
    await emitEvent({ type: EVENT_TYPES.PROPOSAL_ACCEPTED, organizationId, payload: { id } });
  }

  return proposal;
}
