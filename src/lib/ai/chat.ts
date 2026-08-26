import { db } from "@/lib/prisma";
import { executeAIRequest } from "@/lib/ai-flow";
import type { AIMessage } from "@/lib/ai-gateway";
import {
  aggregateStudentData,
  aggregateFinancialData,
  aggregateAttendanceData,
  aggregateAcademicData,
} from "@/lib/ai/context-engine";

// ─── Chat Orchestration ───────────────────────────────────────

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export async function sendChatMessage(organizationId: string, userId: string, conversationId: string, message: string) {
  // Verify conversation belongs to the authenticated user
  const conversation = await db.aIConversation.findUnique({ where: { id: conversationId } });
  if (!conversation || conversation.organizationId !== organizationId || conversation.userId !== userId) {
    return { error: "Conversation not found", code: "NOT_FOUND" };
  }

  // Save user message
  await db.aIConversationMessage.create({
    data: {
      organizationId,
      conversationId,
      role: "user",
      content: message,
    },
  });

  // Get conversation history — scoped to conversation (ownership already verified above)
  const history = await db.aIConversationMessage.findMany({
    where: { conversationId, organizationId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  // Build context
  const systemPrompt = await buildSystemPrompt(organizationId);

  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role as "system" | "user" | "assistant", content: m.content })),
  ];

  // Execute AI request
  const result = await executeAIRequest({
    organizationId,
    userId,
    messages,
    feature: "chat",
  });

  if (!result.success || !result.response) {
    return { error: result.error, code: result.code };
  }

  // Save assistant message
  await db.aIConversationMessage.create({
    data: {
      organizationId,
      conversationId,
      role: "assistant",
      content: result.response.content,
      tokensUsed: result.response.inputTokens + result.response.outputTokens,
      creditsConsumed: result.response.creditsConsumed,
      model: result.response.model,
    },
  });

  // Update message count
  await db.aIConversation.update({
    where: { id: conversationId },
    data: { messageCount: { increment: 1 } },
  });

  return {
    content: result.response.content,
    model: result.response.model,
    creditsConsumed: result.response.creditsConsumed,
    usageId: result.response.usageId,
  };
}

async function buildSystemPrompt(organizationId: string): Promise<string> {
  const [students, financial, attendance, academic] = await Promise.all([
    aggregateStudentData(organizationId),
    aggregateFinancialData(organizationId),
    aggregateAttendanceData(organizationId),
    aggregateAcademicData(organizationId),
  ]);

  return `You are an AI assistant for an educational institution. You have access to the following aggregated data:

## Student Overview
- Total students: ${students.totalStudents} (${students.activeStudents} active)
- New this month: ${students.newThisMonth}
- Paused: ${students.pausedStudents}, Dropped: ${students.droppedStudents}
- Average attendance rate: ${students.avgAttendanceRate}%

## Financial Overview
- Total revenue: ${financial.totalRevenue.toLocaleString()}
- Pending: ${financial.totalPending.toLocaleString()}
- Overdue: ${financial.totalOverdue.toLocaleString()}
- Collection rate: ${financial.collectionRate}%

## Attendance Overview
- Overall rate: ${attendance.overallRate}%
- Today's rate: ${attendance.todayRate}%

## Academic Overview
- Overall average grade: ${academic.overallAvgGrade}%

Use this data to answer questions. Be concise and helpful. When suggesting actions, be specific.`;
}

// ─── Conversation Management ──────────────────────────────────

export async function createConversation(organizationId: string, userId: string, data?: { title?: string; feature?: string }) {
  return db.aIConversation.create({
    data: {
      organizationId,
      userId,
      title: data?.title ?? "New Chat",
      feature: data?.feature ?? "chat",
      vertical: "PRIVATE_SCHOOL",
    },
  });
}

export async function listConversations(organizationId: string, userId: string) {
  return db.aIConversation.findMany({
    where: { organizationId, userId, status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}

export async function getConversation(organizationId: string, userId: string, id: string) {
  return db.aIConversation.findFirst({
    where: { id, organizationId, userId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function archiveConversation(organizationId: string, userId: string, id: string) {
  return db.aIConversation.updateMany({
    where: { id, organizationId, userId },
    data: { status: "ARCHIVED" },
  });
}
