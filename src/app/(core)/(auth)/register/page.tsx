"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getPostLoginRedirect } from "@/lib/post-login-redirect";
import { orgTypes, getOrgPricingData, type OrgTypeSlug, type PlanSlug } from "@/lib/pricing-plans";

// ─── Types ──────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

interface AccountData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface OrgData {
  orgType: OrgTypeSlug | null;
  planSlug: PlanSlug | null;
  orgName: string;
}

interface FormData {
  account: AccountData;
  org: OrgData;
}

const STEPS = [
  { num: 1, label: "Compte" },
  { num: 2, label: "Organisation" },
  { num: 3, label: "Plan" },
  { num: 4, label: "Configuration" },
  { num: 5, label: "Confirmation" },
] as const;

const ORG_TYPE_FEATURES: Record<OrgTypeSlug, string[]> = {
  private_school: ["Élèves", "Parents", "Enseignants", "Notes", "Présences", "Finance"],
  support_center: ["Groupes", "Cours", "Présences", "Paiements", "Parents", "Planning"],
  training_center: ["Formations", "Apprenants", "Formateurs", "Sessions", "Présences", "Suivi"],
};

const ORG_TYPE_ICONS: Record<OrgTypeSlug, string> = {
  private_school: "\u{1F3EB}",
  support_center: "\u{1F4DA}",
  training_center: "\u{1F393}",
};

