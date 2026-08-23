import { describe, it, expect } from "vitest";

describe("Attendance + Academic Tracking", () => {
  describe("Module exports", () => {
    it("should export all attendance functions", async () => {
      const mod = await import("@/lib/attendance");
      expect(typeof mod.markAttendance).toBe("function");
      expect(typeof mod.markBatchAttendance).toBe("function");
      expect(typeof mod.listAttendance).toBe("function");
      expect(typeof mod.getAttendanceSummary).toBe("function");
      expect(typeof mod.getAbsenceHistory).toBe("function");
      expect(typeof mod.onAttendanceEvent).toBe("function");
      expect(typeof mod.emitAttendanceEvent).toBe("function");
    });

    it("should export all assessment functions", async () => {
      const mod = await import("@/lib/assessment");
      expect(typeof mod.createAssessment).toBe("function");
      expect(typeof mod.listAssessments).toBe("function");
      expect(typeof mod.deleteAssessment).toBe("function");
      expect(typeof mod.recordGrade).toBe("function");
      expect(typeof mod.recordBatchGrades).toBe("function");
      expect(typeof mod.getStudentGrades).toBe("function");
      expect(typeof mod.getStudentAcademicSummary).toBe("function");
    });
  });

  describe("Enums", () => {
    it("should have AttendanceStatus values", async () => {
      const { AttendanceStatus } = await import("@/generated/prisma/client");
      expect(AttendanceStatus.PRESENT).toBe("PRESENT");
      expect(AttendanceStatus.ABSENT).toBe("ABSENT");
      expect(AttendanceStatus.LATE).toBe("LATE");
      expect(AttendanceStatus.EXCUSED).toBe("EXCUSED");
    });
  });

  describe("RBAC", () => {
    it("should include grades permissions", async () => {
      const { PERMISSIONS } = await import("@/lib/rbac");
      expect(PERMISSIONS.GRADES_READ).toBe("GRADES_READ");
      expect(PERMISSIONS.GRADES_MANAGE).toBe("GRADES_MANAGE");
    });

    it("should grant TEACHER grades access", async () => {
      const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
      expect(ROLE_PERMISSIONS.TEACHER).toContain("GRADES_MANAGE");
      expect(ROLE_PERMISSIONS.TEACHER).toContain("ATTENDANCE_MANAGE");
    });

    it("should grant PARENT grades read-only", async () => {
      const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
      expect(ROLE_PERMISSIONS.PARENT).toContain("GRADES_READ");
      expect(ROLE_PERMISSIONS.PARENT).not.toContain("GRADES_MANAGE");
    });
  });

  describe("Attendance events", () => {
    it("should register and emit events via central bus", async () => {
      const { onEvent } = await import("@/lib/events");
      const { emitAttendanceEvent } = await import("@/lib/attendance");
      let received: unknown = null;
      onEvent("student.absent", (e) => { received = e; });

      await emitAttendanceEvent({
        type: "student.absent",
        studentId: "test",
        organizationId: "org",
        date: new Date(),
      });

      expect(received).toBeTruthy();
    });
  });
});
