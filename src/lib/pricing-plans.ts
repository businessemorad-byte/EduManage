import { OrganizationType } from "@/lib/constants";
import {
  PLAN_PRICING,
  AI_CREDITS_MONTHLY,
  computeAnnualSavings,
  formatMAD,
  type PlanTierSlug,
} from "@/lib/billing-config";

// ─── Plan Tiers ───────────────────────────────────────────────

export type PlanSlug = "starter" | "standard" | "pro" | "ultimate" | "custom";

export type OrgTypeSlug = "private_school" | "support_center" | "training_center";

// ─── Pricing Data ─────────────────────────────────────────────

export type PlanCard = {
  slug: PlanSlug;
  name: string;
  tagline: string;
  /** Monthly price in MAD (null = sur devis) */
  priceMonthly: number | null;
  /** Annual price in MAD (null = sur devis) */
  priceYearly: number | null;
  /** Savings vs paying 12 monthly invoices */
  yearlySavings: number;
  /** Display strings derived from the centralized config */
  price: string | null;
  priceSuffix: string;
  highlighted?: boolean;
  badge?: string;
  aiCredits: number | null; // null = no AI / custom
  limits: { label: string; value: string }[];
  features: string[];
  cta: string;
};

export type OrgPricingData = {
  orgType: OrgTypeSlug;
  label: string;
  description: string;
  icon: string;
  plans: PlanCard[];
};

type PlanCopy = Omit<
  PlanCard,
  | "priceMonthly"
  | "priceYearly"
  | "yearlySavings"
  | "price"
  | "priceSuffix"
  | "aiCredits"
> & { aiCredits?: number };

function buildPlan(orgType: OrganizationType, copy: PlanCopy): PlanCard {
  const { aiCredits, ...rest } = copy;

  const pricing =
    rest.slug === "custom"
      ? null
      : PLAN_PRICING[orgType]?.tiers[rest.slug as Exclude<PlanTierSlug, "custom">];

  const monthly = pricing?.priceMonthly ?? null;
  const yearly = pricing?.priceYearly ?? null;

  return {
    ...rest,
    priceMonthly: monthly,
    priceYearly: yearly,
    yearlySavings: monthly !== null ? computeAnnualSavings(monthly) : 0,
    price: monthly !== null ? formatMAD(monthly) : null,
    priceSuffix: monthly !== null ? "DH / mois" : "Sur devis",
    aiCredits:
      aiCredits !== undefined
        ? aiCredits
        : rest.slug === "custom"
          ? 0
          : AI_CREDITS_MONTHLY[rest.slug as Exclude<PlanTierSlug, "custom">],
  };
}

// ─── Plans per Organization Type ──────────────────────────────

const privateSchoolPlans: PlanCard[] = [
  buildPlan(OrganizationType.PRIVATE_SCHOOL, {
    slug: "starter",
    name: "Starter",
    tagline: "Pour les petites écoles",
    limits: [
      { label: "Élèves", value: "50" },
      { label: "Groupes", value: "5" },
      { label: "Enseignants", value: "5" },
      { label: "Sites", value: "1" },
    ],
    features: [
      "Élèves & parents",
      "Enseignants & groupes",
      "Présences & notes",
      "Emploi du temps",
      "Paiements & factures",
      "Documents",
    ],
    cta: "Commencer",
  }),
  buildPlan(OrganizationType.PRIVATE_SCHOOL, {
    slug: "standard",
    name: "Standard",
    tagline: "Pour les écoles en croissance",
    limits: [
      { label: "Élèves", value: "200" },
      { label: "Groupes", value: "Illimité" },
      { label: "Enseignants", value: "20" },
      { label: "Sites", value: "2" },
    ],
    features: [
      "Tout du Starter",
      "Bulletins & évaluations",
      "Progression élèves",
      "Devoirs",
      "Communication & annonces",
      "Rapports financiers",
      "Années scolaires",
    ],
    cta: "Commencer",
  }),
  buildPlan(OrganizationType.PRIVATE_SCHOOL, {
    slug: "pro",
    name: "Pro",
    tagline: "Pour les écoles établies",
    highlighted: true,
    badge: "Populaire",
    limits: [
      { label: "Élèves", value: "1 000" },
      { label: "Groupes", value: "Illimité" },
      { label: "Enseignants", value: "50" },
      { label: "Sites", value: "3" },
    ],
    features: [
      "Tout du Standard",
      "Admissions & CRM",
      "Automatisation",
      "Notifications avancées",
      "IA analytique",
      "Analytics avancés",
      "Support prioritaire",
    ],
    cta: "Essayer gratuitement",
  }),
  buildPlan(OrganizationType.PRIVATE_SCHOOL, {
    slug: "ultimate",
    name: "Ultimate",
    tagline: "La plateforme complète",
    limits: [
      { label: "Élèves", value: "Illimité" },
      { label: "Groupes", value: "Illimité" },
      { label: "Enseignants", value: "Illimité" },
      { label: "Sites", value: "Illimité" },
    ],
    features: [
      "Tout du Pro",
      "IA avancée (rapports, insights)",
      "Multi-sites complet",
      "Compensation enseignants",
      "Promotions & fidélisation",
      "Analytics financiers avancés",
      "Support dédié",
    ],
    cta: "Essayer gratuitement",
  }),
  buildPlan(OrganizationType.PRIVATE_SCHOOL, {
    slug: "custom",
    name: "Custom",
    tagline: "Pour les grandes institutions",
    aiCredits: 0,
    limits: [
      { label: "Élèves", value: "Personnalisé" },
      { label: "Sites", value: "Personnalisé" },
      { label: "IA", value: "Personnalisé" },
      { label: "Déploiement", value: "Personnalisé" },
    ],
    features: [
      "Tout du Ultimate",
      "Déploiement sur mesure",
      "IA personnalisée",
      "SLA garanti",
      "Intégrations sur mesure",
      "Formation dédiée",
      "Account manager",
    ],
    cta: "Contacter l'équipe",
  }),
];

