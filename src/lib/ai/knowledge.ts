import { db } from "@/lib/prisma";

// ─── Knowledge Base CRUD ──────────────────────────────────────

export async function createKnowledgeBase(data: {
  organizationId: string;
  name: string;
  description?: string;
}) {
  return db.knowledgeBase.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      description: data.description,
    },
  });
}

export async function listKnowledgeBases(organizationId: string) {
  return db.knowledgeBase.findMany({
    where: { organizationId, isActive: true },
    include: { _count: { select: { documents: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getKnowledgeBase(organizationId: string, id: string) {
  return db.knowledgeBase.findFirst({
    where: { id, organizationId },
    include: { documents: { orderBy: { createdAt: "desc" } } },
  });
}

export async function updateKnowledgeBase(organizationId: string, id: string, data: { name?: string; description?: string; isActive?: boolean }) {
  return db.knowledgeBase.updateMany({
    where: { id, organizationId },
    data,
  });
}

export async function deleteKnowledgeBase(organizationId: string, id: string) {
  return db.knowledgeBase.updateMany({
    where: { id, organizationId },
    data: { isActive: false },
  });
}

// ─── Document CRUD ────────────────────────────────────────────

export async function addDocument(data: {
  organizationId: string;
  knowledgeBaseId: string;
  title: string;
  content: string;
  source?: string;
  tags?: string[];
}) {
  const doc = await db.knowledgeDocument.create({
    data: {
      organizationId: data.organizationId,
      knowledgeBaseId: data.knowledgeBaseId,
      title: data.title,
      content: data.content,
      source: data.source,
      tags: data.tags ?? [],
    },
  });

  await db.knowledgeBase.update({
    where: { id: data.knowledgeBaseId },
    data: { documentCount: { increment: 1 } },
  });

  return doc;
}

export async function listDocuments(organizationId: string, knowledgeBaseId: string) {
  return db.knowledgeDocument.findMany({
    where: { organizationId, knowledgeBaseId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateDocument(organizationId: string, id: string, data: { title?: string; content?: string; tags?: string[] }) {
  return db.knowledgeDocument.updateMany({
    where: { id, organizationId },
    data,
  });
}

export async function deleteDocument(organizationId: string, id: string) {
  return db.knowledgeDocument.updateMany({
    where: { id, organizationId },
    data: { isActive: false },
  });
}

export async function searchKnowledge(organizationId: string, query: string, limit = 10) {
  const documents = await db.knowledgeDocument.findMany({
    where: {
      organizationId,
      isActive: true,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
        { tags: { has: query } },
      ],
    },
    include: { knowledgeBase: { select: { name: true } } },
    take: limit,
  });

  return documents.map((d) => ({
    id: d.id,
    title: d.title,
    content: d.content.substring(0, 500),
    source: d.source,
    knowledgeBase: d.knowledgeBase.name,
    tags: d.tags,
    relevance: calculateRelevance(d.title, d.content, query),
  })).sort((a, b) => b.relevance - a.relevance);
}

function calculateRelevance(title: string, content: string, query: string): number {
  const lowerQuery = query.toLowerCase();
  let score = 0;
  if (title.toLowerCase().includes(lowerQuery)) score += 10;
  const contentMatches = (content.toLowerCase().match(new RegExp(lowerQuery, "g")) || []).length;
  score += Math.min(contentMatches, 5);
  return score;
}
