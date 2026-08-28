import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fontVariables } from "@/fonts";
import "@/app/globals.css";
import { SUPPORTED_LOCALES, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import LandingHeader from "@/components/landing/header";
import LandingFooter from "@/components/landing/footer";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    openGraph: {
      title: dict.meta.ogTitle,
      description: dict.meta.ogDescription,
      locale: lang,
      type: "website",
    },
  };
}

export default async function PublicRootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <html lang={lang} className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important;transition:none!important}`}</style>
        </noscript>
        <LandingHeader lang={lang} nav={dict.nav} common={dict.common} />
        <div className="flex-1">{children}</div>
        <LandingFooter lang={lang} footer={dict.footer} common={dict.common} />
      </body>
    </html>
  );
}