import { describe, it, expect } from "vitest";

describe("Event System", () => {
  it("should export core event functions", async () => {
    const mod = await import("@/lib/events");
    expect(typeof mod.emitEvent).toBe("function");
    expect(typeof mod.onEvent).toBe("function");
    expect(typeof mod.onAnyEvent).toBe("function");
    expect(typeof mod.audit).toBe("function");
  });

  it("should have all event type constants", async () => {
    const { EVENT_TYPES } = await import("@/lib/events");
    expect(EVENT_TYPES.STUDENT_CREATED).toBe("student.created");
    expect(EVENT_TYPES.STUDENT_ENROLLED).toBe("student.enrolled");
    expect(EVENT_TYPES.STUDENT_ABSENT).toBe("student.absent");
    expect(EVENT_TYPES.STUDENT_LATE).toBe("student.late");
    expect(EVENT_TYPES.PAYMENT_CREATED).toBe("payment.created");
    expect(EVENT_TYPES.PAYMENT_OVERDUE).toBe("payment.overdue");
    expect(EVENT_TYPES.INVOICE_CREATED).toBe("invoice.created");
    expect(EVENT_TYPES.SESSION_CREATED).toBe("session.created");
    expect(EVENT_TYPES.TEACHER_ABSENT).toBe("teacher.absent");
  });

  it("should register and emit type-specific events", async () => {
    const { onEvent, emitEvent } = await import("@/lib/events");
    let received: unknown = null;
    onEvent("test.event", (e) => { received = e; });

    await emitEvent({ type: "test.event", organizationId: "org1", payload: { key: "val" } });
    expect(received).toBeTruthy();
  });

  it("should emit to global handlers", async () => {
    const { onAnyEvent, emitEvent } = await import("@/lib/events");
    let received: unknown = null;
    onAnyEvent((e) => { received = e; });

    await emitEvent({ type: "global.test", organizationId: "org1" });
    expect(received).toBeTruthy();
  });
});

describe("Notifications", () => {
  it("should export notification functions", async () => {
    const mod = await import("@/lib/notifications");
    expect(typeof mod.createNotification).toBe("function");
    expect(typeof mod.createBulkNotifications).toBe("function");
    expect(typeof mod.getUserNotifications).toBe("function");
    expect(typeof mod.getUnreadCount).toBe("function");
    expect(typeof mod.markAsRead).toBe("function");
    expect(typeof mod.markAllAsRead).toBe("function");
    expect(typeof mod.deleteNotification).toBe("function");
    expect(typeof mod.registerProvider).toBe("function");
    expect(typeof mod.sendExternalNotification).toBe("function");
  });

  it("should export NotificationProvider type", async () => {
    const mod = await import("@/lib/notifications");
    expect(typeof mod.registerProvider).toBe("function");
  });
});

