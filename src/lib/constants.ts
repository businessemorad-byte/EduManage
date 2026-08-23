export const APP_NAME = "EduManage";
export const APP_DESCRIPTION =
  "Multi-tenant SaaS platform for private schools, support centers, and training centers.";

export enum OrganizationType {
  PRIVATE_SCHOOL = "PRIVATE_SCHOOL",
  SUPPORT_CENTER = "SUPPORT_CENTER",
  TRAINING_CENTER = "TRAINING_CENTER",
}

export enum SubscriptionStatus {
  TRIAL = "TRIAL",
  ACTIVE = "ACTIVE",
  PAST_DUE = "PAST_DUE",
  CANCELLED = "CANCELLED",
  TRIALING = "TRIALING",
  EXPIRED = "EXPIRED",
  SUSPENDED = "SUSPENDED",
}

export enum PlanTier {
  STANDARD = "STANDARD",
  PRO = "PRO",
  ULTIMATE = "ULTIMATE",
  CUSTOM = "CUSTOM",
}

export enum FeatureKey {
  AI_ENABLED = "AI_ENABLED",
  AI_CREDITS_MONTHLY = "AI_CREDITS_MONTHLY",
  MAX_STUDENTS = "MAX_STUDENTS",
  MAX_BRANCHES = "MAX_BRANCHES",
  ADVANCED_ANALYTICS = "ADVANCED_ANALYTICS",
  AI_EXECUTIVE = "AI_EXECUTIVE",
  AUTOMATION = "AUTOMATION",
  SCHEDULING = "SCHEDULING",
  REPORT_CARDS = "REPORT_CARDS",
  PARENT_PORTAL = "PARENT_PORTAL",
  ADVANCED_REPORTING = "ADVANCED_REPORTING",
  HOMEWORK = "HOMEWORK",
  ANNOUNCEMENTS = "ANNOUNCEMENTS",
  ADMISSIONS = "ADMISSIONS",
  SUPPORT_CRM = "SUPPORT_CRM",
  TRIAL_SESSIONS = "TRIAL_SESSIONS",
  TEACHER_WORKLOAD = "TEACHER_WORKLOAD",
  GROUP_PROFITABILITY = "GROUP_PROFITABILITY",
  ROOM_ANALYTICS = "ROOM_ANALYTICS",
  STUDENT_PORTAL = "STUDENT_PORTAL",
  TRAINING_PROGRAMS = "TRAINING_PROGRAMS",
  COURSE_MANAGEMENT = "COURSE_MANAGEMENT",
  COHORT_MANAGEMENT = "COHORT_MANAGEMENT",
  CORPORATE_TRAINING = "CORPORATE_TRAINING",
  CERTIFICATES = "CERTIFICATES",
  CERTIFICATE_VERIFICATION = "CERTIFICATE_VERIFICATION",
  COMPETENCY_TRACKING = "COMPETENCY_TRACKING",
  TRAINER_PORTAL = "TRAINER_PORTAL",
  LEARNER_PORTAL = "LEARNER_PORTAL",
  CORPORATE_PORTAL = "CORPORATE_PORTAL",
  ADVANCED_TRAINING_REPORTS = "ADVANCED_TRAINING_REPORTS",
  TRAINING_PROFITABILITY = "TRAINING_PROFITABILITY",
  // Phase 5: Communication
  IN_APP_NOTIFICATIONS = "IN_APP_NOTIFICATIONS",
  EMAIL_NOTIFICATIONS = "EMAIL_NOTIFICATIONS",
  SMS_NOTIFICATIONS = "SMS_NOTIFICATIONS",
  WHATSAPP_NOTIFICATIONS = "WHATSAPP_NOTIFICATIONS",
  COMMUNICATION_TEMPLATES = "COMMUNICATION_TEMPLATES",
  COMMUNICATION_CAMPAIGNS = "COMMUNICATION_CAMPAIGNS",
  COMMUNICATION_AUTOMATIONS = "COMMUNICATION_AUTOMATIONS",
  COMMUNICATION_ANALYTICS = "COMMUNICATION_ANALYTICS",
  BULK_COMMUNICATION = "BULK_COMMUNICATION",
  ADVANCED_COMMUNICATION = "ADVANCED_COMMUNICATION",
  // Phase 6: AI Intelligence
  AI_ASSISTANT = "AI_ASSISTANT",
  AI_INSIGHTS = "AI_INSIGHTS",
  AI_ATTENDANCE_INSIGHTS = "AI_ATTENDANCE_INSIGHTS",
  AI_FINANCIAL_INSIGHTS = "AI_FINANCIAL_INSIGHTS",
  AI_ACADEMIC_INSIGHTS = "AI_ACADEMIC_INSIGHTS",
  AI_CRM_INSIGHTS = "AI_CRM_INSIGHTS",
  AI_KNOWLEDGE_BASE = "AI_KNOWLEDGE_BASE",
  AI_RECOMMENDATIONS = "AI_RECOMMENDATIONS",
  AI_ANOMALY_DETECTION = "AI_ANOMALY_DETECTION",
  AI_REPORTS = "AI_REPORTS",
  // Phase 7: Billing
  API_ACCESS = "API_ACCESS",
  CUSTOM_BRANDING = "CUSTOM_BRANDING",
  PRIORITY_SUPPORT = "PRIORITY_SUPPORT",
  MAX_TEACHERS = "MAX_TEACHERS",
  MAX_STAFF = "MAX_STAFF",
  MAX_GROUPS = "MAX_GROUPS",
  MAX_STORAGE_MB = "MAX_STORAGE_MB",
  MAX_EMAILS = "MAX_EMAILS",
  MAX_SMS = "MAX_SMS",
  MAX_WHATSAPP = "MAX_WHATSAPP",
}

