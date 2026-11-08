import { CLINIC_TZ } from "./clinic";
import type { Locale } from "@/i18n/config";
import { intlLocale } from "@/i18n/booking";

/** "2026-11-09" → "الاثنين 9 نوفمبر" */
export function formatDay(date: string, locale: Locale, style: "long" | "short" = "long") {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: "UTC",
    weekday: style,
    day: "numeric",
    month: style === "long" ? "long" : "short",
  }).format(new Date(`${date}T12:00:00Z`));
}

/** ISO → "2:00 م" بتوقيت العيادة */
export function formatTime(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: CLINIC_TZ,
    hour: "numeric",
    minute: "2-digit",
    // بالإنجليزي "9:00 am" بدل "09:00"
    hour12: locale === "en" ? true : undefined,
  }).format(new Date(iso));
}

export function formatPrice(price: number, locale: Locale) {
  return locale === "ar" ? `${price} ₪` : `₪${price}`;
}

/** الأحرف الأولى من الاسم بدون "د." */
export const initials = (name: string) =>
  name
    .replace(/^(د\.|Dr\.)\s*/, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.replace(/^ال/, "")[0])
    .join("");
