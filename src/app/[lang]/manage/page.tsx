import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getBookingCopy } from "@/i18n/booking";
import { getPhotos } from "@/server/photos";
import SiteHeader from "@/components/booking/SiteHeader";
import ManageBooking from "@/components/booking/ManageBooking";

export async function generateMetadata({ params }: PageProps<"/[lang]/manage">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: `${getBookingCopy(lang).manage.title} | Pearl Dental` };
}

export default async function Page({ params }: PageProps<"/[lang]/manage">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const c = getBookingCopy(lang);
  return (
    <>
      <SiteHeader lang={lang} backLabel={c.back} otherHref={`/${lang === "ar" ? "en" : "ar"}/manage`} />
      <main>
        <ManageBooking lang={lang} photos={getPhotos()} />
      </main>
    </>
  );
}
