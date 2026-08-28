import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

export type LandingProps = {
  lang: Locale;
  dict: Dictionary;
};

export type DictSection<K extends keyof Dictionary> = Dictionary[K];