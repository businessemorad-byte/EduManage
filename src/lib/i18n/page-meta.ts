import type { Metadata } from "next";
import type { Locale } from "./config";

export type PageSeo = { title: string; description: string };

export function pageMeta(lang: Locale, seo: PageSeo): Metadata {
  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.title,
      description: seo.description,
      locale: lang,
      type: "website",
    },
  };
}