import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { LogoMark } from "@/components/landing/Decor";

/** هيدر بسيط لصفحات الحجز والإدارة */
export default function SiteHeader({ lang, backLabel, otherHref }: { lang: Locale; backLabel: string; otherHref: string }) {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href={`/${lang}`} className="flex items-center gap-2.5 font-bold">
          <LogoMark className="h-9 w-9" />
          <span>Pearl Dental</span>
        </Link>
        <Link href={`/${lang}`} className="ms-auto text-sm text-muted hover:text-ink">
          {backLabel}
        </Link>
        <Link
          href={otherHref}
          hrefLang={lang === "ar" ? "en" : "ar"}
          className="grid h-9 min-w-9 place-items-center rounded-full border border-line px-2 text-sm font-semibold hover:border-ink"
        >
          {lang === "ar" ? "EN" : "ع"}
        </Link>
      </div>
    </header>
  );
}
