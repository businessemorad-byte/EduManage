import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { localizedLink, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import LocaleSwitcher from "./locale-switcher";

type FooterProps = {
  lang: Locale;
  footer: Dictionary["footer"];
  common: Dictionary["common"];
};

export default function LandingFooter({ lang, footer, common }: FooterProps) {
  const link = (href: string) => localizedLink(href, lang);

  return (
    <footer className="border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href={link("/")} className="flex items-center gap-2.5">
              <GraduationCap className="h-7 w-7 text-brand-600" strokeWidth={2.2} />
              <span className="text-lg font-bold tracking-tight text-zinc-900">EduManage</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
              {footer.tagline}
            </p>
            <div className="mt-5">
              <LocaleSwitcher lang={lang} label={common.language} />
            </div>
          </div>

          {footer.columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={link(item.href)}
                      className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 border-t border-zinc-100 pt-8">
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} EduManage. {footer.bottom}
          </p>
          <p className="mt-1 text-xs text-zinc-400">{footer.madeWith}</p>
        </div>
      </div>
    </footer>
  );
}