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

  return {
    db: {
      person: model(),
      student: model(),
      staff: model(),
      teacher: model(),
      trainer: model(),
      program: model(),
      group: model(),
      enrollment: model(),
      certificate: model(),
      corporateClient: model(),
      corporateLearner: model(),
      corporateContract: model(),
      auditLog: model(),
      notification: model(),
      organization: model(),
      schedule: model(),
      classSession: model(),
      room: model(),
      grade: model(),
      assessment: model(),
      attendanceRecord: model(),
      subscription: model(),
      communicationLog: model(),
    },
  };
});

import { db } from "@/lib/prisma";
import { createTrainingProgram, listTrainingPrograms } from "@/lib/training-programs";
import { createCohort, enrollInCohort } from "@/lib/cohorts";
import { createCorporateClient, createCorporateLearner, createCorporateContract } from "@/lib/corporate";
import { issueCertificate, revokeCertificate, verifyCertificate } from "@/lib/certificates";
import { Decimal } from "@prisma/client/runtime/client";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Training Program ─────────────────────────────────────────

describe("Training - Program Management", () => {
  it("should create a training program", async () => {
    vi.mocked(db.program.create).mockResolvedValue({
      id: "prog1",
      name: "Leadership Bootcamp",
      code: "LB-101",
      programStatus: "DRAFT",
    } as never);

    const result = await createTrainingProgram({
      organizationId: "org1",
      name: "Leadership Bootcamp",
      code: "LB-101",
    });

    expect(db.program.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Leadership Bootcamp",
          code: "LB-101",
        }),
      })
    );
    expect(result.name).toBe("Leadership Bootcamp");
  });

  it("should list training programs", async () => {
    vi.mocked(db.program.findMany).mockResolvedValue([
      { id: "prog1", name: "Program A" },
      { id: "prog2", name: "Program B" },
    ] as never);
    vi.mocked(db.program.count).mockResolvedValue(2);

    const result = await listTrainingPrograms("org1");

    expect(result.programs).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("should update a training program", async () => {
    vi.mocked(db.program.updateMany).mockResolvedValue({ count: 1 } as never);

    const result = await updateTrainingProgram("prog1", "org1", { name: "Updated" });

    expect(db.program.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "prog1", organizationId: "org1" },
        data: { name: "Updated" },
      })
    );
  });
});

import { updateTrainingProgram } from "@/lib/training-programs";

// ─── Cohort Management ────────────────────────────────────────

describe("Training - Cohort Management", () => {
  it("should create a cohort", async () => {
    vi.mocked(db.group.create).mockResolvedValue({
      id: "cohort1",
      name: "Cohort A",
      programId: "prog1",
      cohortStatus: "PLANNED",
    } as never);

    const result = await createCohort({
      organizationId: "org1",
      programId: "prog1",
      name: "Cohort A",
      capacity: 30,
    });

    expect(db.group.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Cohort A",
          programId: "prog1",
          capacity: 30,
          cohortStatus: "PLANNED",
        }),
      })
    );
    expect(result.id).toBe("cohort1");
  });

  it("should enroll a learner in a cohort", async () => {
    vi.mocked(db.group.findFirst).mockResolvedValue({
      id: "cohort1",
      programId: "prog1",
      capacity: 30,
    } as never);
    vi.mocked(db.enrollment.count).mockResolvedValue(5);
    vi.mocked(db.enrollment.findFirst).mockResolvedValue(null);
    vi.mocked(db.enrollment.create).mockResolvedValue({
      id: "enr1",
      studentId: "s1",
      groupId: "cohort1",
      status: "ACTIVE",
    } as never);

    const result = await enrollInCohort("cohort1", "s1", "org1");

    expect(db.enrollment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          studentId: "s1",
          groupId: "cohort1",
          status: "ACTIVE",
        }),
      })
    );
    expect(result.id).toBe("enr1");
  });

  it("should reject enrollment when cohort is at capacity", async () => {
    vi.mocked(db.group.findFirst).mockResolvedValue({
      id: "cohort1",
      programId: "prog1",
      capacity: 2,
    } as never);
    vi.mocked(db.enrollment.count).mockResolvedValue(2);

    await expect(
      enrollInCohort("cohort1", "s1", "org1")
    ).rejects.toThrow("Cohort is at full capacity");
  });

  it("should reject duplicate enrollment", async () => {
    vi.mocked(db.group.findFirst).mockResolvedValue({
      id: "cohort1",
      programId: "prog1",
      capacity: 30,
    } as never);
    vi.mocked(db.enrollment.count).mockResolvedValue(5);
    vi.mocked(db.enrollment.findFirst).mockResolvedValue({
      id: "existing",
      studentId: "s1",
      groupId: "cohort1",
      status: "ACTIVE",
    } as never);

    await expect(
      enrollInCohort("cohort1", "s1", "org1")
    ).rejects.toThrow("Student is already enrolled in this cohort");
  });

  it("should reject enrollment for non-existent cohort", async () => {
    vi.mocked(db.group.findFirst).mockResolvedValue(null);

    await expect(
      enrollInCohort("none", "s1", "org1")
    ).rejects.toThrow("Cohort not found");
  });
});

