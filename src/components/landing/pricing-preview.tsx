"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { orgTypes } from "@/lib/pricing-plans";
import type { OrgPricingData, PlanCard } from "@/lib/pricing-plans";

export default function PricingPreview() {
  const [selected, setSelected] = useState<OrgPricingData>(orgTypes[0]);
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");

  return (
    <section className="bg-zinc-50 py-20 sm:py-24" id="tarifs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
            Tarifs
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Quelle organisation gérez-vous ?
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Choisissez votre type pour découvrir les plans adaptés.
          </p>
        </div>

        {/* Organization Type Selector */}
        <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
          {orgTypes.map((org) => (
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
              <p className="mt-2 text-sm font-semibold text-zinc-900">{org.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{org.description}</p>
            </button>
          ))}
        </div>

        {/* Billing interval toggle */}
        <div className="mx-auto mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setInterval("monthly")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              interval === "monthly" ? "bg-brand-600 text-white" : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              interval === "yearly" ? "bg-brand-600 text-white" : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
            }`}
          >
            Annuel
          </button>
        </div>

        {/* First month promotion banner */}
        <div className="mx-auto mt-6 max-w-md text-center">
          <p className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm ring-1 ring-brand-200">
            <span className="font-semibold text-brand-600">-50% sur le 1er mois</span>{" "}
            <span className="text-zinc-600">sur tous les plans · Sans engagement</span>
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto mt-8 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {selected.plans.map((plan) => (
            <PricingCard key={`${selected.orgType}-${plan.slug}`} plan={plan} interval={interval} />
          ))}
        </div>

        {/* CTA */}
        <div className="mx-auto mt-10 max-w-2xl text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Comparer les fonctionnalités
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PricingCard({ plan, interval }: { plan: PlanCard; interval: "monthly" | "yearly" }) {
  const [showAll, setShowAll] = useState(false);
  const visibleFeatures = showAll ? plan.features : plan.features.slice(0, 5);
  const showYearly = interval === "yearly" && plan.priceYearly !== null;

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
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
            {plan.badge}
          </span>
        </div>
      )}

      {/* Plan name & tagline */}
      <h3 className="text-base font-bold text-zinc-900">{plan.name}</h3>
      <p className="mt-0.5 text-xs text-zinc-500">{plan.tagline}</p>

      {/* Price */}
      <div className="mt-4">
        {plan.price !== null ? (
          <>
            <span className="text-3xl font-bold tracking-tight text-zinc-900">
              {showYearly ? plan.priceYearly!.toLocaleString("fr-FR") : plan.price}
            </span>
            <span className="ml-1 text-xs text-zinc-500">
              {showYearly ? "DH / an" : plan.priceSuffix}
            </span>
            {showYearly && plan.yearlySavings > 0 && (
              <p className="mt-1 text-xs font-semibold text-green-700">
                Économisez {plan.yearlySavings.toLocaleString("fr-FR")} DH vs mensuel
              </p>
            )}
          </>
        ) : (
          <span className="text-2xl font-bold tracking-tight text-zinc-900">
            {plan.priceSuffix}
          </span>
        )}
      </div>

      {/* AI allowance */}
      {plan.aiCredits !== null && (
        <div className="mt-3 rounded-lg bg-brand-50 px-3 py-2">
          <p className="text-xs font-semibold text-brand-700">
            {plan.aiCredits > 0 ? "IA incluse" : "IA personnalisée"}
          </p>
          {plan.aiCredits > 0 && (
            <p className="mt-0.5 text-xs text-brand-600">
              {plan.aiCredits.toLocaleString("fr-FR")} crédits / mois
            </p>
          )}
        </div>
      )}

      {/* Limits */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {plan.limits.map((l) => (
          <div key={l.label} className="rounded-md bg-zinc-50 px-2 py-1.5 text-center">
            <p className="text-[10px] uppercase tracking-wide text-zinc-400">{l.label}</p>
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
      {plan.features.length > 5 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-2 text-left text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          +{plan.features.length - 5} autres fonctionnalités
        </button>
      )}

      {/* CTA */}
      <Link
        href={plan.slug === "custom" ? "/contact" : "/register"}
        className={`mt-5 inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
          plan.highlighted
            ? "bg-zinc-900 text-white hover:bg-zinc-800"
            : plan.slug === "custom"
              ? "border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
              : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
        }`}
      >
        {plan.cta}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
