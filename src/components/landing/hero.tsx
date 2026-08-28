import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import DashboardMockup from "./dashboard-mockup";
import type { LandingProps } from "./i18n-props";

export default function Hero({ lang, dict }: LandingProps) {
  const { hero } = dict;

  return (
    <section className="relative overflow-hidden bg-white pb-16 pt-20 sm:pb-24 sm:pt-28 lg:pb-32 lg:pt-36">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.08),transparent)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" />
            <span className="text-xs font-medium text-brand-700">{hero.badge}</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
            {hero.titleA} <span className="text-brand-600">{hero.titleHighlight}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
            {hero.subtitle}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-zinc-900/10 transition-all hover:bg-zinc-800 hover:shadow-xl hover:shadow-zinc-900/15"
            >
              {hero.ctaPrimary}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#produit"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50"
            >
              {hero.ctaSecondary}
            </a>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-5xl lg:mt-20">
          <DashboardMockup lang={lang} dict={dict} />
        </div>
      </div>
    </section>
  );
}