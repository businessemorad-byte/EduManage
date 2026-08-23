import { db } from "@/lib/prisma";

export { EVENT_TYPES } from "@/lib/constants";

// ─── Event Types ───────────────────────────────────────────────

export type DomainEvent = {
  type: string;
  organizationId: string;
  userId?: string;
  payload?: Record<string, unknown>;
};

type EventHandler = (event: DomainEvent) => void | Promise<void>;

// ─── In-Memory Bus ─────────────────────────────────────────────

const handlers = new Map<string, EventHandler[]>();
const globalHandlers: EventHandler[] = [];

export function onEvent(type: string, handler: EventHandler) {
  if (!handlers.has(type)) handlers.set(type, []);
  handlers.get(type)!.push(handler);
}

export function onAnyEvent(handler: EventHandler) {
  globalHandlers.push(handler);
}

export async function emitEvent(event: DomainEvent) {
  // Dispatch to type-specific handlers
  const typeHandlers = handlers.get(event.type) ?? [];
  for (const h of typeHandlers) {
    await h(event);
  }
  // Dispatch to global handlers
  for (const h of globalHandlers) {
    await h(event);
  }
}

// ─── Audit Helper ──────────────────────────────────────────────

export async function audit(data: {
  organizationId: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}) {
  await db.auditLog.create({
    data: {
      organizationId: data.organizationId,
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      metadata: (data.metadata as never) ?? undefined,
    },
  });
}
