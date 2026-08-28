import { notFound } from "next/navigation";
import { isLocale, SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pageMeta } from "@/lib/i18n/page-meta";
import { PageHero, WideCta } from "@/components/pages/page-parts";
import FaqAccordion from "@/components/pages/faq-accordion";
import PricingPreview from "@/components/landing/pricing-preview";

export const generateStaticParams = () => SUPPORTED_LOCALES.map((lang) => ({ lang }));

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return pageMeta(lang, dict.pages.pricing);
}

export default async function PricingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const page = dict.pages.pricing;
  return (
    <div>
      <PageHero {...page.hero} />
      <PricingPreview lang={lang} dict={dict.pricingSection} variant="page" />
      <section className="border-t border-zinc-100 bg-zinc-50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            {page.faq.heading}
          </h2>
          <div className="mt-8">
            <FaqAccordion items={page.faq.items} />
          </div>
        </div>
      </section>
      <WideCta lang={lang} heading={dict.finalCta.title} text={dict.finalCta.subtitle} primaryLabel={dict.common.getStarted} />
    </div>
  );
}