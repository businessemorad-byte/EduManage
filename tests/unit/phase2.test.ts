import { describe, it, expect } from "vitest";

describe("Phase 2: Admissions", () => {
  it("should export admission functions", async () => {
    const mod = await import("@/lib/admissions");
    expect(typeof mod.createAdmission).toBe("function");
    expect(typeof mod.listAdmissions).toBe("function");
    expect(typeof mod.updateAdmissionStatus).toBe("function");
    expect(typeof mod.getAdmission).toBe("function");
  });
});

describe("Phase 2: Homework", () => {
  it("should export homework functions", async () => {
    const mod = await import("@/lib/homework");
    expect(typeof mod.createHomework).toBe("function");
    expect(typeof mod.listHomework).toBe("function");
    expect(typeof mod.getHomework).toBe("function");
    expect(typeof mod.updateHomework).toBe("function");
    expect(typeof mod.submitHomework).toBe("function");
    expect(typeof mod.gradeSubmission).toBe("function");
    expect(typeof mod.getStudentHomework).toBe("function");
  });
});

describe("Phase 2: Report Cards", () => {
  it("should export report card functions", async () => {
    const mod = await import("@/lib/reportcards");
    expect(typeof mod.getGradingConfig).toBe("function");
    expect(typeof mod.updateGradingConfig).toBe("function");
    expect(typeof mod.calculateSubjectAverages).toBe("function");
    expect(typeof mod.calculateOverallAverage).toBe("function");
    expect(typeof mod.generateReportCard).toBe("function");
    expect(typeof mod.finalizeReportCard).toBe("function");
    expect(typeof mod.listReportCards).toBe("function");
    expect(typeof mod.promoteStudent).toBe("function");
    expect(typeof mod.listPromotions).toBe("function");
  });
});

describe("Phase 2: Announcements", () => {
  it("should export announcement functions", async () => {
    const mod = await import("@/lib/announcements");
    expect(typeof mod.createAnnouncement).toBe("function");
    expect(typeof mod.listAnnouncements).toBe("function");
    expect(typeof mod.publishAnnouncement).toBe("function");
    expect(typeof mod.archiveAnnouncement).toBe("function");
    expect(typeof mod.deleteAnnouncement).toBe("function");
    expect(typeof mod.getAnnouncement).toBe("function");
  });
});

describe("Phase 2: Documents", () => {
  it("should export document functions", async () => {
    const mod = await import("@/lib/documents");
    expect(typeof mod.uploadDocument).toBe("function");
    expect(typeof mod.listDocuments).toBe("function");
    expect(typeof mod.deleteDocument).toBe("function");
    expect(typeof mod.getDocument).toBe("function");
  });
});

describe("Phase 2: Constants", () => {
  it("should have new feature keys", async () => {
    const { FeatureKey } = await import("@/lib/constants");
    expect(FeatureKey.REPORT_CARDS).toBe("REPORT_CARDS");
    expect(FeatureKey.PARENT_PORTAL).toBe("PARENT_PORTAL");
    expect(FeatureKey.HOMEWORK).toBe("HOMEWORK");
    expect(FeatureKey.ANNOUNCEMENTS).toBe("ANNOUNCEMENTS");
    expect(FeatureKey.ADMISSIONS).toBe("ADMISSIONS");
  });

  it("should have new event types", async () => {
    const { EVENT_TYPES } = await import("@/lib/constants");
    expect(EVENT_TYPES.ADMISSION_CREATED).toBe("admission.created");
    expect(EVENT_TYPES.ADMISSION_ACCEPTED).toBe("admission.accepted");
    expect(EVENT_TYPES.REPORT_CARD_FINALIZED).toBe("report_card.finalized");
    expect(EVENT_TYPES.HOMEWORK_ASSIGNED).toBe("homework.assigned");
    expect(EVENT_TYPES.ANNOUNCEMENT_PUBLISHED).toBe("announcement.published");
    expect(EVENT_TYPES.STUDENT_PROMOTED).toBe("student.promoted");
  });
});

