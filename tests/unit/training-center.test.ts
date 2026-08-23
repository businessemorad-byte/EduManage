import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => {
  const model = () => ({
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn(),
    upsert: vi.fn(),
    groupBy: vi.fn().mockResolvedValue([]),
  });
  const models = {
    program: model(), module: model(), trainer: model(), enrollment: model(),
    group: model(), certificate: model(), attendanceRecord: model(),
    assessment: model(), grade: model(), person: model(), staff: model(),
    student: model(), user: model(), feePlan: model(), invoice: model(),
    payment: model(), lead: model(), classSession: model(),
    competency: model(), competencyRecord: model(),
  };
  const db = models as typeof models & { $transaction: unknown };
  (db as Record<string, unknown>).$transaction = vi.fn(
    async (fn: (tx: unknown) => unknown) => fn({ attendanceRecord: models.attendanceRecord })
  );
  return { db };
});

vi.mock("@/lib/events", () => ({
  emitEvent: vi.fn(),
  EVENT_TYPES: {
    STUDENT_ABSENT: "STUDENT_ABSENT", STUDENT_LATE: "STUDENT_LATE",
    ENROLLMENT_CREATED: "ENROLLMENT_CREATED", CERTIFICATE_ISSUED: "CERTIFICATE_ISSUED",
    COHORT_ENROLLMENT: "COHORT_ENROLLMENT",
  },
}));

import { db } from "@/lib/prisma";
import { createTrainingProgram, listTrainingPrograms, updateTrainingProgram } from "@/lib/training-programs";
import { createModule, updateModule, listModules } from "@/lib/modules";
import { listTrainers, getTrainer, createTrainer, updateTrainer } from "@/lib/trainers";
import { enrollTrainee, withdrawTrainee, listTrainingEnrollments, checkCertificateEligibility } from "@/lib/training-enrollment";
import { createCohort, listCohorts, updateCohort } from "@/lib/cohorts";
import { issueCertificate, revokeCertificate, listCertificates } from "@/lib/certificates";
import { markAttendance, markBatchAttendance, listAttendance, getAttendanceSummary } from "@/lib/attendance";
import { createAssessment, listAssessments, recordGrade } from "@/lib/assessment";

beforeEach(() => { vi.clearAllMocks(); });

describe("Training Center - Programs", () => {
  it("should create a program", async () => {
    vi.mocked(db.program.create).mockResolvedValue({ id: "prog1", name: "Java Dev" } as never);
    const result = await createTrainingProgram({ organizationId: "org1", name: "Java Dev" });
    expect(result.name).toBe("Java Dev");
  });
  it("should list programs", async () => {
    vi.mocked(db.program.findMany).mockResolvedValue([{ id: "prog1" }, { id: "prog2" }] as never);
    vi.mocked(db.program.count).mockResolvedValue(2);
    const result = await listTrainingPrograms("org1", { search: "dev", page: 1, limit: 10 });
    expect(result.programs).toHaveLength(2);
    expect(result.total).toBe(2);
  });
  it("should update a program", async () => {
    vi.mocked(db.program.updateMany).mockResolvedValue({ count: 1 } as never);
    await updateTrainingProgram("prog1", "org1", { name: "Advanced Java" });
    expect(db.program.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "prog1", organizationId: "org1" } }));
  });
});

describe("Training Center - Modules", () => {
  it("should create a module", async () => {
    vi.mocked(db.module.create).mockResolvedValue({ id: "mod1", name: "OOP" } as never);
    const result = await createModule({ organizationId: "org1", programId: "prog1", name: "OOP", sortOrder: 1 });
    expect(result.name).toBe("OOP");
  });
  it("should list modules", async () => {
    vi.mocked(db.module.findMany).mockResolvedValue([{ id: "mod1" }, { id: "mod2" }] as never);
    vi.mocked(db.module.count).mockResolvedValue(2);
    const result = await listModules("org1", { programId: "prog1" });
    expect(result.modules).toHaveLength(2);
  });
  it("should update a module", async () => {
    vi.mocked(db.module.updateMany).mockResolvedValue({ count: 1 } as never);
    await updateModule("mod1", "org1", { name: "Advanced OOP" });
    expect(db.module.updateMany).toHaveBeenCalled();
  });
});