const supportCenterPlans: PlanCard[] = [
  buildPlan(OrganizationType.SUPPORT_CENTER, {
    slug: "starter",
    name: "Starter",
    tagline: "Pour les petits centres",
    limits: [
      { label: "Élèves", value: "30" },
      { label: "Groupes", value: "5" },
      { label: "Enseignants", value: "3" },
      { label: "Salles", value: "3" },
    ],
    features: [
      "Élèves & parents",
      "Groupes & niveaux",
      "Présences",
      "Emploi du temps",
      "Paiements & reçus",
      "Documents",
    ],
    cta: "Commencer",
  }),
  buildPlan(OrganizationType.SUPPORT_CENTER, {
    slug: "standard",
    name: "Standard",
    tagline: "Pour les centres en croissance",
    limits: [
      { label: "Élèves", value: "150" },
      { label: "Groupes", value: "Illimité" },
      { label: "Enseignants", value: "15" },
      { label: "Salles", value: "10" },
    ],
    features: [
      "Tout du Starter",
      "Sessions & planification",
      "Réductions & remises",
      "Communication & annonces",
      "Prospects & essais",
      "Rapports basiques",
      "Suivi progrès élèves",
    ],
    cta: "Commencer",
  }),
  buildPlan(OrganizationType.SUPPORT_CENTER, {
    slug: "pro",
    name: "Pro",
    tagline: "Pour les centres établis",
    highlighted: true,
    badge: "Populaire",
    limits: [
      { label: "Élèves", value: "800" },
      { label: "Groupes", value: "Illimité" },
      { label: "Enseignants", value: "40" },
      { label: "Salles", value: "Illimité" },
    ],
    features: [
      "Tout du Standard",
      "Automatisation",
      "Notifications avancées",
      "IA analytique",
      "Rentabilité par groupe",
      "Analytics avancés",
      "Support prioritaire",
    ],
    cta: "Essayer gratuitement",
  }),
  buildPlan(OrganizationType.SUPPORT_CENTER, {
    slug: "ultimate",
    name: "Ultimate",
    tagline: "La plateforme complète",
    limits: [
      { label: "Élèves", value: "Illimité" },
      { label: "Groupes", value: "Illimité" },
      { label: "Enseignants", value: "Illimité" },
      { label: "Sites", value: "Illimité" },
    ],
    features: [
      "Tout du Pro",
      "IA avancée (rapports, insights)",
      "Multi-sites complet",
      "Analytics financiers avancés",
      "Gestion de charge enseignants",
      "Portail étudiant",
      "Support dédié",
    ],
    cta: "Essayer gratuitement",
  }),
  buildPlan(OrganizationType.SUPPORT_CENTER, {
    slug: "custom",
    name: "Custom",
    tagline: "Pour les grands réseaux",
    aiCredits: 0,
    limits: [
      { label: "Élèves", value: "Personnalisé" },
      { label: "Sites", value: "Personnalisé" },
      { label: "IA", value: "Personnalisé" },
      { label: "Déploiement", value: "Personnalisé" },
    ],
    features: [
      "Tout du Ultimate",
      "Déploiement sur mesure",
      "IA personnalisée",
      "SLA garanti",
      "Intégrations sur mesure",
      "Formation dédiée",
      "Account manager",
    ],
    cta: "Contacter l'équipe",
  }),
];

