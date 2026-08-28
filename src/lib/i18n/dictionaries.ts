import type { Dictionary } from "./fr";
import { fr } from "./fr";
import { en } from "./en";
import { isLocale, type Locale } from "./config";

const dictionaries: Record<Locale, Dictionary> = { fr, en };

export type { Dictionary };
export { fr, en };

/** Resolve a full dictionary for the given locale. Falls back to French. */
export function getDictionary(locale: string | undefined | null): Dictionary {
  if (isLocale(locale)) return dictionaries[locale];
  return dictionaries.fr;
}