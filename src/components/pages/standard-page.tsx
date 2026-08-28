import type { Locale } from "@/lib/i18n/config";
import { PageHero, SectionBlock, WideCta } from "./page-parts";

export type StandardPageData = {
  hero: { eyebrow: string; title: string; subtitle: string };
  sections: { heading: string; text: string; items: string[] }[];
  cta?: { heading: string; text: string };
};

export default function StandardPage({
  lang,
  page,
  getStartedLabel,
}: {
  lang: Locale;
  page: StandardPageData;
  getStartedLabel: string;
}) {
  return (
    <div>
      <PageHero {...page.hero} />
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl space-y-14 px-4 sm:px-6 lg:px-8">
          {page.sections.map((s, i) => (
            <SectionBlock key={s.heading} index={i} {...s} />
          ))}
        </div>
      </section>
      {page.cta ? (
        <WideCta lang={lang} heading={page.cta.heading} text={page.cta.text} primaryLabel={getStartedLabel} />
      ) : null}
    </div>
  );
}