const trainingCenterPlans: PlanCard[] = [
  buildPlan(OrganizationType.TRAINING_CENTER, {
    slug: "starter",
    name: "Starter",
    tagline: "Pour les petits centres",
    limits: [
      { label: "Apprenants", value: "30" },
      { label: "Formations", value: "3" },
      { label: "Formateurs", value: "3" },
      { label: "Sessions", value: "10 / mois" },
    ],
    features: [
      "Apprenants & formateurs",
      "Formations & programmes",
      "Sessions & présences",
      "Inscriptions",
      "Paiements & factures",
      "Documents",
    ],
    cta: "Commencer",
  }),
  buildPlan(OrganizationType.TRAINING_CENTER, {
    slug: "standard",
    name: "Standard",
    tagline: "Pour les centres en croissance",
    limits: [
      { label: "Apprenants", value: "100" },
      { label: "Formations", value: "Illimité" },
      { label: "Formateurs", value: "10" },
      { label: "Sessions", value: "Illimité" },
    ],
    features: [
      "Tout du Starter",
      "Cohortes & groupes",
      "Suivi progression",
      "Évaluations",
      "Communication & annonces",
      "Rapports financiers",
      "Documents partagés",
    ],
    cta: "Commencer",
  }),
  buildPlan(OrganizationType.TRAINING_CENTER, {
    slug: "pro",
    name: "Pro",
    tagline: "Pour les centres établis",
    highlighted: true,
    badge: "Populaire",
    limits: [
      { label: "Apprenants", value: "500" },
      { label: "Formations", value: "Illimité" },
      { label: "Formateurs", value: "30" },
      { label: "Clients corporate", value: "10" },
    ],
    features: [
      "Tout du Standard",
      "Clients corporate & contrats",
      "Automatisation",
      "Notifications avancées",
      "IA analytique",
      "Analytics avancés",
      "Support prioritaire",
    ],
    cta: "Essayer gratuitement",
  }),
  buildPlan(OrganizationType.TRAINING_CENTER, {
    slug: "ultimate",
    name: "Ultimate",
    tagline: "La plateforme complète",
    limits: [
      { label: "Apprenants", value: "Illimité" },
      { label: "Formations", value: "Illimité" },
      { label: "Formateurs", value: "Illimité" },
      { label: "Sites", value: "Illimité" },
    ],
    features: [
      "Tout du Pro",
      "IA avancée (rapports, insights)",
      "Certificats & vérification",
      "Compétences & suivi",
      "Multi-sites complet",
      "Analytics financiers avancés",
      "Support dédié",
    ],
    cta: "Essayer gratuitement",
  }),
  buildPlan(OrganizationType.TRAINING_CENTER, {
    slug: "custom",
    name: "Custom",
    tagline: "Pour les grands réseaux",
    aiCredits: 0,
    limits: [
      { label: "Apprenants", value: "Personnalisé" },
      { label: "Sites", value: "Personnalisé" },
      { label: "IA", value: "Personnalisé" },
      { label: "Déploiement", value: "Personnalisé" },
    ],
    features: [
      "Tout du Ultimate",
      "Déploiement sur mesure",
      "IA personnalisée",
      "SLA garanti",
      "Intégrations sur mesure",
      "Formation dédiée",
      "Account manager",
    ],
    cta: "Contacter l'équipe",
  }),
];

// ─── Helpers ─────────────────────────────────────────────────

export function getOrgPricingData(orgType: OrgTypeSlug): OrgPricingData | undefined {
  return orgTypes.find((o) => o.orgType === orgType);
}

// ─── Organization Types ───────────────────────────────────────

export const orgTypes: OrgPricingData[] = [
  {
    orgType: "private_school",
    label: "École privée",
    description: "Gestion scolaire complète",
    icon: "\u{1F3EB}",
    plans: privateSchoolPlans,
  },
  {
    orgType: "support_center",
    label: "Centre de soutien",
    description: "Gestion des groupes, élèves et paiements",
    icon: "\u{1F4DA}",
    plans: supportCenterPlans,
  },
  {
    orgType: "training_center",
    label: "Centre de formation",
    description: "Gestion des formations, apprenants et formateurs",
    icon: "\u{1F393}",
    plans: trainingCenterPlans,
  },
];