describe("Training Center - Trainers", () => {
  it("should create a trainer", async () => {
    vi.mocked(db.trainer.create).mockResolvedValue({ id: "tr1", staffId: "s1" } as never);
    const result = await createTrainer({ organizationId: "org1", staffId: "s1", specialization: "Java", hourlyRate: 200 });
    expect(result.staffId).toBe("s1");
  });
  it("should list trainers", async () => {
    vi.mocked(db.trainer.findMany).mockResolvedValue([{ id: "tr1" }] as never);
    vi.mocked(db.trainer.count).mockResolvedValue(1);
    const result = await listTrainers("org1", { search: "Java" });
    expect(result.trainers).toHaveLength(1);
  });
  it("should get trainer by id", async () => {
    vi.mocked(db.trainer.findFirst).mockResolvedValue({ id: "tr1" } as never);
    const result = await getTrainer("tr1", "org1");
    expect(result?.id).toBe("tr1");
  });
  it("should return null for missing trainer", async () => {
    vi.mocked(db.trainer.findFirst).mockResolvedValue(null);
    const result = await getTrainer("none", "org1");
    expect(result).toBeNull();
  });
  it("should update trainer", async () => {
    vi.mocked(db.trainer.updateMany).mockResolvedValue({ count: 1 } as never);
    await updateTrainer("tr1", "org1", { hourlyRate: 250 });
    expect(db.trainer.updateMany).toHaveBeenCalled();
  });
});

describe("Training Center - Enrollment", () => {
  it("should enroll a trainee", async () => {
    vi.mocked(db.program.findFirst).mockResolvedValue({ id: "prog1", isActive: true } as never);
    vi.mocked(db.enrollment.findFirst).mockResolvedValue(null);
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "student1" } as never);
    vi.mocked(db.enrollment.count).mockResolvedValue(0);
    vi.mocked(db.enrollment.create).mockResolvedValue({ id: "enr1", status: "ACTIVE" } as never);
    const result = await enrollTrainee({ organizationId: "org1", studentId: "student1", programId: "prog1" });
    expect(result.status).toBe("ACTIVE");
  });
  it("should reject duplicate enrollment", async () => {
    vi.mocked(db.program.findFirst).mockResolvedValue({ id: "prog1", isActive: true } as never);
    vi.mocked(db.enrollment.findFirst).mockResolvedValue({ id: "existing", status: "ACTIVE" } as never);
    await expect(enrollTrainee({ organizationId: "org1", studentId: "student1", programId: "prog1" })).rejects.toThrow();
  });
  it("should allow enrollment after withdrawal", async () => {
    vi.mocked(db.program.findFirst).mockResolvedValue({ id: "prog1", isActive: true } as never);
    vi.mocked(db.enrollment.findFirst).mockResolvedValue(null);
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "student1" } as never);
    vi.mocked(db.enrollment.count).mockResolvedValue(0);
    vi.mocked(db.enrollment.create).mockResolvedValue({ id: "enr2", status: "ACTIVE" } as never);
    const result = await enrollTrainee({ organizationId: "org1", studentId: "student1", programId: "prog1" });
    expect(result.status).toBe("ACTIVE");
  });
  it("should withdraw a trainee", async () => {
    vi.mocked(db.enrollment.findFirst).mockResolvedValue({ id: "enr1", status: "ACTIVE" } as never);
    vi.mocked(db.enrollment.update).mockResolvedValue({ id: "enr1", status: "WITHDRAWN" } as never);
    const result = await withdrawTrainee("enr1", "org1", "Personal reasons");
    expect(result.status).toBe("WITHDRAWN");
  });
  it("should throw for missing enrollment on withdraw", async () => {
    vi.mocked(db.enrollment.findFirst).mockResolvedValue(null);
    await expect(withdrawTrainee("none", "org1")).rejects.toThrow();
  });
  it("should list enrollments", async () => {
    vi.mocked(db.enrollment.findMany).mockResolvedValue([{ id: "enr1", status: "ACTIVE" }] as never);
    vi.mocked(db.enrollment.count).mockResolvedValue(1);
    const result = await listTrainingEnrollments("org1", { programId: "prog1", status: "ACTIVE" });
    expect(result.enrollments).toHaveLength(1);
  });
});

