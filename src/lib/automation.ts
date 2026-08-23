import { db } from "@/lib/prisma";
import { onEvent, audit, type DomainEvent } from "@/lib/events";
import { createNotification } from "@/lib/notifications";
import { sendCommunication, type CommunicationChannel } from "@/lib/communication";

// ─── Types ─────────────────────────────────────────────────────

export type ConditionOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "in";

export type Condition = {
  field: string;
  operator: ConditionOperator;
  value: unknown;
};

export type ActionType = "notification" | "audit" | "set_field" | "email" | "sms" | "whatsapp" | "in_app";

export type Action = {
  type: ActionType;
  config: Record<string, unknown>;
};

// ─── Condition Evaluation ──────────────────────────────────────

export function evaluateCondition(field: unknown, operator: ConditionOperator, value: unknown): boolean {
  switch (operator) {
    case "eq": return field === value;
    case "neq": return field !== value;
    case "gt": return Number(field) > Number(value);
    case "gte": return Number(field) >= Number(value);
    case "lt": return Number(field) < Number(value);
    case "lte": return Number(field) <= Number(value);
    case "contains": return String(field).includes(String(value));
    case "in": return Array.isArray(value) && value.includes(field);
    default: return false;
  }
}

export function evaluateConditions(conditions: Condition[], payload: Record<string, unknown>): boolean {
  return conditions.every((c) => {
    const fieldValue = resolveField(c.field, payload);
    return evaluateCondition(fieldValue, c.operator, c.value);
  });
}

function resolveField(field: string, payload: Record<string, unknown>): unknown {
  return field.split(".").reduce<unknown>((obj, key) => {
    if (obj && typeof obj === "object") return (obj as Record<string, unknown>)[key];
    return undefined;
  }, payload);
}

// ─── Action Execution ──────────────────────────────────────────

export async function executeActions(
  actions: Action[],
  event: DomainEvent,
  ruleId: string
): Promise<{ type: string; success: boolean; error?: string }[]> {
  const results: { type: string; success: boolean; error?: string }[] = [];

  for (const action of actions) {
    try {
      switch (action.type) {
        case "notification": {
          const cfg = action.config as { userId?: string; title: string; body: string };
          const targetUserId = cfg.userId ?? event.userId;
          if (targetUserId) {
            await createNotification({
              organizationId: event.organizationId,
              userId: targetUserId,
              title: cfg.title,
              body: cfg.body,
              type: "WARNING",
              category: "automation",
              referenceType: event.type,
              referenceId: event.payload?.id as string | undefined,
              metadata: { ruleId, eventType: event.type },
            });
          }
          results.push({ type: "notification", success: true });
          break;
        }
        case "audit": {
          const cfg = action.config as { action: string; resource: string };
          await audit({
            organizationId: event.organizationId,
            userId: event.userId,
            action: cfg.action,
            resource: cfg.resource,
            metadata: { ruleId, eventType: event.type, payload: event.payload },
          });
          results.push({ type: "audit", success: true });
          break;
        }
        case "set_field": {
          results.push({ type: "set_field", success: true });
          break;
        }
        case "email":
        case "sms":
        case "whatsapp":
        case "in_app": {
          const cfg = action.config as {
            to?: string;
            recipientType?: string;
            recipientId?: string;
            subject?: string;
            body: string;
            templateCode?: string;
            templateVariables?: Record<string, unknown>;
          };
          try {
            const channelMap: Record<string, CommunicationChannel> = {
              email: "EMAIL",
              sms: "SMS",
              whatsapp: "WHATSAPP",
              in_app: "IN_APP",
            };
            await sendCommunication({
              organizationId: event.organizationId,
              senderId: event.userId,
              recipientType: cfg.recipientType ?? "ORGANIZATION",
              recipientId: cfg.recipientId ?? cfg.to,
              channel: channelMap[action.type] ?? "IN_APP",
              subject: cfg.subject,
              body: cfg.body,
              templateCode: cfg.templateCode,
              templateVariables: cfg.templateVariables,
              referenceType: event.type,
              referenceId: event.payload?.id as string | undefined,
            });
            results.push({ type: action.type, success: true });
          } catch (err) {
            results.push({ type: action.type, success: false, error: String(err) });
          }
          break;
        }
        default:
          results.push({ type: action.type, success: false, error: "Unknown action type" });
      }
    } catch (err) {
      results.push({ type: action.type, success: false, error: String(err) });
    }
  }

  return results;
}