// ─── Component ──────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [data, setData] = useState<FormData>({
    account: { name: "", email: "", password: "", confirmPassword: "" },
    org: { orgType: null, planSlug: null, orgName: "" },
  });

  const selectedPlanData = useMemo(() => {
    if (!data.org.orgType || !data.org.planSlug) return null;
    const pricing = getOrgPricingData(data.org.orgType);
    return pricing?.plans.find((p) => p.slug === data.org.planSlug) ?? null;
  }, [data.org.orgType, data.org.planSlug]);

  const selectedOrgData = useMemo(() => {
    if (!data.org.orgType) return null;
    return orgTypes.find((o) => o.orgType === data.org.orgType) ?? null;
  }, [data.org.orgType]);

  function updateAccount(field: keyof AccountData, value: string) {
    setData((prev) => ({ ...prev, account: { ...prev.account, [field]: value } }));
  }

  function updateOrg(field: keyof OrgData, value: string | OrgTypeSlug | PlanSlug | null) {
    setData((prev) => ({ ...prev, org: { ...prev.org, [field]: value } }));
  }

  function validateStep1(): string | null {
    const { name, email, password, confirmPassword } = data.account;
    if (!name.trim() || name.trim().length < 2) return "Le nom doit contenir au moins 2 caractères.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Adresse e-mail invalide.";
    if (password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
    if (!/[A-Z]/.test(password)) return "Le mot de passe doit contenir au moins une lettre majuscule.";
    if (!/[0-9]/.test(password)) return "Le mot de passe doit contenir au moins un chiffre.";
    if (password !== confirmPassword) return "Les mots de passe ne correspondent pas.";
    return null;
  }

  function validateStep2(): string | null {
    if (!data.org.orgType) return "Veuillez sélectionner un type d'organisation.";
    return null;
  }

  function validateStep3(): string | null {
    if (!data.org.planSlug) return "Veuillez sélectionner un plan.";
    return null;
  }

  function validateStep4(): string | null {
    if (!data.org.orgName.trim()) return "Veuillez entrer le nom de votre organisation.";
    if (data.org.orgName.trim().length < 2) return "Le nom doit contenir au moins 2 caractères.";
    return null;
  }

  function nextStep() {
    setError("");
    let validationError: string | null = null;

    switch (step) {
      case 1: validationError = validateStep1(); break;
      case 2: validationError = validateStep2(); break;
      case 3: validationError = validateStep3(); break;
      case 4: validationError = validateStep4(); break;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    if (step < 5) setStep((step + 1) as Step);
  }

  function prevStep() {
    setError("");
    if (step > 1) setStep((step - 1) as Step);
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.account.name.trim(),
          email: data.account.email.trim(),
          password: data.account.password,
          orgType: data.org.orgType,
          planSlug: data.org.planSlug,
          orgName: data.org.orgName.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Une erreur est survenue. Veuillez réessayer.");
        return;
      }

      router.push(getPostLoginRedirect(null, result.user?.role, result.organization?.type));
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="flex min-h-screen">
      {/* Left Visual Side */}
      <div className="hidden relative w-[45%] overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 lg:flex lg:flex-col lg:justify-center lg:items-center">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />

        <div className="absolute top-20 left-16 w-64 h-64 rounded-full bg-white/5 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-24 right-12 w-80 h-80 rounded-full bg-brand-400/10 blur-3xl animate-pulse-slow animation-delay-400" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-brand-300/10 blur-2xl animate-float" />

        <div className="relative z-10 max-w-md px-8 animate-slide-in-left">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              -50% sur le 1er mois
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white leading-tight tracking-tight mb-4">
            Commencez gratuitement
          </h2>
          <p className="text-lg text-white/70 leading-relaxed mb-10">
            Évoluez quand votre organisation grandit. Sans engagement.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm animate-float" style={{ animationDelay: "0s" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-white text-sm">🚀</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Configuration en 5 minutes</div>
                <div className="text-xs text-white/50">Pas de compétences techniques requises</div>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm animate-float" style={{ animationDelay: "1s" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-white text-sm">🔒</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Données sécurisées</div>
                <div className="text-xs text-white/50">Infrastructure chiffrée et isolée</div>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm animate-float" style={{ animationDelay: "2s" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-white text-sm">💬</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Support réactif</div>
                <div className="text-xs text-white/50">Équipe dédiée pour votre réussite</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex flex-1 flex-col px-6 py-8 sm:px-12 lg:px-16 xl:px-20 overflow-y-auto">
        <div className="mx-auto w-full max-w-lg py-4">
          {/* Mobile brand */}
          <div className="mb-6 text-center lg:hidden">
            <a href="/" className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">E</span>
              EduManage
            </a>
          </div>

          {/* Desktop brand */}
          <div className="mb-6 hidden lg:block">
            <a href="/" className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">E</span>
              EduManage
            </a>
          </div>

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              {STEPS.map((s, i) => (
                <div key={s.num} className="flex items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                    step === s.num
                      ? "bg-brand-600 text-white shadow-md shadow-brand-600/25"
                      : step > s.num
                        ? "bg-brand-100 text-brand-700"
                        : "bg-zinc-100 text-zinc-400"
                  }`}>
                    {step > s.num ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      s.num
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 w-6 sm:w-10 mx-1 transition-colors duration-300 ${
                      step > s.num ? "bg-brand-300" : "bg-zinc-200"
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-500">
              Étape {step} sur {STEPS.length} — {STEPS[step - 1].label}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-scale-in">
              {error}
            </div>
          )}

          {/* Step 1: Account */}
          {step === 1 && (
            <div className="animate-fade-in-up space-y-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">Créez votre compte EduManage</h2>
                <p className="mt-1.5 text-sm text-zinc-500">
                  Commencez gratuitement et configurez votre organisation en quelques minutes.
                </p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-700">Prénom et nom</label>
                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={data.account.name}
                  onChange={(e) => updateAccount("name", e.target.value)}
                  placeholder="Jean Dupont"
                  className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700">Adresse e-mail professionnelle</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={data.account.email}
                  onChange={(e) => updateAccount("email", e.target.value)}
                  placeholder="vous@exemple.com"
                  className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700">Mot de passe</label>
                <div className="relative mt-1.5">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={data.account.password}
                    onChange={(e) => updateAccount("password", e.target.value)}
                    className="block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 pr-12 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["8+ caractères", "Une lettre majuscule", "Un chiffre"].map((req) => (
                    <span key={req} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500">
                      <svg className="h-3 w-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      {req}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700">Confirmer le mot de passe</label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={data.account.confirmPassword}
                  onChange={(e) => updateAccount("confirmPassword", e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                />
                {data.account.password && data.account.confirmPassword && data.account.password !== data.account.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-600">Les mots de passe ne correspondent pas.</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Organization Type */}
          {step === 2 && (
            <div className="animate-fade-in-up space-y-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">Quel type d&apos;organisation gérez-vous ?</h2>
                <p className="mt-1.5 text-sm text-zinc-500">
                  Nous allons adapter EduManage à votre activité.
                </p>
              </div>

              <div className="space-y-3">
                {orgTypes.map((org) => (
                  <button
                    key={org.orgType}
                    type="button"
                    onClick={() => { updateOrg("orgType", org.orgType); updateOrg("planSlug", null); }}
                    className={`w-full text-left rounded-xl border-2 p-5 transition-all duration-200 ${
                      data.org.orgType === org.orgType
                        ? "border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{ORG_TYPE_ICONS[org.orgType]}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900">{org.label}</span>
                          {data.org.orgType === org.orgType && (
                            <svg className="h-5 w-5 text-brand-600 animate-scale-in" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-zinc-500">{org.description}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {ORG_TYPE_FEATURES[org.orgType].map((f) => (
                            <span key={f} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600">
                              <svg className="h-3 w-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Plan Selection */}
          {step === 3 && data.org.orgType && (
            <div className="animate-fade-in-up space-y-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                  Choisissez votre plan
                </h2>
                <p className="mt-1.5 text-sm text-zinc-500">
                  Plans adaptés aux {selectedOrgData?.label || "votre organisation"}. -50% sur le 1er mois.
                </p>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                <p className="text-sm font-medium text-emerald-800">
                  🎉 Commencez gratuitement. Évoluez quand votre organisation grandit.
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">Sans engagement — Annulez quand vous voulez</p>
              </div>

              <div className="space-y-3">
                {getOrgPricingData(data.org.orgType)?.plans.map((plan) => {
                  const isSelected = data.org.planSlug === plan.slug;
                  const hasAI = plan.aiCredits !== null && plan.aiCredits > 0;
                  return (
                    <button
                      key={plan.slug}
                      type="button"
                      onClick={() => updateOrg("planSlug", plan.slug)}
                      className={`w-full text-left rounded-xl border-2 p-5 transition-all duration-200 ${
                        plan.highlighted
                          ? isSelected
                            ? "border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10"
                            : "border-brand-200 bg-white hover:border-brand-300 hover:shadow-sm"
                          : isSelected
                            ? "border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10"
                            : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-900">{plan.name}</span>
                            {plan.badge && (
                              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                                {plan.badge}
                              </span>
                            )}
                            {hasAI && (
                              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                IA incluse
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-zinc-500">{plan.tagline}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {plan.features.slice(0, 4).map((f) => (
                              <span key={f} className="inline-flex items-center gap-1 text-xs text-zinc-600">
                                <svg className="h-3 w-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                {f}
                              </span>
                            ))}
                          </div>
                          {hasAI && (
                            <p className="mt-2 text-xs text-purple-600 font-medium">
                              🤖 {plan.aiCredits?.toLocaleString()} crédits IA / mois
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          {plan.price ? (
                            <>
                              <span className="text-lg font-bold text-zinc-900">{plan.price}</span>
                              <span className="block text-xs text-zinc-500">{plan.priceSuffix}</span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-zinc-500">{plan.priceSuffix}</span>
                          )}
                          {isSelected && (
                            <div className="mt-2">
                              <svg className="h-5 w-5 text-brand-600 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Org Details */}
          {step === 4 && (
            <div className="animate-fade-in-up space-y-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">Parlez-nous de votre organisation</h2>
                <p className="mt-1.5 text-sm text-zinc-500">
                  Configurez votre espace en quelques secondes.
                </p>
              </div>

              <div>
                <label htmlFor="orgName" className="block text-sm font-medium text-zinc-700">
                  Nom de l&apos;organisation
                </label>
                <input
                  id="orgName"
                  type="text"
                  required
                  value={data.org.orgName}
                  onChange={(e) => updateOrg("orgName", e.target.value)}
                  placeholder={
                    data.org.orgType === "private_school"
                      ? "Ex: École Al Andalus"
                      : data.org.orgType === "training_center"
                        ? "Ex: Centre de Formation Pro"
                        : "Ex: Centre de Soutien Excelo"
                  }
                  className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                />
              </div>

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-medium text-zinc-700">Plan sélectionné</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-zinc-600">{selectedPlanData?.name} — {selectedOrgData?.label}</span>
                  <span className="text-sm font-semibold text-zinc-900">
                    {selectedPlanData?.price ? `${selectedPlanData.price} DH/mois` : selectedPlanData?.priceSuffix}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <p className="text-sm font-medium text-emerald-800">-50% sur le 1er mois</p>
                    <p className="text-xs text-emerald-600 mt-0.5">La réduction est appliquée automatiquement à votre première facture.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <div className="animate-fade-in-up space-y-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">Confirmez votre inscription</h2>
                <p className="mt-1.5 text-sm text-zinc-500">
                  Vérifiez vos informations avant de créer votre espace.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-zinc-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-zinc-900 mb-3">Votre compte</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">Nom</dt>
                      <dd className="text-sm font-medium text-zinc-900">{data.account.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">E-mail</dt>
                      <dd className="text-sm font-medium text-zinc-900">{data.account.email}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-zinc-900 mb-3">Votre organisation</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">Nom</dt>
                      <dd className="text-sm font-medium text-zinc-900">{data.org.orgName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">Type</dt>
                      <dd className="text-sm font-medium text-zinc-900">{selectedOrgData?.label}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">Plan</dt>
                      <dd className="text-sm font-medium text-zinc-900">{selectedPlanData?.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">Prix</dt>
                      <dd className="text-sm font-semibold text-zinc-900">
                        {selectedPlanData?.price ? `${selectedPlanData.price} DH / mois` : selectedPlanData?.priceSuffix}
                      </dd>
                    </div>
                    <div className="border-t border-zinc-100 pt-2 mt-2">
                      <div className="flex justify-between">
                        <dt className="text-sm text-emerald-600 font-medium">Offre</dt>
                        <dd className="text-sm font-medium text-emerald-700">-50% sur le 1er mois</dd>
                      </div>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Retour
              </button>
            )}

            <div className="flex-1" />

            {step < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-all duration-200"
              >
                Continuer
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Création en cours...
                  </>
                ) : (
                  <>
                    Créer mon espace EduManage
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Login link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-500">
              Vous avez déjà un compte ?{" "}
              <a href="/login" className="font-medium text-brand-600 hover:text-brand-700 transition-colors">
                Se connecter
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