describe("Training Center - Certificate Eligibility", () => {
  it("should return eligible when all conditions met", async () => {
    vi.mocked(db.program.findFirst).mockResolvedValue({ id: "p1", name: "Test" } as never);
    vi.mocked(db.enrollment.findFirst).mockResolvedValue({ id: "e1", studentId: "s1", programId: "p1", status: "ACTIVE" } as never);
    vi.mocked(db.attendanceRecord.findMany).mockResolvedValue([
      { status: "PRESENT" }, { status: "PRESENT" }, { status: "PRESENT" }, { status: "ABSENT" },
    ] as never);
    vi.mocked(db.competency.findMany).mockResolvedValue([{ id: "c1" }, { id: "c2" }] as never);
    vi.mocked(db.competencyRecord.findMany).mockResolvedValue([{ competencyId: "c1", status: "ACHIEVED" }, { competencyId: "c2", status: "ACHIEVED" }] as never);
    vi.mocked(db.grade.findMany).mockResolvedValue([{ score: 85 }, { score: 90 }] as never);
    vi.mocked(db.module.findMany).mockResolvedValue([{ id: "m1" }, { id: "m2" }] as never);
    vi.mocked(db.certificate.findFirst).mockResolvedValue(null);
    const result = await checkCertificateEligibility("org1", "s1", "p1");
    expect(result.eligible).toBe(true);
  });
  it("should return not eligible when attendance too low", async () => {
    vi.mocked(db.program.findFirst).mockResolvedValue({ id: "p1", name: "Test" } as never);
    vi.mocked(db.enrollment.findFirst).mockResolvedValue({ id: "e1", studentId: "s1", programId: "p1", status: "ACTIVE" } as never);
    vi.mocked(db.attendanceRecord.findMany).mockResolvedValue(Array(10).fill({ status: "ABSENT" }) as never);
    vi.mocked(db.competency.findMany).mockResolvedValue([{ id: "c1" }, { id: "c2" }] as never);
    vi.mocked(db.competencyRecord.findMany).mockResolvedValue([{ competencyId: "c1", status: "ACHIEVED" }, { competencyId: "c2", status: "ACHIEVED" }] as never);
    vi.mocked(db.grade.findMany).mockResolvedValue([{ score: 80 }] as never);
    vi.mocked(db.module.findMany).mockResolvedValue([{ id: "m1" }, { id: "m2" }] as never);
    vi.mocked(db.certificate.findFirst).mockResolvedValue(null);
    const result = await checkCertificateEligibility("org1", "s1", "p1");
    expect(result.eligible).toBe(false);
  });
  it("should return not eligible if already has certificate", async () => {
    vi.mocked(db.enrollment.findFirst).mockResolvedValue({ id: "e1", studentId: "s1", programId: "p1", status: "ACTIVE" } as never);
    vi.mocked(db.attendanceRecord.findMany).mockResolvedValue([{ status: "PRESENT" }, { status: "PRESENT" }] as never);
    vi.mocked(db.competency.findMany).mockResolvedValue([{ id: "c1" }] as never);
    vi.mocked(db.competencyRecord.findMany).mockResolvedValue([{ competencyId: "c1", status: "ACHIEVED" }] as never);
    vi.mocked(db.grade.findMany).mockResolvedValue([{ score: 90 }] as never);
    vi.mocked(db.module.findMany).mockResolvedValue([{ id: "m1" }] as never);
    vi.mocked(db.certificate.findFirst).mockResolvedValue({ id: "cert1", status: "ISSUED" } as never);
    const result = await checkCertificateEligibility("org1", "s1", "p1");
    expect(result.eligible).toBe(false);
  });
});