export const SESSION_COOKIE_NAME = "session_token";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

export enum PlatformRole {
  PLATFORM_OWNER = "PLATFORM_OWNER",
  USER = "USER",
}

export const WORKSPACE_CONFIG = {
  ROOT_DOMAIN: process.env.ROOT_DOMAIN || "edumanage.com",
  SUBDOMAIN_PATTERN: /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/,
} as const;

export enum PersonStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export enum GuardianRelationship {
  FATHER = "FATHER",
  MOTHER = "MOTHER",
  GUARDIAN = "GUARDIAN",
  OTHER = "OTHER",
}

export enum PersonType {
  STUDENT = "STUDENT",
  TEACHER = "TEACHER",
  TRAINER = "TRAINER",
  PARENT = "PARENT",
  STAFF = "STAFF",
}

export const VERTICAL_LABELS: Record<OrganizationType, Record<string, string>> = {
  [OrganizationType.PRIVATE_SCHOOL]: {
    [PersonType.STUDENT]: "Student",
    [PersonType.TEACHER]: "Teacher",
    [PersonType.TRAINER]: "Trainer",
    [PersonType.PARENT]: "Parent",
    [PersonType.STAFF]: "Staff",
  },
  [OrganizationType.SUPPORT_CENTER]: {
    [PersonType.STUDENT]: "Student",
    [PersonType.TEACHER]: "Teacher",
    [PersonType.TRAINER]: "Trainer",
    [PersonType.PARENT]: "Guardian",
    [PersonType.STAFF]: "Staff",
  },
  [OrganizationType.TRAINING_CENTER]: {
    [PersonType.STUDENT]: "Learner",
    [PersonType.TEACHER]: "Instructor",
    [PersonType.TRAINER]: "Trainer",
    [PersonType.PARENT]: "Guardian",
    [PersonType.STAFF]: "Staff",
  },
};

