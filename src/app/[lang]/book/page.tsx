import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getBookingCopy } from "@/i18n/booking";
import { getPhotos } from "@/server/photos";
import SiteHeader from "@/components/booking/SiteHeader";
import BookingFlow from "@/components/booking/BookingFlow";

export async function generateMetadata({ params }: PageProps<"/[lang]/book">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: `${getBookingCopy(lang).title} | Pearl Dental` };
}

export default async function BookPage({ params }: PageProps<"/[lang]/book">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const c = getBookingCopy(lang);
  return (
    <>
      <SiteHeader lang={lang} backLabel={c.back} otherHref={`/${lang === "ar" ? "en" : "ar"}/book`} />
      <main>
        {/* الصفحة بتقرأ ?service و ?doctor من الرابط، فلازم Suspense */}
        <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-16 text-muted">…</div>}>
          <BookingFlow lang={lang} photos={getPhotos()} />
        </Suspense>
      </main>
    </>
  );
}
