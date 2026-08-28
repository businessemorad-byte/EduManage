"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { orgTypes } from "@/lib/pricing-plans";
import type { OrgPricingData, PlanCard } from "@/lib/pricing-plans";
import { localizedLink } from "@/lib/i18n/config";
import type { DictSection } from "./i18n-props";

type PricingPreviewProps = {
  lang: string;
  dict: DictSection<"pricingSection">;
  variant?: "section" | "page";
};

const localeTag = (lang: string) => (lang === "fr" ? "fr-FR" : "en-US");

export default function PricingPreview({ lang, dict, variant = "section" }: PricingPreviewProps) {
  const [selected, setSelected] = useState<OrgPricingData>(orgTypes[0]);
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const p = dict;
  const isPage = variant === "page";

  return (
    <section className={`${isPage ? "py-16 sm:py-20" : "bg-zinc-50 py-20 sm:py-24"}`} id="tarifs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {!isPage && (
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
              {p.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              {p.title}
            </h2>
            <p className="mt-4 text-lg text-zinc-600">{p.subtitle}</p>
          </div>
        )}

        {/* Organization Type Selector */}
        <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
          {orgTypes.map((org) => {
            const copy = p.orgTypes[org.orgType];
            return (
              <button
                key={org.orgType}
                onClick={() => setSelected(org)}
                className={`rounded-xl border-2 px-4 py-4 text-left transition-all ${
                  selected.orgType === org.orgType
                    ? "border-brand-600 bg-white shadow-lg shadow-brand-100/50"
                    : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md"
                }`}
              >
                <span className="text-2xl">{org.icon}</span>
                <p className="mt-2 text-sm font-semibold text-zinc-900">{copy.label}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{copy.description}</p>
              </button>
            );
          })}
        </div>

        {/* Billing interval toggle */}
        <div className="mx-auto mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setInterval("monthly")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              interval === "monthly" ? "bg-brand-600 text-white" : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
            }`}
          >
            {p.monthly}
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              interval === "yearly" ? "bg-brand-600 text-white" : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
            }`}
          >
            {p.yearly}
          </button>
        </div>

        {/* First month promotion banner */}
        <div className="mx-auto mt-6 max-w-md text-center">
          <p className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm ring-1 ring-brand-200">
            <span className="font-semibold text-brand-600">{p.promo.badge}</span>{" "}
            <span className="text-zinc-600">{p.promo.note}</span>
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto mt-8 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {selected.plans.map((plan) => (
            <PricingCard
              key={`${selected.orgType}-${plan.slug}`}
              orgType={selected.orgType}
              plan={plan}
              interval={interval}
              lang={lang}
              dict={p}
            />
          ))}
        </div>

        {/* CTA */}
        {!isPage && (
          <div className="mx-auto mt-10 max-w-2xl text-center">
            <Link
              href={localizedLink("/pricing", lang as "fr" | "en")}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              {p.compareLink}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function PricingCard({
  orgType,
  plan,
  interval,
  lang,
  dict: p,
}: {
  orgType: OrgPricingData["orgType"];
  plan: PlanCard;
  interval: "monthly" | "yearly";
  lang: string;
  dict: DictSection<"pricingSection">;
}) {
  const [showAll, setShowAll] = useState(false);
  const copy = useMemo(() => p.plans[orgType][plan.slug], [p, orgType, plan.slug]);
  const badge = "badge" in copy ? copy.badge : undefined;
  const fmt = (n: number) => n.toLocaleString(localeTag(lang), { maximumFractionDigits: 2 });

  const visibleFeatures = showAll ? copy.features : copy.features.slice(0, 5);
  const showYearly = interval === "yearly" && plan.priceYearly !== null;
  const priceDisplay = showYearly
    ? plan.priceYearly !== null
      ? fmt(plan.priceYearly)
      : null
    : plan.priceMonthly !== null
      ? fmt(plan.priceMonthly)
      : null;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-5 transition-all ${
        plan.highlighted
          ? "border-brand-200 bg-white shadow-xl shadow-brand-100/50 ring-1 ring-brand-600"
          : plan.slug === "custom"
            ? "border-zinc-300 bg-gradient-to-b from-zinc-50 to-white hover:shadow-lg"
            : "border-zinc-200 bg-white hover:shadow-lg hover:shadow-zinc-200/50"
      }`}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
            {badge}
          </span>
        </div>
      )}

      {/* Plan name & tagline */}
      <h3 className="text-base font-bold text-zinc-900">{plan.name}</h3>
      <p className="mt-0.5 text-xs text-zinc-500">{copy.tagline}</p>

      {/* Price */}
      <div className="mt-4">
        {priceDisplay !== null ? (
          <>
            <span className="text-3xl font-bold tracking-tight text-zinc-900">{priceDisplay}</span>
            <span className="ml-1 text-xs text-zinc-500">
              {showYearly ? p.perYear : p.perMonth}
            </span>
            {showYearly && plan.yearlySavings > 0 && (
              <p className="mt-1 text-xs font-semibold text-green-700">
                {p.saveYearly.replace("{value}", fmt(plan.yearlySavings))}
              </p>
            )}
          </>
        ) : (
          <span className="text-2xl font-bold tracking-tight text-zinc-900">{p.surDevis}</span>
        )}
      </div>

      {/* AI allowance */}
      {plan.aiCredits !== null && (
        <div className="mt-3 rounded-lg bg-brand-50 px-3 py-2">
          <p className="text-xs font-semibold text-brand-700">
            {plan.aiCredits > 0 ? p.ai.included : p.ai.custom}
          </p>
          {plan.aiCredits > 0 && (
            <p className="mt-0.5 text-xs text-brand-600">
              {p.ai.credits.replace("{count}", fmt(plan.aiCredits))}
            </p>
          )}
        </div>
      )}

      {/* Limits */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {plan.limits.map((l, i) => (
          <div key={`${l.label}-${i}`} className="rounded-md bg-zinc-50 px-2 py-1.5 text-center">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">
              {copy.limits[i] ?? l.label}
            </p>
            <p className="text-xs font-semibold text-zinc-900">{l.value}</p>
          </div>
        ))}
      </div>

      {/* Features */}
      <ul className="mt-4 flex-1 space-y-2">
        {visibleFeatures.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-zinc-700">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
            {f}
          </li>
        ))}
      </ul>

      {/* Show more */}
      {copy.features.length > 5 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 text-left text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          {p.showMore.replace("{count}", String(copy.features.length - 5))}
        </button>
      )}

      {/* CTA */}
      <Link
        href={plan.slug === "custom" ? localizedLink("/company/contact", lang as "fr" | "en") : "/register"}
        className={`mt-5 inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
          plan.highlighted
            ? "bg-zinc-900 text-white hover:bg-zinc-800"
            : plan.slug === "custom"
              ? "border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
              : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
        }`}
      >
        {copy.cta}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}