import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getBookingCopy } from "@/i18n/booking";
import SiteHeader from "@/components/booking/SiteHeader";
import ClinicSchedule from "@/components/booking/ClinicSchedule";

export async function generateMetadata({ params }: PageProps<"/[lang]/clinic">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: `${getBookingCopy(lang).clinic.title} | Pearl Dental`, robots: { index: false } };
}

export default async function Page({ params }: PageProps<"/[lang]/clinic">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const c = getBookingCopy(lang);
  return (
    <>
      <SiteHeader lang={lang} backLabel={c.back} otherHref={`/${lang === "ar" ? "en" : "ar"}/clinic`} />
      <main>
        <ClinicSchedule lang={lang} />
      </main>
    </>
  );
}