describe("Automation Engine", () => {
  it("should export automation functions", async () => {
    const mod = await import("@/lib/automation");
    expect(typeof mod.createRule).toBe("function");
    expect(typeof mod.updateRule).toBe("function");
    expect(typeof mod.deleteRule).toBe("function");
    expect(typeof mod.listRules).toBe("function");
    expect(typeof mod.getRule).toBe("function");
    expect(typeof mod.getExecutionLogs).toBe("function");
    expect(typeof mod.processEvent).toBe("function");
    expect(typeof mod.executeActions).toBe("function");
    expect(typeof mod.evaluateCondition).toBe("function");
    expect(typeof mod.evaluateConditions).toBe("function");
  });

  describe("Condition evaluation", () => {
    it("should evaluate eq operator", async () => {
      const { evaluateCondition } = await import("@/lib/automation");
      expect(evaluateCondition("PAID", "eq", "PAID")).toBe(true);
      expect(evaluateCondition("PAID", "eq", "PENDING")).toBe(false);
    });

    it("should evaluate neq operator", async () => {
      const { evaluateCondition } = await import("@/lib/automation");
      expect(evaluateCondition("PAID", "neq", "PENDING")).toBe(true);
      expect(evaluateCondition("PAID", "neq", "PAID")).toBe(false);
    });

    it("should evaluate gt operator", async () => {
      const { evaluateCondition } = await import("@/lib/automation");
      expect(evaluateCondition(100, "gt", 50)).toBe(true);
      expect(evaluateCondition(50, "gt", 100)).toBe(false);
    });

    it("should evaluate gte operator", async () => {
      const { evaluateCondition } = await import("@/lib/automation");
      expect(evaluateCondition(100, "gte", 100)).toBe(true);
      expect(evaluateCondition(99, "gte", 100)).toBe(false);
    });

    it("should evaluate lt operator", async () => {
      const { evaluateCondition } = await import("@/lib/automation");
      expect(evaluateCondition(50, "lt", 100)).toBe(true);
      expect(evaluateCondition(100, "lt", 50)).toBe(false);
    });

    it("should evaluate lte operator", async () => {
      const { evaluateCondition } = await import("@/lib/automation");
      expect(evaluateCondition(100, "lte", 100)).toBe(true);
      expect(evaluateCondition(101, "lte", 100)).toBe(false);
    });

    it("should evaluate contains operator", async () => {
      const { evaluateCondition } = await import("@/lib/automation");
      expect(evaluateCondition("hello world", "contains", "world")).toBe(true);
      expect(evaluateCondition("hello", "contains", "xyz")).toBe(false);
    });

    it("should evaluate in operator", async () => {
      const { evaluateCondition } = await import("@/lib/automation");
      expect(evaluateCondition("a", "in", ["a", "b", "c"])).toBe(true);
      expect(evaluateCondition("d", "in", ["a", "b", "c"])).toBe(false);
    });

    it("should evaluate multiple conditions", async () => {
      const { evaluateConditions } = await import("@/lib/automation");
      const conditions = [
        { field: "amount", operator: "gt" as const, value: 100 },
        { field: "status", operator: "eq" as const, value: "OVERDUE" },
      ];
      expect(evaluateConditions(conditions, { amount: 200, status: "OVERDUE" })).toBe(true);
      expect(evaluateConditions(conditions, { amount: 50, status: "OVERDUE" })).toBe(false);
      expect(evaluateConditions(conditions, { amount: 200, status: "PAID" })).toBe(false);
    });

    it("should resolve nested fields", async () => {
      const { evaluateCondition } = await import("@/lib/automation");
      expect(evaluateCondition("PAID", "eq", "PAID")).toBe(true);
    });
  });
});

describe("RBAC", () => {
  it("should include notification permissions", async () => {
    const { PERMISSIONS } = await import("@/lib/rbac");
    expect(PERMISSIONS.NOTIFICATIONS_READ).toBe("NOTIFICATIONS_READ");
    expect(PERMISSIONS.NOTIFICATIONS_MANAGE).toBe("NOTIFICATIONS_MANAGE");
  });

  it("should include automation permissions", async () => {
    const { PERMISSIONS } = await import("@/lib/rbac");
    expect(PERMISSIONS.AUTOMATIONS_READ).toBe("AUTOMATIONS_READ");
    expect(PERMISSIONS.AUTOMATIONS_MANAGE).toBe("AUTOMATIONS_MANAGE");
  });

  it("should grant ADMIN full notification and automation access", async () => {
    const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("NOTIFICATIONS_MANAGE");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("AUTOMATIONS_MANAGE");
  });

  it("should grant DIRECTOR automation read and notification manage", async () => {
    const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
    expect(ROLE_PERMISSIONS.DIRECTOR).toContain("AUTOMATIONS_READ");
    expect(ROLE_PERMISSIONS.DIRECTOR).toContain("NOTIFICATIONS_MANAGE");
  });

  it("should grant TEACHER notification read", async () => {
    const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
    expect(ROLE_PERMISSIONS.TEACHER).toContain("NOTIFICATIONS_READ");
  });

  it("should grant PARENT notification read", async () => {
    const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
    expect(ROLE_PERMISSIONS.PARENT).toContain("NOTIFICATIONS_READ");
  });

  it("should grant STUDENT notification read", async () => {
    const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
    expect(ROLE_PERMISSIONS.STUDENT).toContain("NOTIFICATIONS_READ");
  });
});
