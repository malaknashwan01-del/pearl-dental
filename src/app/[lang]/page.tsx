import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getPhotos } from "@/server/photos";
import Landing from "@/components/landing/Landing";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <Landing lang={lang} photos={getPhotos()} />;
}