describe("Training Center - Certificates", () => {
  it("should issue a certificate", async () => {
    vi.mocked(db.certificate.count).mockResolvedValue(0);
    vi.mocked(db.certificate.create).mockResolvedValue({ id: "cert1", certificateNumber: "CERT-001", status: "ISSUED" } as never);
    const result = await issueCertificate({ organizationId: "org1", studentId: "s1", programId: "p1", finalScore: 90 });
    expect(result.certificateNumber).toBe("CERT-001");
  });
  it("should create a certificate with generated number", async () => {
    vi.mocked(db.certificate.count).mockResolvedValue(0);
    vi.mocked(db.certificate.create).mockResolvedValue({ id: "cert1", certificateNumber: "CERT-00001", status: "ISSUED" } as never);
    const result = await issueCertificate({ organizationId: "org1", studentId: "s1", programId: "p1", finalScore: 90 });
    expect(result.certificateNumber).toBe("CERT-00001");
    expect(result.status).toBe("ISSUED");
  });
  it("should revoke a certificate", async () => {
    vi.mocked(db.certificate.updateMany).mockResolvedValue({ count: 1 } as never);
    await revokeCertificate("cert1", "org1", "Dishonesty");
    expect(db.certificate.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "cert1", organizationId: "org1", status: "ISSUED" } }));
  });
  it("should list certificates", async () => {
    vi.mocked(db.certificate.findMany).mockResolvedValue([{ id: "cert1" }] as never);
    vi.mocked(db.certificate.count).mockResolvedValue(1);
    const result = await listCertificates("org1", { status: "ISSUED" });
    expect(result.certificates).toHaveLength(1);
  });
});

describe("Training Center - Attendance", () => {
  it("should mark attendance", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "s1" } as never);
    vi.mocked(db.attendanceRecord.findFirst).mockResolvedValue(null);
    vi.mocked(db.attendanceRecord.create).mockResolvedValue({ id: "att1", status: "PRESENT" } as never);
    const result = await markAttendance({ organizationId: "org1", studentId: "s1", classSessionId: "sess1", date: "2026-08-22", status: "PRESENT" });
    expect(result.status).toBe("PRESENT");
  });
  it("should mark batch attendance", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "s1" } as never);
    vi.mocked(db.attendanceRecord.findFirst).mockResolvedValue(null);
    vi.mocked(db.attendanceRecord.create).mockResolvedValue({ id: "att1", status: "PRESENT" } as never);
    const results = await markBatchAttendance([
      { organizationId: "org1", studentId: "s1", classSessionId: "sess1", date: "2026-08-22", status: "PRESENT" },
      { organizationId: "org1", studentId: "s2", classSessionId: "sess1", date: "2026-08-22", status: "ABSENT" },
    ]);
    expect(results.marked).toHaveLength(2);
    expect(results.failed).toHaveLength(0);
  });
  it("should list attendance", async () => {
    vi.mocked(db.attendanceRecord.findMany).mockResolvedValue([{ id: "att1", status: "PRESENT" }, { id: "att2", status: "ABSENT" }] as never);
    const result = await listAttendance({ organizationId: "org1", groupId: "g1" });
    expect(result).toHaveLength(2);
  });
  it("should get attendance summary", async () => {
    vi.mocked(db.attendanceRecord.findMany).mockResolvedValue([
      { status: "PRESENT" }, { status: "PRESENT" }, { status: "ABSENT" }, { status: "LATE" },
    ] as never);
    const result = await getAttendanceSummary({ organizationId: "org1", studentId: "s1" });
    expect(result.PRESENT).toBe(2);
    expect(result.ABSENT).toBe(1);
    expect(result.LATE).toBe(1);
    expect(result.total).toBe(4);
  });
});

