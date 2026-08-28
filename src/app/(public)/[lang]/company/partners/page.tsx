import { notFound } from "next/navigation";
import { isLocale, SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { pageMeta } from "@/lib/i18n/page-meta";
import PartnersPage from "@/components/pages/partners-page";

export const generateStaticParams = () => SUPPORTED_LOCALES.map((lang) => ({ lang }));

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return pageMeta(lang, dict.pages.partners);
}

export default async function PartnersPageRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  return <PartnersPage lang={lang} page={dict.pages.partners} contactLabel={dict.common.contactSales} />;
}