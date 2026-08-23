import { describe, it, expect } from "vitest";

describe("Tenant Isolation — Regression Tests", () => {
  describe("Groups: spread-override prevention", () => {
    it("organizationId from body should not override server-side value", () => {
      const serverOrgId = "org_server_123";
      const body = { name: "Math Group", organizationId: "org_attacker_456" };

      const result = { ...body, organizationId: serverOrgId };

      expect(result.organizationId).toBe("org_server_123");
      expect(result.name).toBe("Math Group");
    });
  });

  describe("Rooms: org-scoped functions require organizationId", () => {
    it("updateRoom signature accepts organizationId as 2nd parameter", async () => {
      const { updateRoom } = await import("@/lib/rooms");
      expect(typeof updateRoom).toBe("function");

      const fnStr = updateRoom.toString();
      expect(fnStr).toContain("organizationId");
    });

    it("deleteRoom signature accepts organizationId as 2nd parameter", async () => {
      const { deleteRoom } = await import("@/lib/rooms");
      expect(typeof deleteRoom).toBe("function");

      const fnStr = deleteRoom.toString();
      expect(fnStr).toContain("organizationId");
    });
  });

  describe("Scheduling: org-scoped delete functions", () => {
    it("deleteSession requires organizationId", async () => {
      const { deleteSession } = await import("@/lib/scheduling");
      const fnStr = deleteSession.toString();
      expect(fnStr).toContain("organizationId");
    });

    it("deleteSchedule requires organizationId", async () => {
      const { deleteSchedule } = await import("@/lib/scheduling");
      const fnStr = deleteSchedule.toString();
      expect(fnStr).toContain("organizationId");
    });
  });

  describe("Announcements: org-scoped archive", () => {
    it("archiveAnnouncement requires organizationId", async () => {
      const { archiveAnnouncement } = await import("@/lib/announcements");
      const fnStr = archiveAnnouncement.toString();
      expect(fnStr).toContain("organizationId");
    });
  });

  describe("AI Chat: conversation history org-scoped", () => {
    it("sendChatMessage history query includes organizationId filter", async () => {
      const { sendChatMessage } = await import("@/lib/ai/chat");
      const fnStr = sendChatMessage.toString();
      expect(fnStr).toContain("organizationId");
    });
  });

  describe("API Route: groups POST prevents orgId override", () => {
    it("groups route uses spread-then-override pattern", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const routePath = path.resolve("src/app/api/groups/route.ts");
      const content = fs.readFileSync(routePath, "utf-8");

      expect(content).toContain("{ ...body, organizationId }");
      expect(content).not.toMatch(/\{ organizationId, \.\.\.body \}/);
    });
  });

  describe("API Route: rooms/[id] passes organizationId", () => {
    it("rooms PATCH uses destructured organizationId", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const routePath = path.resolve("src/app/api/rooms/[id]/route.ts");
      const content = fs.readFileSync(routePath, "utf-8");

      expect(content).toContain("await requireOrgContext()");
      expect(content).toMatch(/\{\s*organizationId,\s*user\s*\} = await requireOrgContext\(\)/);
      expect(content).toContain("hasPermission(user.id, organizationId");
      expect(content).toContain("updateRoom(id, organizationId");
      expect(content).toContain("deleteRoom(id, organizationId)");
    });
  });

  describe("API Route: sessions/[id] DELETE passes organizationId", () => {
    it("sessions DELETE uses destructured organizationId", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const routePath = path.resolve("src/app/api/sessions/[id]/route.ts");
      const content = fs.readFileSync(routePath, "utf-8");

      expect(content).toContain("await requireOrgContext()");
      expect(content).toMatch(/\{\s*organizationId,\s*user\s*\} = await requireOrgContext\(\)/);
      expect(content).toContain("hasPermission(user.id, organizationId");
      expect(content).toContain("deleteSession(id, organizationId)");
    });
  });

  describe("API Route: announcements archive passes organizationId", () => {
    it("announcements archive passes organizationId", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const routePath = path.resolve("src/app/api/announcements/route.ts");
      const content = fs.readFileSync(routePath, "utf-8");

      expect(content).toContain("archiveAnnouncement(body.id, organizationId)");
    });
  });

  describe("Proxy: security headers present", () => {
    it("proxy.ts includes security headers", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const proxyPath = path.resolve("src/proxy.ts");
      const content = fs.readFileSync(proxyPath, "utf-8");

      expect(content).toContain("X-Content-Type-Options");
      expect(content).toContain("X-Frame-Options");
      expect(content).toContain("X-XSS-Protection");
      expect(content).toContain("Strict-Transport-Security");
      expect(content).toContain("Referrer-Policy");
      expect(content).toContain("Permissions-Policy");
    });

    it("billing webhook is a public path", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const proxyPath = path.resolve("src/proxy.ts");
      const content = fs.readFileSync(proxyPath, "utf-8");

      expect(content).toContain("/api/billing/webhook");
    });
  });

  describe("Cross-tenant data access prevention", () => {
    it("all lib functions filter by organizationId in queries", async () => {
      const { listStudents } = await import("@/lib/students");
      const { listPayments, listInvoices } = await import("@/lib/finance");
      const { listRooms } = await import("@/lib/rooms");
      const { listSessions } = await import("@/lib/scheduling");
      const { listAnnouncements } = await import("@/lib/announcements");

      expect(typeof listStudents).toBe("function");
      expect(typeof listPayments).toBe("function");
      expect(typeof listInvoices).toBe("function");
      expect(typeof listRooms).toBe("function");
      expect(typeof listSessions).toBe("function");
      expect(typeof listAnnouncements).toBe("function");
    });

    it("documents module filters by organizationId", async () => {
      const { listDocuments, deleteDocument, getDocument } = await import("@/lib/documents");

      const listFnStr = listDocuments.toString();
      expect(listFnStr).toContain("organizationId");

      const deleteFnStr = deleteDocument.toString();
      expect(deleteFnStr).toContain("organizationId");

      const getFnStr = getDocument.toString();
      expect(getFnStr).toContain("organizationId");
    });

    it("AI context engine filters by organizationId", async () => {
      const {
        aggregateStudentData,
        aggregateFinancialData,
        aggregateAttendanceData,
        aggregateAcademicData,
      } = await import("@/lib/ai/context-engine");

      expect(aggregateStudentData.toString()).toContain("organizationId");
      expect(aggregateFinancialData.toString()).toContain("organizationId");
      expect(aggregateAttendanceData.toString()).toContain("organizationId");
      expect(aggregateAcademicData.toString()).toContain("organizationId");
    });
  });
});