// ─── Duplicate Prevention ──────────────────────────────────────

const recentExecutions = new Map<string, number>();
const DEDUP_WINDOW_MS = 5000;

function executionKey(ruleId: string, event: DomainEvent): string {
  return `${ruleId}:${event.type}:${event.organizationId}:${event.payload?.id ?? ""}`;
}

function isDuplicate(ruleId: string, event: DomainEvent): boolean {
  const key = executionKey(ruleId, event);
  const last = recentExecutions.get(key);
  const now = Date.now();
  if (last && now - last < DEDUP_WINDOW_MS) return true;
  recentExecutions.set(key, now);
  return false;
}

// ─── Infinite Loop Protection ──────────────────────────────────

const MAX_EXECUTIONS_PER_MINUTE = 30;
const executionCounts = new Map<string, number[]>();

function isRateLimited(organizationId: string): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const timestamps = (executionCounts.get(organizationId) ?? []).filter((t) => t > windowStart);
  executionCounts.set(organizationId, timestamps);
  if (timestamps.length >= MAX_EXECUTIONS_PER_MINUTE) return true;
  timestamps.push(now);
  return false;
}

// ─── Core: Process Event Through Rules ─────────────────────────

export async function processEvent(event: DomainEvent) {
  if (isRateLimited(event.organizationId)) return;

  const rules = await db.automationRule.findMany({
    where: { organizationId: event.organizationId, enabled: true, trigger: event.type },
  });

  for (const rule of rules) {
    if (isDuplicate(rule.id, event)) continue;

    const conditions = rule.conditions as Condition[];
    const actions = rule.actions as Action[];
    const conditionsMet = evaluateConditions(conditions, (event.payload ?? {}) as Record<string, unknown>);

    let status: string;
    let error: string | undefined;
    let actionsExecuted: { type: string; success: boolean; error?: string }[] = [];

    if (!conditionsMet) {
      status = "SKIPPED";
    } else {
      actionsExecuted = await executeActions(actions, event, rule.id);
      status = actionsExecuted.every((r) => r.success) ? "SUCCESS" : "FAILED";
      const firstError = actionsExecuted.find((r) => !r.success);
      error = firstError?.error;
    }

    await db.automationExecutionLog.create({
      data: {
        organizationId: event.organizationId,
        ruleId: rule.id,
        eventType: event.type,
        payload: (event.payload as never) ?? undefined,
        conditionsMet,
        actionsExecuted: actionsExecuted.length > 0 ? (actionsExecuted as never) : undefined,
        status,
        error,
      },
    });

    await db.automationRule.update({
      where: { id: rule.id },
      data: { lastTriggeredAt: new Date(), executionCount: { increment: 1 } },
    });

    await audit({
      organizationId: event.organizationId,
      action: "automation.executed",
      resource: "AutomationRule",
      resourceId: rule.id,
      metadata: { eventType: event.type, status, conditionsMet },
    });
  }
}

// ─── Register Central Event Listener ───────────────────────────

onEvent("*", async (event) => {
  await processEvent(event);
});

// ─── Rule CRUD ─────────────────────────────────────────────────

export async function createRule(data: {
  organizationId: string;
  name: string;
  description?: string;
  trigger: string;
  conditions: Condition[];
  actions: Action[];
}) {
  return db.automationRule.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      description: data.description,
      trigger: data.trigger,
      conditions: data.conditions as unknown as object,
      actions: data.actions as unknown as object,
    },
  });
}

export async function updateRule(
  id: string,
  organizationId: string,
  data: Partial<{
    name: string;
    description: string;
    enabled: boolean;
    trigger: string;
    conditions: Condition[];
    actions: Action[];
  }>
) {
  return db.automationRule.updateMany({
    where: { id, organizationId },
    data: {
      ...data,
      conditions: data.conditions as unknown as object | undefined,
      actions: data.actions as unknown as object | undefined,
    },
  });
}

export async function deleteRule(id: string, organizationId: string) {
  return db.automationRule.deleteMany({ where: { id, organizationId } });
}

export async function listRules(organizationId: string) {
  return db.automationRule.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRule(id: string, organizationId: string) {
  return db.automationRule.findFirst({ where: { id, organizationId } });
}

export async function getExecutionLogs(ruleId: string, organizationId: string, limit = 50) {
  return db.automationExecutionLog.findMany({
    where: { ruleId, organizationId },
    orderBy: { executedAt: "desc" },
    take: limit,
  });
}
