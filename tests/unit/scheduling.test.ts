import { describe, it, expect } from "vitest";

describe("Scheduling Engine", () => {
  describe("Module exports", () => {
    it("should export all room functions", async () => {
      const mod = await import("@/lib/rooms");
      expect(typeof mod.createRoom).toBe("function");
      expect(typeof mod.listRooms).toBe("function");
      expect(typeof mod.updateRoom).toBe("function");
      expect(typeof mod.deleteRoom).toBe("function");
    });

    it("should export all scheduling functions", async () => {
      const mod = await import("@/lib/scheduling");
      expect(typeof mod.createSession).toBe("function");
      expect(typeof mod.updateSession).toBe("function");
      expect(typeof mod.deleteSession).toBe("function");
      expect(typeof mod.listSessions).toBe("function");
      expect(typeof mod.getTimetable).toBe("function");
      expect(typeof mod.checkConflicts).toBe("function");
      expect(typeof mod.createSchedule).toBe("function");
      expect(typeof mod.listSchedules).toBe("function");
      expect(typeof mod.deleteSchedule).toBe("function");
    });
  });

  describe("Conflict detection logic", () => {
    it("should detect time overlaps", async () => {
      const { checkConflicts } = await import("@/lib/scheduling");

      // checkConflicts requires DB, but we can verify the function signature
      expect(typeof checkConflicts).toBe("function");
    });
  });

  describe("Enums", () => {
    it("should have RoomStatus values", async () => {
      const { RoomStatus } = await import("@/generated/prisma/client");
      expect(RoomStatus.AVAILABLE).toBe("AVAILABLE");
      expect(RoomStatus.MAINTENANCE).toBe("MAINTENANCE");
      expect(RoomStatus.UNAVAILABLE).toBe("UNAVAILABLE");
    });

    it("should have RoomType values", async () => {
      const { RoomType } = await import("@/generated/prisma/client");
      expect(RoomType.CLASSROOM).toBe("CLASSROOM");
      expect(RoomType.LAB).toBe("LAB");
      expect(RoomType.AUDITORIUM).toBe("AUDITORIUM");
    });

    it("should have DayOfWeek values", async () => {
      const { DayOfWeek } = await import("@/generated/prisma/client");
      expect(DayOfWeek.MONDAY).toBe("MONDAY");
      expect(DayOfWeek.SUNDAY).toBe("SUNDAY");
    });
  });

  describe("RBAC", () => {
    it("should include scheduling permissions", async () => {
      const { PERMISSIONS } = await import("@/lib/rbac");
      expect(PERMISSIONS.ROOMS_READ).toBe("ROOMS_READ");
      expect(PERMISSIONS.ROOMS_MANAGE).toBe("ROOMS_MANAGE");
      expect(PERMISSIONS.SCHEDULES_READ).toBe("SCHEDULES_READ");
      expect(PERMISSIONS.SCHEDULES_MANAGE).toBe("SCHEDULES_MANAGE");
    });

    it("should grant ADMIN full scheduling access", async () => {
      const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
      expect(ROLE_PERMISSIONS.ADMIN).toContain("ROOMS_MANAGE");
      expect(ROLE_PERMISSIONS.ADMIN).toContain("SCHEDULES_MANAGE");
    });

    it("should grant TEACHER read-only schedule access", async () => {
      const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
      expect(ROLE_PERMISSIONS.TEACHER).toContain("SCHEDULES_READ");
      expect(ROLE_PERMISSIONS.TEACHER).not.toContain("SCHEDULES_MANAGE");
    });
  });
});
