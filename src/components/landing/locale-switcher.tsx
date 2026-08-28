"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import { LOCALE_COOKIE, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";

type LocaleSwitcherProps = {
  lang: Locale;
  label?: string;
  activeClassName?: string;
  inactiveClassName?: string;
};

export default function LocaleSwitcher({
  lang,
  label,
  activeClassName = "font-semibold text-zinc-700",
  inactiveClassName = "text-zinc-400 hover:text-zinc-700",
}: LocaleSwitcherProps) {
  const pathname = usePathname();

  const otherTarget = useCallback(() => {
    const other = (SUPPORTED_LOCALES.find((l) => l !== lang) ?? "en") as Locale;
    const switched = pathname.replace(/^\/(fr|en)(\/|$)/, `/${other}$2`);
    const clean = switched.replace(/\/{2,}$/, "/");
    return clean.startsWith(`/${other}`) ? clean : `/${other}`;
  }, [pathname, lang]);

  const other = (SUPPORTED_LOCALES.find((l) => l !== lang) ?? "en") as Locale;
  const target = otherTarget();

  const remember = (next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <div
      className="inline-flex items-center gap-1 text-xs"
      role="group"
      aria-label={label}
    >
      <span className={lang === "fr" ? activeClassName : inactiveClassName}>FR</span>
      <span aria-hidden="true" className="text-zinc-300">
        /
      </span>
      <Link href={target} onClick={() => remember(other)} className={lang === "en" ? activeClassName : inactiveClassName}>
        EN
      </Link>
    </div>
  );
}