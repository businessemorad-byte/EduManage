import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function PublicNotFound({
  params,
}: PageProps<"/[lang]">) {
  const { lang } = (await params) ?? {};
  const locale = isLocale(lang) ? lang : "fr";
  const dict = getDictionary(locale);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <GraduationCap className="h-12 w-12 text-brand-600" strokeWidth={2} />
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
        {dict.notFound.title}
      </h1>
      <p className="max-w-md text-zinc-500">{dict.notFound.text}</p>
      <Link
        href={`/${locale}`}
        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
      >
        {dict.notFound.backHome}
      </Link>
    </div>
  );
}