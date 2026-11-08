import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "@fontsource-variable/alexandria";
import "@fontsource/aref-ruqaa/arabic-700.css";
import "@fontsource/pinyon-script/400.css";
import "../globals.css";
import { LOCALES, dirOf, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { meta } = getDictionary(lang);
  return {
    title: meta.title,
    description: meta.description,
    icons: { icon: "/icon.svg" },
    alternates: { languages: { ar: "/ar", en: "/en" } },
    openGraph: { title: meta.title, description: meta.description, type: "website" },
  };
}

export const viewport: Viewport = { themeColor: "#F4FAFF" };

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html lang={lang} dir={dirOf(lang)}>
      <body>{children}</body>
    </html>
  );
}
