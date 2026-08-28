import type { Locale } from "@/lib/i18n/config";
import { FeatureCard, PageHero, WideCta } from "./page-parts";

export type AboutPageData = {
  hero: { eyebrow: string; title: string; subtitle: string };
  story: { heading: string; conds: string[] };
  values: { heading: string; items: { title: string; text: string }[] };
};

export default function AboutPage({
  lang,
  page,
  getStartedLabel,
  closingCta,
}: {
  lang: Locale;
  page: AboutPageData;
  getStartedLabel: string;
  closingCta: { title: string; subtitle: string };
}) {
  return (
    <div>
      <PageHero {...page.hero} />
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            {page.story.heading}
          </h2>
          <div className="mt-6 space-y-4 text-zinc-600">
            {page.story.conds.map((p, i) => (
              <p key={i} className="leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-zinc-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            {page.values.heading}
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {page.values.items.map((v) => (
              <FeatureCard key={v.title} title={v.title} text={v.text} />
            ))}
          </div>
        </div>
      </section>
      <WideCta lang={lang} heading={closingCta.title} text={closingCta.subtitle} primaryLabel={getStartedLabel} />
    </div>
  );
}