import { db } from "@/lib/prisma";

// ─── Types ─────────────────────────────────────────────────────

export type TemplateVariable = {
  name: string;
  label: string;
  type: "string" | "number" | "date" | "boolean";
  required?: boolean;
  defaultValue?: string;
};

export type ResolvedTemplate = {
  subject?: string;
  body: string;
  missingVariables: string[];
};

// ─── Variable Registry ─────────────────────────────────────────

const BUILTIN_VARIABLES: Record<string, TemplateVariable> = {
  student_name: { name: "student_name", label: "Student Name", type: "string", required: true },
  student_first_name: { name: "student_first_name", label: "Student First Name", type: "string" },
  parent_name: { name: "parent_name", label: "Parent Name", type: "string" },
  teacher_name: { name: "teacher_name", label: "Teacher/Trainer Name", type: "string" },
  organization_name: { name: "organization_name", label: "School Name", type: "string" },
  organization_phone: { name: "organization_phone", label: "School Phone", type: "string" },
  organization_email: { name: "organization_email", label: "School Email", type: "string" },
  date: { name: "date", label: "Current Date", type: "date" },
  session_date: { name: "session_date", label: "Session Date", type: "date" },
  session_time: { name: "session_time", label: "Session Time", type: "string" },
  course_name: { name: "course_name", label: "Course/Program Name", type: "string" },
  amount: { name: "amount", label: "Amount", type: "number" },
  due_date: { name: "due_date", label: "Due Date", type: "date" },
  invoice_number: { name: "invoice_number", label: "Invoice Number", type: "string" },
  certificate_number: { name: "certificate_number", label: "Certificate Number", type: "string" },
  grade: { name: "grade", label: "Grade/Score", type: "string" },
  attendance_date: { name: "attendance_date", label: "Attendance Date", type: "date" },
  attendance_status: { name: "attendance_status", label: "Attendance Status", type: "string" },
  message: { name: "message", label: "Custom Message", type: "string" },
  login_url: { name: "login_url", label: "Login URL", type: "string" },
  sender_name: { name: "sender_name", label: "Sender Name", type: "string" },
};

// ─── Template Resolution ───────────────────────────────────────

export function resolveTemplate(
  template: string,
  variables: Record<string, unknown>
): ResolvedTemplate {
  const missingVariables: string[] = [];
  const now = new Date();

  const resolved = template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = variables[varName];
    if (value !== undefined && value !== null && value !== "") {
      if (value instanceof Date) {
        return formatDate(value);
      }
      return String(value);
    }

    const builtin = BUILTIN_VARIABLES[varName];
    if (builtin?.defaultValue) return builtin.defaultValue;
    if (varName === "date") return formatDate(now);
    if (!missingVariables.includes(varName)) missingVariables.push(varName);
    return match;
  });

  return { body: resolved, missingVariables };
}

export function resolveTemplateFull(
  subject: string | null | undefined,
  body: string,
  variables: Record<string, unknown>
): ResolvedTemplate {
  const bodyResult = resolveTemplate(body, variables);
  let resolvedSubject: string | undefined;

  if (subject) {
    const subjectResult = resolveTemplate(subject, variables);
    resolvedSubject = subjectResult.body;
    bodyResult.missingVariables.push(...subjectResult.missingVariables);
  }

  return {
    subject: resolvedSubject,
    body: bodyResult.body,
    missingVariables: [...new Set(bodyResult.missingVariables)],
  };
}

// ─── Template CRUD ─────────────────────────────────────────────

export async function createTemplate(data: {
  organizationId: string;
  name: string;
  code: string;
  channel: string;
  language?: string;
  subject?: string;
  body: string;
  variables?: string[];
  isSystem?: boolean;
  createdBy?: string;
}) {
  return db.communicationTemplate.create({
    data: {
      organizationId: data.organizationId,
      name: data.name,
      code: data.code,
      channel: data.channel,
      language: data.language ?? "en",
      subject: data.subject,
      body: data.body,
      variables: data.variables ?? undefined,
      isSystem: data.isSystem ?? false,
      createdBy: data.createdBy,
    },
  });
}

export async function updateTemplate(
  id: string,
  organizationId: string,
  data: Partial<{
    name: string;
    subject: string;
    body: string;
    variables: string[];
    status: string;
    updatedBy: string;
  }>
) {
  return db.communicationTemplate.updateMany({
    where: { id, organizationId, isSystem: false },
    data,
  });
}

export async function deleteTemplate(id: string, organizationId: string) {
  return db.communicationTemplate.deleteMany({
    where: { id, organizationId, isSystem: false },
  });
}

export async function getTemplate(id: string, organizationId: string) {
  return db.communicationTemplate.findFirst({
    where: { id, organizationId },
  });
}

export async function getTemplateByCode(
  code: string,
  channel: string,
  organizationId: string,
  language?: string
) {
  return db.communicationTemplate.findFirst({
    where: {
      organizationId,
      code,
      channel,
      language: language ?? "en",
      status: "ACTIVE",
    },
  });
}

export async function listTemplates(
  organizationId: string,
  filters?: { channel?: string; status?: string }
) {
  return db.communicationTemplate.findMany({
    where: {
      organizationId,
      ...(filters?.channel ? { channel: filters.channel } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Available Variables ───────────────────────────────────────

export function getAvailableVariables(): TemplateVariable[] {
  return Object.values(BUILTIN_VARIABLES);
}

// ─── Helpers ───────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
