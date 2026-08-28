// ─── Locale configuration (pure module — safe for client & proxy) ───

export const SUPPORTED_LOCALES = ["fr", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

export const LOCALE_COOKIE = "edumanage_lang";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Prefix a locale-neutral internal path with the active locale.
 * External links (http…), anchors (#…) and already-prefixed paths are
 * returned as-is.
 */
export function localizedLink(href: string, lang: Locale): string {
  if (!href.startsWith("/") || href.startsWith("#")) return href;
  if (href === "/") return `/${lang}`;
  const [first, ...rest] = href.split("/");
  if (isLocale(first)) return href;
  if (!first) return `/${lang}`;
  return `/${lang}/${first}${rest.length ? `/${rest.join("/")}` : ""}`;
}

/**
 * Best-effort locale detection. Persisted cookie wins, then the
 * Accept-Language header, then the default locale.
 */
export function getBestLocale(
  cookieValue: string | undefined,
  acceptLanguage: string | undefined
): Locale {
  if (isLocale(cookieValue)) return cookieValue;
  const header = acceptLanguage ?? "";
  const tokens = header
    .split(",")
    .map((t) => t.trim().split(";")[0]!.toLowerCase())
    .map((t) => t.replace(/_/g, "-"));
  for (const token of tokens) {
    if (token === "fr" || token.startsWith("fr-")) return "fr";
    if (token === "en" || token.startsWith("en-")) return "en";
  }
  return DEFAULT_LOCALE;
}