import { notFound } from "next/navigation";
import { isLocale, SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pageMeta } from "@/lib/i18n/page-meta";
import { PageHero, FeatureCard } from "@/components/pages/page-parts";
import ContactForm from "@/components/pages/contact-form";

export const generateStaticParams = () => SUPPORTED_LOCALES.map((lang) => ({ lang }));

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return pageMeta(lang, dict.pages.contact);
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const page = dict.pages.contact;
  return (
    <div>
      <PageHero {...page.hero} />
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {page.channels.map((c) => (
              <FeatureCard key={c.title} title={c.title} text={c.desc} />
            ))}
          </div>
          <p className="mt-6 text-sm text-zinc-500">{page.note}</p>
        </div>
      </section>
      <section className="bg-zinc-50 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <ContactForm labels={page.formLabels} lang={lang} />
        </div>
      </section>
    </div>
  );
}