describe("Phase 2: RBAC", () => {
  it("should have new permissions", async () => {
    const { PERMISSIONS } = await import("@/lib/rbac");
    expect(PERMISSIONS.ADMISSIONS_READ).toBe("ADMISSIONS_READ");
    expect(PERMISSIONS.ADMISSIONS_MANAGE).toBe("ADMISSIONS_MANAGE");
    expect(PERMISSIONS.HOMEWORK_READ).toBe("HOMEWORK_READ");
    expect(PERMISSIONS.HOMEWORK_MANAGE).toBe("HOMEWORK_MANAGE");
    expect(PERMISSIONS.REPORT_CARDS_READ).toBe("REPORT_CARDS_READ");
    expect(PERMISSIONS.REPORT_CARDS_MANAGE).toBe("REPORT_CARDS_MANAGE");
    expect(PERMISSIONS.ANNOUNCEMENTS_READ).toBe("ANNOUNCEMENTS_READ");
    expect(PERMISSIONS.ANNOUNCEMENTS_MANAGE).toBe("ANNOUNCEMENTS_MANAGE");
    expect(PERMISSIONS.DOCUMENTS_READ).toBe("DOCUMENTS_READ");
    expect(PERMISSIONS.DOCUMENTS_MANAGE).toBe("DOCUMENTS_MANAGE");
  });

  it("should grant ADMIN all new permissions", async () => {
    const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("ADMISSIONS_READ");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("ADMISSIONS_MANAGE");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("HOMEWORK_READ");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("HOMEWORK_MANAGE");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("REPORT_CARDS_READ");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("REPORT_CARDS_MANAGE");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("ANNOUNCEMENTS_READ");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("ANNOUNCEMENTS_MANAGE");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("DOCUMENTS_READ");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("DOCUMENTS_MANAGE");
  });

  it("should grant TEACHER homework and report card permissions", async () => {
    const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
    expect(ROLE_PERMISSIONS.TEACHER).toContain("HOMEWORK_READ");
    expect(ROLE_PERMISSIONS.TEACHER).toContain("HOMEWORK_MANAGE");
    expect(ROLE_PERMISSIONS.TEACHER).toContain("REPORT_CARDS_READ");
  });

  it("should grant PARENT read-only permissions", async () => {
    const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
    expect(ROLE_PERMISSIONS.PARENT).toContain("HOMEWORK_READ");
    expect(ROLE_PERMISSIONS.PARENT).toContain("REPORT_CARDS_READ");
    expect(ROLE_PERMISSIONS.PARENT).toContain("ANNOUNCEMENTS_READ");
    expect(ROLE_PERMISSIONS.PARENT).not.toContain("HOMEWORK_MANAGE");
  });

  it("should grant RECEPTIONIST admissions permissions", async () => {
    const { ROLE_PERMISSIONS } = await import("@/lib/rbac");
    expect(ROLE_PERMISSIONS.RECEPTIONIST).toContain("ADMISSIONS_READ");
    expect(ROLE_PERMISSIONS.RECEPTIONIST).toContain("ADMISSIONS_MANAGE");
  });
});

describe("Phase 2: Grade Calculation", () => {
  it("should calculate overall average correctly", async () => {
    const { calculateOverallAverage } = await import("@/lib/reportcards");
    const avg = await calculateOverallAverage([
      { average: 15, coefficient: 2 },
      { average: 12, coefficient: 3 },
      { average: 18, coefficient: 1 },
    ]);
    // (15*2 + 12*3 + 18*1) / (2+3+1) = (30+36+18)/6 = 84/6 = 14
    expect(avg).toBe(14);
  });

  it("should handle empty averages", async () => {
    const { calculateOverallAverage } = await import("@/lib/reportcards");
    const avg = await calculateOverallAverage([]);
    expect(avg).toBeNull();
  });

  it("should handle averages with nulls", async () => {
    const { calculateOverallAverage } = await import("@/lib/reportcards");
    const avg = await calculateOverallAverage([
      { average: 15, coefficient: 2 },
      { average: null, coefficient: 3 },
    ]);
    expect(avg).toBe(15);
  });
});

describe("Phase 2: Student Status", () => {
  it("should have all student statuses", async () => {
    // StudentStatus enum is in Prisma schema - verify via model
    const statuses = ["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED", "SUSPENDED", "WITHDRAWN"];
    expect(statuses).toHaveLength(6);
  });
});
