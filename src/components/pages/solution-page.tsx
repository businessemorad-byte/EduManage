import type { Locale } from "@/lib/i18n/config";
import { ChecklistGrid, FeatureCard, PageHero, WideCta } from "./page-parts";

export type SolutionPageData = {
  hero: { eyebrow: string; title: string; subtitle: string };
  benefits: { heading: string; conds: { title: string; text: string }[] };
  features: { heading: string; items: string[] };
};

export default function SolutionPage({
  lang,
  page,
  getStartedLabel,
  closingCta,
}: {
  lang: Locale;
  page: SolutionPageData;
  getStartedLabel: string;
  closingCta: { title: string; subtitle: string };
}) {
  return (
    <div>
      <PageHero {...page.hero} />
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            {page.benefits.heading}
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {page.benefits.conds.map((c) => (
              <FeatureCard key={c.title} title={c.title} text={c.text} />
            ))}
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              {page.features.heading}
            </h2>
            <div className="mt-6">
              <ChecklistGrid items={page.features.items} />
            </div>
          </div>
        </div>
      </section>
      <WideCta
        lang={lang}
        heading={closingCta.title}
        text={closingCta.subtitle}
        primaryLabel={getStartedLabel}
      />
    </div>
  );
}