// ─── Corporate Training ───────────────────────────────────────

describe("Training - Corporate Training", () => {
  it("should create a corporate client", async () => {
    vi.mocked(db.corporateClient.create).mockResolvedValue({
      id: "cc1",
      companyName: "Acme Corp",
      status: "PROSPECT",
    } as never);

    const result = await createCorporateClient({
      organizationId: "org1",
      companyName: "Acme Corp",
      contactName: "John Doe",
    });

    expect(db.corporateClient.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyName: "Acme Corp",
          contactName: "John Doe",
        }),
      })
    );
    expect(result.companyName).toBe("Acme Corp");
  });

  it("should create a corporate learner", async () => {
    vi.mocked(db.corporateLearner.create).mockResolvedValue({
      id: "cl1",
      employeeName: "Jane Smith",
      corporateClientId: "cc1",
    } as never);

    const result = await createCorporateLearner({
      organizationId: "org1",
      corporateClientId: "cc1",
      employeeName: "Jane Smith",
      department: "Engineering",
    });

    expect(db.corporateLearner.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          employeeName: "Jane Smith",
          department: "Engineering",
        }),
      })
    );
    expect(result.employeeName).toBe("Jane Smith");
  });

  it("should create a corporate contract", async () => {
    vi.mocked(db.corporateContract.create).mockResolvedValue({
      id: "contract1",
      corporateClientId: "cc1",
      agreedPrice: 5000,
      status: "DRAFT",
    } as never);

    const result = await createCorporateContract({
      organizationId: "org1",
      corporateClientId: "cc1",
      startDate: new Date("2025-01-01"),
      agreedPrice: 5000,
      billingModel: "FIXED",
    });

    expect(db.corporateContract.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agreedPrice: 5000,
          billingModel: "FIXED",
          status: "DRAFT",
        }),
      })
    );
    expect(result.agreedPrice).toBe(5000);
  });
});

// ─── Certificates ─────────────────────────────────────────────

describe("Training - Certificate Issuance", () => {
  it("should issue a certificate with sequential number", async () => {
    vi.mocked(db.certificate.count).mockResolvedValue(3);
    vi.mocked(db.certificate.create).mockResolvedValue({
      id: "cert1",
      certificateNumber: "CERT-00004",
      status: "ISSUED",
    } as never);

    const result = await issueCertificate({
      organizationId: "org1",
      studentId: "s1",
      programId: "prog1",
    });

    expect(db.certificate.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: "org1" },
      })
    );
    expect(result.certificateNumber).toBe("CERT-00004");
    expect(result.status).toBe("ISSUED");
  });

  it("should revoke an issued certificate", async () => {
    vi.mocked(db.certificate.updateMany).mockResolvedValue({ count: 1 } as never);

    const result = await revokeCertificate("cert1", "org1", "Academic misconduct");

    expect(db.certificate.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cert1", organizationId: "org1", status: "ISSUED" },
        data: expect.objectContaining({
          status: "REVOKED",
          revokedReason: "Academic misconduct",
        }),
      })
    );
    expect(result.count).toBe(1);
  });

  it("should verify a valid certificate", async () => {
    vi.mocked(db.certificate.findUnique).mockResolvedValue({
      id: "cert1",
      certificateNumber: "CERT-00001",
      status: "ISSUED",
      issueDate: new Date("2025-06-01"),
      expirationDate: null,
      student: {
        id: "s1",
        person: { firstName: "Sara", lastName: "Ali" },
      },
      program: { name: "Leadership Bootcamp", code: "LB-101" },
      organization: { name: "Acme Training Center" },
    } as never);

    const result = await verifyCertificate("valid-token");

    expect(result).not.toBeNull();
    expect(result!.valid).toBe(true);
    expect(result!.learnerName).toBe("Sara Ali");
    expect(result!.program).toBe("Leadership Bootcamp");
  });

  it("should return null for unknown certificate token", async () => {
    vi.mocked(db.certificate.findUnique).mockResolvedValue(null);

    const result = await verifyCertificate("unknown-token");

    expect(result).toBeNull();
  });

  it("should mark revoked certificate as invalid on verify", async () => {
    vi.mocked(db.certificate.findUnique).mockResolvedValue({
      id: "cert1",
      certificateNumber: "CERT-00001",
      status: "REVOKED",
      issueDate: new Date("2025-06-01"),
      expirationDate: null,
      student: { id: "s1", person: { firstName: "Sara", lastName: "Ali" } },
      program: null,
      organization: { name: "Acme" },
    } as never);

    const result = await verifyCertificate("revoked-token");

    expect(result).not.toBeNull();
    expect(result!.valid).toBe(false);
    expect(result!.status).toBe("REVOKED");
  });
});
