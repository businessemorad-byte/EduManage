import { describe, it, expect } from "vitest";

describe("Academic Engine Schema", () => {
  describe("EnrollmentStatus enum", () => {
    it("should have all statuses", async () => {
      const { EnrollmentStatus } = await import("@/generated/prisma/client");
      expect(EnrollmentStatus.ACTIVE).toBe("ACTIVE");
      expect(EnrollmentStatus.COMPLETED).toBe("COMPLETED");
      expect(EnrollmentStatus.WITHDRAWN).toBe("WITHDRAWN");
      expect(EnrollmentStatus.TRANSFERRED).toBe("TRANSFERRED");
      expect(EnrollmentStatus.REPEATING).toBe("REPEATING");
    });
  });

  describe("Academic module structure", () => {
    it("should export all academic functions", async () => {
      const mod = await import("@/lib/academic");
      expect(typeof mod.createAcademicYear).toBe("function");
      expect(typeof mod.listAcademicYears).toBe("function");
      expect(typeof mod.getCurrentAcademicYear).toBe("function");
      expect(typeof mod.createLevel).toBe("function");
      expect(typeof mod.listLevels).toBe("function");
      expect(typeof mod.createSubject).toBe("function");
      expect(typeof mod.listSubjects).toBe("function");
      expect(typeof mod.createProgram).toBe("function");
      expect(typeof mod.listPrograms).toBe("function");
      expect(typeof mod.createModule).toBe("function");
      expect(typeof mod.listModules).toBe("function");
      expect(typeof mod.createGroup).toBe("function");
      expect(typeof mod.listGroups).toBe("function");
      expect(typeof mod.createEnrollment).toBe("function");
      expect(typeof mod.listEnrollments).toBe("function");
      expect(typeof mod.getStudentEnrollments).toBe("function");
    });
  });
});