export const EVENT_TYPES = {
  STUDENT_CREATED: "student.created",
  STUDENT_ENROLLED: "student.enrolled",
  STUDENT_ABSENT: "student.absent",
  STUDENT_LATE: "student.late",
  PAYMENT_CREATED: "payment.created",
  PAYMENT_OVERDUE: "payment.overdue",
  INVOICE_CREATED: "invoice.created",
  SESSION_CREATED: "session.created",
  TEACHER_ABSENT: "teacher.absent",
  ADMISSION_CREATED: "admission.created",
  ADMISSION_ACCEPTED: "admission.accepted",
  ADMISSION_REJECTED: "admission.rejected",
  REPORT_CARD_FINALIZED: "report_card.finalized",
  HOMEWORK_ASSIGNED: "homework.assigned",
  ANNOUNCEMENT_PUBLISHED: "announcement.published",
  STUDENT_PROMOTED: "student.promoted",
  LEAD_CREATED: "lead.created",
  LEAD_CONVERTED: "lead.converted",
  LEAD_LOST: "lead.lost",
  TRIAL_SCHEDULED: "trial.scheduled",
  TRIAL_COMPLETED: "trial.completed",
  ENROLLMENT_CREATED: "enrollment.created",
  ENROLLMENT_CANCELLED: "enrollment.cancelled",
  COMPENSATION_GENERATED: "compensation.generated",
  MONTHLY_SUBSCRIPTION_CREATED: "monthly_subscription.created",
  MONTHLY_SUBSCRIPTION_OVERDUE: "monthly_subscription.overdue",
  STUDENT_PAUSED: "student.paused",
  STUDENT_DROPPED: "student.dropped",
  PROGRAM_CREATED: "program.created",
  COHORT_CREATED: "cohort.created",
  COHORT_ENROLLMENT: "cohort.enrollment",
  CORPORATE_CLIENT_CREATED: "corporate_client.created",
  CORPORATE_CONTRACT_CREATED: "corporate_contract.created",
  CERTIFICATE_ISSUED: "certificate.issued",
  CERTIFICATE_REVOKED: "certificate.revoked",
  ASSIGNMENT_SUBMITTED: "assignment.submitted",
  COMPETENCY_ACHIEVED: "competency.achieved",
  PROPOSAL_SENT: "proposal.sent",
  PROPOSAL_ACCEPTED: "proposal.accepted",
  // Phase 5: Communication Events
  NOTIFICATION_SENT: "notification.sent",
  NOTIFICATION_READ: "notification.read",
  EMAIL_SENT: "email.sent",
  EMAIL_DELIVERED: "email.delivered",
  EMAIL_BOUNCED: "email.bounced",
  SMS_SENT: "sms.sent",
  SMS_DELIVERED: "sms.delivered",
  WHATSAPP_SENT: "whatsapp.sent",
  WHATSAPP_DELIVERED: "whatsapp.delivered",
  CAMPAIGN_STARTED: "campaign.started",
  CAMPAIGN_COMPLETED: "campaign.completed",
  CAMPAIGN_FAILED: "campaign.failed",
  TEMPLATE_CREATED: "template.created",
  TEMPLATE_UPDATED: "template.updated",
  CONTACT_REQUEST_CREATED: "contact_request.created",
  CONTACT_REQUEST_RESOLVED: "contact_request.resolved",
  MESSAGE_SENT: "message.sent",
  MESSAGE_READ: "message.read",
  PROVIDER_TESTED: "provider.tested",
  PROVIDER_FAILED: "provider.failed",
  // Phase 6: AI Intelligence Events
  AI_CHAT_MESSAGE: "ai.chat.message",
  AI_RECOMMENDATION_GENERATED: "ai.recommendation.generated",
  AI_RECOMMENDATION_ACCEPTED: "ai.recommendation.accepted",
  AI_RECOMMENDATION_DISMISSED: "ai.recommendation.dismissed",
  AI_INSIGHT_GENERATED: "ai.insight.generated",
  AI_ANOMALY_DETECTED: "ai.anomaly.detected",
  AI_REPORT_GENERATED: "ai.report.generated",
  AI_KNOWLEDGE_DOCUMENT_INDEXED: "ai.knowledge.document_indexed",
  // Phase 7: Billing Events
  BILLING_SUBSCRIPTION_CREATED: "billing.subscription.created",
  BILLING_SUBSCRIPTION_ACTIVATED: "billing.subscription.activated",
  BILLING_SUBSCRIPTION_UPGRADED: "billing.subscription.upgraded",
  BILLING_SUBSCRIPTION_DOWNGRADED: "billing.subscription.downgraded",
  BILLING_SUBSCRIPTION_CANCELED: "billing.subscription.canceled",
  BILLING_SUBSCRIPTION_EXPIRED: "billing.subscription.expired",
  BILLING_SUBSCRIPTION_PAST_DUE: "billing.subscription.past_due",
  BILLING_PAYMENT_CREATED: "billing.payment.created",
  BILLING_PAYMENT_SUCCEEDED: "billing.payment.succeeded",
  BILLING_PAYMENT_FAILED: "billing.payment.failed",
  BILLING_INVOICE_CREATED: "billing.invoice.created",
  BILLING_INVOICE_PAID: "billing.invoice.paid",
  BILLING_INVOICE_FAILED: "billing.invoice.failed",
  BILLING_TRIAL_ENDING: "billing.trial.ending",
  BILLING_COUPON_APPLIED: "billing.coupon.applied",
  BILLING_REFUND_ISSUED: "billing.refund.issued",
} as const;

export const LEAD_SOURCES = {
  WALK_IN: "WALK_IN",
  PHONE: "PHONE",
  WHATSAPP: "WHATSAPP",
  FACEBOOK: "FACEBOOK",
  INSTAGRAM: "INSTAGRAM",
  REFERRAL: "REFERRAL",
  WEBSITE: "WEBSITE",
  OTHER: "OTHER",
} as const;

export const EMPLOYMENT_TYPES = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  FREELANCE: "FREELANCE",
  CONTRACT: "CONTRACT",
} as const;

export const ASSESSMENT_TYPES = {
  EXAM: "EXAM",
  QUIZ: "QUIZ",
  TEST: "TEST",
  ASSIGNMENT: "ASSIGNMENT",
  PROJECT: "PROJECT",
} as const;

export const TERM_OPTIONS = {
  TERM_1: "TERM_1",
  TERM_2: "TERM_2",
  TERM_3: "TERM_3",
} as const;

export const ROUNDING_RULES = {
  ROUND: "ROUND",
  CEIL: "CEIL",
  FLOOR: "FLOOR",
  NONE: "NONE",
} as const;
