import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "./i18n/config";

/** أي رابط بدون لغة بيتحوّل للغة المتصفح (عربي افتراضياً) */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return;

  const accept = request.headers.get("accept-language") ?? "";
  const prefersEnglish = /^en\b/i.test(accept.trim());
  const locale = prefersEnglish ? "en" : DEFAULT_LOCALE;

  request.nextUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // كل الروابط ما عدا ملفات Next الداخلية والملفات العامة (اللي فيها نقطة زي icon.svg)
  matcher: ["/((?!_next|.*\\..*).*)"],
};