describe("Training Center - Cohorts", () => {
  it("should create a cohort", async () => {
    vi.mocked(db.group.create).mockResolvedValue({ id: "c1", name: "Batch A", capacity: 30, status: "ACTIVE" } as never);
    const result = await createCohort({ organizationId: "org1", programId: "prog1", name: "Batch A", capacity: 30 });
    expect(result.name).toBe("Batch A");
  });
  it("should list cohorts", async () => {
    vi.mocked(db.group.findMany).mockResolvedValue([{ id: "c1" }, { id: "c2" }] as never);
    vi.mocked(db.group.count).mockResolvedValue(2);
    const result = await listCohorts("org1");
    expect(result.cohorts).toHaveLength(2);
  });
  it("should update a cohort", async () => {
    vi.mocked(db.group.updateMany).mockResolvedValue({ count: 1 } as never);
    await updateCohort("c1", "org1", { name: "Updated" });
    expect(db.group.updateMany).toHaveBeenCalled();
  });
});

describe("Training Center - Assessments", () => {
  it("should create an assessment", async () => {
    vi.mocked(db.assessment.create).mockResolvedValue({ id: "a1", name: "Mid-term", type: "EXAM", maxScore: 100, weight: 30 } as never);
    const result = await createAssessment({ organizationId: "org1", name: "Mid-term", type: "EXAM", maxScore: 100, weight: 30 });
    expect(result.name).toBe("Mid-term");
  });
  it("should list assessments", async () => {
    vi.mocked(db.assessment.findMany).mockResolvedValue([{ id: "a1" }, { id: "a2" }] as never);
    const result = await listAssessments("org1", { moduleId: "mod1" });
    expect(result).toHaveLength(2);
  });
  it("should record a grade", async () => {
    vi.mocked(db.assessment.findFirst).mockResolvedValue({ id: "a1", maxScore: 100 } as never);
    vi.mocked(db.grade.upsert).mockResolvedValue({ id: "g1", score: 85 } as never);
    const result = await recordGrade({ organizationId: "org1", studentId: "s1", assessmentId: "a1", score: 85, comments: "Good" });
    expect(result.score).toBe(85);
  });
});

describe("Training Center - Tenant Isolation", () => {
  it("should scope programs by org", async () => {
    vi.mocked(db.program.findMany).mockResolvedValue([] as never);
    vi.mocked(db.program.count).mockResolvedValue(0);
    await listTrainingPrograms("org1");
    expect(db.program.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org1" }) }));
  });
  it("should scope enrollments by org", async () => {
    vi.mocked(db.enrollment.findMany).mockResolvedValue([] as never);
    vi.mocked(db.enrollment.count).mockResolvedValue(0);
    await listTrainingEnrollments("org1");
    expect(db.enrollment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org1" }) }));
  });
  it("should scope modules by org", async () => {
    vi.mocked(db.module.findMany).mockResolvedValue([] as never);
    vi.mocked(db.module.count).mockResolvedValue(0);
    await listModules("org1");
    expect(db.module.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org1" }) }));
  });
  it("should scope trainers by org", async () => {
    vi.mocked(db.trainer.findMany).mockResolvedValue([] as never);
    vi.mocked(db.trainer.count).mockResolvedValue(0);
    await listTrainers("org1");
    expect(db.trainer.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org1" }) }));
  });
  it("should scope cohorts by org", async () => {
    vi.mocked(db.group.findMany).mockResolvedValue([] as never);
    vi.mocked(db.group.count).mockResolvedValue(0);
    await listCohorts("org1");
    expect(db.group.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org1" }) }));
  });
  it("should scope assessments by org", async () => {
    vi.mocked(db.assessment.findMany).mockResolvedValue([] as never);
    await listAssessments("org1");
    expect(db.assessment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org1" }) }));
  });
});
