import type { ReactNode } from "react";
import Link from "next/link";
import { localizedLink, type Locale } from "@/lib/i18n/config";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-zinc-100 bg-zinc-50/60">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-600">{subtitle}</p>
        {children}
      </div>
    </section>
  );
}

export function SectionBlock({
  index,
  heading,
  text,
  items,
}: {
  index: number;
  heading: string;
  text: string;
  items: string[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          {String(index + 1).padStart(2, "0")}
        </p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-zinc-900">{heading}</h2>
      </div>
      <div className="lg:col-span-2">
        <p className="text-zinc-600">{text}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function SectionCards({ sections }: { sections: { heading: string; text: string }[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {sections.map((s) => (
        <div key={s.heading} className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">{s.heading}</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">{s.text}</p>
        </div>
      ))}
    </div>
  );
}

export function FeatureCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-bold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{text}</p>
    </div>
  );
}

export function ChecklistGrid({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-700">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden="true">
              <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function WideCta({
  lang,
  heading,
  text,
  primaryLabel,
  href = "/register",
}: {
  lang: Locale;
  heading: string;
  text: string;
  primaryLabel?: string;
  href?: string;
}) {
  return (
    <section className="bg-zinc-900 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{heading}</h2>
        <p className="mt-3 text-zinc-300">{text}</p>
        {primaryLabel ? (
          <Link
            href={localizedLink(href, lang)}
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            {primaryLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}