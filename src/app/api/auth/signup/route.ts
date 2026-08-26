import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/constants";
import { getOrgPricingData, type OrgTypeSlug, type PlanSlug } from "@/lib/pricing-plans";
import { checkRateLimit } from "@/lib/rate-limit";

const VALID_ORG_TYPES: OrgTypeSlug[] = ["private_school", "support_center", "training_center"];
const ORG_TYPE_MAP: Record<OrgTypeSlug, string> = {
  private_school: "PRIVATE_SCHOOL",
  support_center: "SUPPORT_CENTER",
  training_center: "TRAINING_CENTER",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
    const rl = checkRateLimit(`signup:${ip}`, { windowMs: 60 * 60 * 1000, maxRequests: 3 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Veuillez réessayer plus tard." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const body = await request.json();
    const { name, email, password, orgType, planSlug, orgName } = body;

    if (!name || !email || !password || !orgType || !planSlug || !orgName) {
      return NextResponse.json(
        { error: "Tous les champs sont requis." },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Le nom doit contenir au moins 2 caractères." },
        { status: 400 }
      );
    }

    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Adresse e-mail invalide." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins une lettre majuscule." },
        { status: 400 }
      );
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins un chiffre." },
        { status: 400 }
      );
    }

    if (!VALID_ORG_TYPES.includes(orgType as OrgTypeSlug)) {
      return NextResponse.json(
        { error: "Type d'organisation invalide." },
        { status: 400 }
      );
    }

    const pricingData = getOrgPricingData(orgType as OrgTypeSlug);
    if (!pricingData) {
      return NextResponse.json(
        { error: "Type d'organisation invalide." },
        { status: 400 }
      );
    }

    const planCard = pricingData.plans.find((p) => p.slug === planSlug);
    if (!planCard) {
      return NextResponse.json(
        { error: "Plan invalide." },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte avec cet e-mail existe déjà." },
        { status: 409 }
      );
    }

    let slug = slugify(orgName);
    const existingSlug = await db.organization.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const passwordHash = await hashPassword(password);

    const PLAN_CODE_MAP: Record<PlanSlug, string> = {
      starter: "STARTER",
      standard: "STANDARD",
      pro: "PRO",
      ultimate: "ULTIMATE",
      custom: "CUSTOM",
    };

    const PLAN_NAME_MAP: Record<PlanSlug, string> = {
      starter: "Starter",
      standard: "Standard",
      pro: "Pro",
      ultimate: "Ultimate",
      custom: "Custom",
    };

    const planCode = PLAN_CODE_MAP[planSlug as PlanSlug];

    const ownerRole = await db.role.findUnique({ where: { name: "OWNER" } });
    if (!ownerRole) {
      return NextResponse.json(
        { error: "Erreur de configuration. Veuillez réessayer." },
        { status: 500 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: name.trim(), passwordHash },
      });

      const organization = await tx.organization.create({
        data: {
          name: orgName.trim(),
          slug,
          type: ORG_TYPE_MAP[orgType as OrgTypeSlug] as "PRIVATE_SCHOOL" | "SUPPORT_CENTER" | "TRAINING_CENTER",
          members: {
            create: {
              userId: user.id,
              roleId: ownerRole.id,
              isActive: true,
            },
          },
          branches: {
            create: {
              name: "Succursale principale",
              code: "MAIN",
              isMain: true,
            },
          },
        },
      });

      let plan = await tx.plan.findUnique({ where: { code: planCode } });
      if (!plan) {
        const planPriceMap: Record<PlanSlug, number | null> = {
          starter: null,
          standard: null,
          pro: 3500,
          ultimate: 7500,
          custom: null,
        };
        plan = await tx.plan.create({
          data: {
            name: PLAN_NAME_MAP[planSlug as PlanSlug],
            code: planCode,
            displayName: PLAN_NAME_MAP[planSlug as PlanSlug],
            description: planCard.tagline,
            priceMonthly: planPriceMap[planSlug as PlanSlug],
            currency: "MAD",
            trialDurationDays: 30,
            sortOrder: ["starter", "standard", "pro", "ultimate", "custom"].indexOf(planSlug),
          },
        });
      }

      const now = new Date();
      const trialEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const subscription = await tx.subscription.create({
        data: {
          organizationId: organization.id,
          planId: plan.id,
          status: "TRIAL",
          billingInterval: "MONTHLY",
          startDate: now,
          trialEndsAt,
          currentPeriodStart: now,
          currentPeriodEnd: trialEndsAt,
        },
      });

      return { user, organization, subscription };
    });

    const session = await createSession(result.user.id);

    const response = NextResponse.json({
      user: { id: result.user.id, email: result.user.email, name: result.user.name, role: result.user.role },
      organization: { id: result.organization.id, name: result.organization.name, slug: result.organization.slug, type: result.organization.type },
      subscription: { id: result.subscription.id, status: result.subscription.status },
    });

    response.cookies.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[SIGNUP ERROR]", msg);
    return NextResponse.json(
      { error: "Impossible de créer votre espace pour le moment. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
