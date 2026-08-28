"use client";

import { Clock, Receipt, Users, Target } from "lucide-react";
import type { LandingProps } from "./i18n-props";
import { Counter, Reveal } from "./motion";

const metricIcons = [Clock, Receipt, Users, Target];

function parseValue(value: string): number {
  return Number(value.replace(/[^\d]/g, "")) || 0;
}

export default function Business({ lang, dict }: LandingProps) {
  const b = dict.business;

  return (
    <section className="bg-zinc-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
              {b.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              {b.title}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-zinc-600">{b.subtitle}</p>
            <div className="mt-8 space-y-4">
              {b.bullets.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <span className="text-sm text-zinc-700">{item}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-4">
            {b.metrics.map((m, i) => {
              const Icon = metricIcons[i] ?? Clock;
              return (
                <Reveal key={m.label} delay={i * 120}>
                  <div className="rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:shadow-lg hover:shadow-zinc-200/50">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100">
                      <Icon className="h-4.5 w-4.5 text-zinc-600" />
                    </div>
                    <p className="text-2xl font-bold text-zinc-900">
                      <Counter to={parseValue(m.value)} lang={lang} />
                      {m.unit && <span className="ml-1 text-sm font-medium text-zinc-500">{m.unit}</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">{m.label}</p>
                    <p className={`mt-2 text-xs font-medium ${m.change.startsWith("-") ? "text-amber-600" : "text-emerald-600"}`}>
                      {m.change}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}