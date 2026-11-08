export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ar";

export const hasLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

/** العربي من اليمين لليسار */
export const dirOf = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");
