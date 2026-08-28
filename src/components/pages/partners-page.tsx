import type { Locale } from "@/lib/i18n/config";
import { FeatureCard, PageHero, WideCta } from "./page-parts";

export type PartnersPageData = {
  hero: { eyebrow: string; title: string; subtitle: string };
  programs: { title: string; text: string }[];
  cta: { heading: string; text: string };
};

export default function PartnersPage({
  lang,
  page,
  contactLabel,
}: {
  lang: Locale;
  page: PartnersPageData;
  contactLabel: string;
}) {
  return (
    <div>
      <PageHero {...page.hero} />
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {page.programs.map((p) => (
              <FeatureCard key={p.title} title={p.title} text={p.text} />
            ))}
          </div>
        </div>
      </section>
      <WideCta
        lang={lang}
        heading={page.cta.heading}
        text={page.cta.text}
        primaryLabel={contactLabel}
        href="/company/contact"
      />
    </div>
  );
}