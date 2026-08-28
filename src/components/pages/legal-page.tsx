import type { Locale } from "@/lib/i18n/config";
import { SectionCards, PageHero } from "./page-parts";

export type LegalPageData = {
  hero: { eyebrow: string; title: string; subtitle: string };
  sections: { heading: string; text: string }[];
};

export default function LegalPage({ page }: { lang?: Locale; page: LegalPageData }) {
  return (
    <div>
      <PageHero {...page.hero} />
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionCards sections={page.sections} />
        </div>
      </section>
    </div>
  );
}