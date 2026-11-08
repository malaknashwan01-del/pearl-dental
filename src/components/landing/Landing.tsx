"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { DOCTORS, SERVICES, type Doctor } from "@/lib/clinic";
import { formatDay, formatTime } from "@/lib/format";
import { intlLocale } from "@/i18n/booking";
import { clinicParts } from "@/lib/schedule";
import DoctorPhoto from "@/components/booking/DoctorPhoto";
import { Arrow, LogoMark, Phone } from "./Decor";

type Photos = Record<string, string>;
type NextFree = Record<string, { date: string; time: string; start: string } | null>;

/* ---------- حالة العيادة الآن (مفتوح / مغلق) ---------- */

const OPEN = 9 * 60;
const CLOSE = 20 * 60;
const FRIDAY = 5;

function useOpenStatus(lang: Locale, t: Dictionary) {
  const [label, setLabel] = useState<{ open: boolean; text: string } | null>(null);
  useEffect(() => {
    const update = () => {
      const now = clinicParts(new Date());
      const fmt = (h: number) =>
        new Intl.DateTimeFormat(intlLocale(lang), { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(
          new Date(Date.UTC(2026, 0, 1, h))
        );
      const open = now.weekday !== FRIDAY && now.minutes >= OPEN && now.minutes < CLOSE;
      if (open) return setLabel({ open, text: t.status.open(fmt(20)) });
      // متى بنفتح؟ اليوم الصبح، أو أول يوم مش جمعة
      let day = now.weekday;
      let offset = 0;
      if (now.minutes >= OPEN || day === FRIDAY) {
        do {
          day = ((day + 1) % 7) as typeof day;
          offset++;
        } while (day === FRIDAY);
      }
      const dayName =
        offset === 0
          ? ""
          : offset === 1
            ? t.status.tomorrow
            : new Intl.DateTimeFormat(intlLocale(lang), { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 0, 4 + day)));
      setLabel({ open, text: t.status.closed(`${dayName} ${fmt(9)}`.trim()) });
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [lang, t]);
  return label;
}

/* ---------- الهيدر ---------- */

function Header({ lang, t }: { lang: Locale; t: Dictionary }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const other = lang === "ar" ? "en" : "ar";
  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 transition-[background-color,box-shadow] duration-300 ${
        scrolled ? "bg-paper/92 shadow-[0_1px_0_var(--color-line)] backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-8" aria-label={t.nav.menu}>
        <a href="#top" className="flex items-center gap-2.5 font-bold" aria-label={t.nav.home}>
          <LogoMark className="h-9 w-9" />
          <span className="text-[17px]">Pearl Dental</span>
        </a>
        <div className="hidden items-center gap-7 text-[15px] text-muted lg:flex">
          <a href="#services" className="hover:text-ink">{t.nav.services}</a>
          <a href="#doctors" className="hover:text-ink">{t.nav.doctors}</a>
          <a href="#how" className="hover:text-ink">{t.nav.how}</a>
          <a href="#contact" className="hover:text-ink">{t.nav.contact}</a>
        </div>
        <div className="ms-auto flex items-center gap-2.5">
          <Link
            href={`/${other}`}
            hrefLang={other}
            aria-label={t.nav.switchLabel}
            className="grid h-10 min-w-10 place-items-center rounded-full border border-line bg-card px-2 text-sm font-semibold hover:border-ink"
          >
            {t.nav.switchTo}
          </Link>
          <Link
            href={`/${lang}/book`}
            className="rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-dark"
          >
            {t.nav.cta}
          </Link>
        </div>
      </nav>
    </header>
  );
}

/* ---------- الواجهة ---------- */

function Hero({ lang, t, photo }: { lang: Locale; t: Dictionary; photo?: string }) {
  const status = useOpenStatus(lang, t);
  return (
    <section id="top" className="relative pt-16" data-tooth>
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-8 sm:px-8 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-16">
        <div className="relative z-20">
          <p
            className={`mb-6 inline-flex h-8 items-center gap-2 rounded-full border border-line bg-card px-3.5 text-[13px] font-medium transition-opacity duration-500 ${
              status ? "opacity-100" : "opacity-0"
            }`}
            aria-live="polite"
          >
            <span className={`h-2 w-2 rounded-full ${status?.open ? "bg-ok" : "bg-warn"}`} />
            {status?.text ?? " "}
          </p>
          <h1 className="text-[clamp(42px,5.2vw,80px)] font-bold leading-[1.08] tracking-tight rtl:leading-[1.28]">
            <span className="hero-line">
              <span>{t.hero.line1}</span>
            </span>
            <span className="hero-line">
              <span className="text-blue">{t.hero.line2}</span>
            </span>
          </h1>
          <p className="reveal in mt-6 max-w-[34rem] text-[clamp(16px,1.35vw,19px)] leading-relaxed text-muted" style={{ "--delay": "350ms" } as React.CSSProperties}>
            {t.hero.lead}
          </p>
          <div className="reveal in mt-9 flex flex-wrap items-center gap-3" style={{ "--delay": "480ms" } as React.CSSProperties}>
            <Link
              href={`/${lang}/book`}
              className="group inline-flex items-center gap-2.5 rounded-full bg-blue px-7 py-3.5 font-semibold text-white transition-colors hover:bg-blue-dark"
            >
              {t.hero.cta}
              <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
            </Link>
            <a
              href={`tel:${t.footer.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-6 py-3.5 font-semibold hover:border-ink"
            >
              <Phone />
              {t.hero.call}
            </a>
          </div>
          <ul className="reveal in mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted" style={{ "--delay": "600ms" } as React.CSSProperties}>
            {t.hero.facts.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-pink" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="wipe relative aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-sky max-lg:mx-auto max-lg:max-w-md lg:max-h-[78vh] lg:justify-self-end">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={t.hero.photoAlt} className="h-full w-full object-cover" fetchPriority="high" />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(160deg,#eef5fd_0%,#dbe9f8_100%)]" aria-hidden="true">
              <div className="absolute inset-x-0 bottom-0 h-[9%] bg-[repeating-linear-gradient(-28deg,#ffffff_0_14px,#1f5fd6_14px_20px,#ffffff_20px_30px,#e8588c_30px_33px)] opacity-70" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- شريط الصور المتحرك ---------- */

function GalleryBand({ t, photos }: { t: Dictionary; photos: { src: string; caption: string }[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const hover = useRef(false);

  useEffect(() => {
    const row = rowRef.current;
    if (!row || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rtl = document.documentElement.dir === "rtl";
    let off = 0;
    let speed = 1;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      // بيبطّئ لما الماوس فوقه، وبيرجع لسرعته بنعومة
      speed += ((hover.current ? 0.18 : 1) - speed) * Math.min(1, dt * 3);
      const loop = row.scrollWidth / 2;
      off = (off + 48 * speed * dt) % loop;
      row.style.transform = `translate3d(${rtl ? off : -off}px,0,0)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const items = [...photos, ...photos];
  return (
    <div
      className="overflow-hidden border-y border-line bg-card py-3"
      aria-label={t.gallery.label}
      role="region"
      onMouseEnter={() => (hover.current = true)}
      onMouseLeave={() => (hover.current = false)}
    >
      <div ref={rowRef} className="band-row">
        {items.map((p, i) => (
          <figure key={i} className="relative h-[200px] w-[200px] shrink-0 overflow-hidden rounded-2xl sm:h-[260px] sm:w-[260px]" aria-hidden={i >= photos.length}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt={i < photos.length ? p.caption : ""} loading="lazy" className="h-full w-full object-cover" draggable={false} />
            <figcaption className="absolute bottom-2.5 start-2.5 rounded-full bg-card/90 px-3 py-1 text-xs font-medium backdrop-blur">
              {p.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ---------- العلاجات ---------- */

function Services({ lang, t }: { lang: Locale; t: Dictionary }) {
  return (
    <section id="services" className="relative scroll-mt-16 py-24 sm:py-32" data-tooth>
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start lg:pb-[38vh]">
          <p className="reveal text-sm font-semibold text-blue">{t.services.eyebrow}</p>
          <h2 className="reveal mt-3 text-[clamp(32px,3.6vw,54px)] font-bold leading-tight tracking-tight rtl:leading-snug" style={{ "--delay": "80ms" } as React.CSSProperties}>
            {t.services.title}
          </h2>
          <p className="reveal mt-5 max-w-md leading-relaxed text-muted" style={{ "--delay": "160ms" } as React.CSSProperties}>
            {t.services.lead}
          </p>
        </div>

        <ol className="divide-y divide-line border-y border-line">
          {SERVICES.map((s, i) => (
            <li key={s.id} className="reveal" style={{ "--delay": `${i * 50}ms` } as React.CSSProperties}>
              <Link
                href={`/${lang}/book?service=${s.id}`}
                className="group grid grid-cols-[2.25rem_1fr_auto] items-start gap-x-4 gap-y-1 py-6 transition-colors hover:bg-card sm:grid-cols-[3rem_1fr_auto] sm:px-3"
              >
                <span className="pt-1 text-sm tabular-nums text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className="block text-lg font-semibold sm:text-xl">{s.name[lang]}</span>
                  <span className="mt-1.5 block max-w-xl text-[15px] leading-relaxed text-muted">{s.blurb[lang]}</span>
                </span>
                <span className="flex flex-col items-end gap-2 pt-1 text-end">
                  <span className="font-semibold">{s.priceFrom === 0 ? t.services.free : t.services.from(s.priceFrom)}</span>
                  <span className="text-sm text-muted">{t.services.minutes(s.minutes)}</span>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-blue opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    {t.services.book} <Arrow className="h-3.5 w-3.5" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- الأطباء ---------- */

const WEEK_ORDER = [6, 0, 1, 2, 3, 4] as const;

function dayNames(doctor: Doctor, lang: Locale) {
  const fmt = new Intl.DateTimeFormat(intlLocale(lang), { weekday: "short", timeZone: "UTC" });
  // 2026-01-04 أحد
  return WEEK_ORDER.filter((d) => doctor.hours[d]).map((d) => fmt.format(new Date(Date.UTC(2026, 0, 4 + d))));
}

function Doctors({ lang, t, photos }: { lang: Locale; t: Dictionary; photos: Photos }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [next, setNext] = useState<NextFree | null>(null);
  const count = DOCTORS.length + 1;

  // أقرب موعد فاضي لكل طبيب، من قاعدة البيانات
  useEffect(() => {
    let alive = true;
    fetch("/api/doctors/next")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && d && setNext(d.next))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // أي كرت ظاهر الآن → النقطة الفعالة
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.children) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(cards.indexOf(visible.target as HTMLElement));
      },
      { root: track, threshold: [0.6, 0.9] }
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  // السحب بالماوس (اللمس بيشتغل لحاله)
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let startX = 0;
    let startScroll = 0;
    let down = false;
    let moved = false;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true;
      moved = false;
      startX = e.clientX;
      startScroll = track.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) {
        moved = true;
        track.classList.add("dragging");
      }
      if (moved) track.scrollLeft = startScroll - dx;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      if (moved) {
        // بعد السحب، الكبسة ما بتفتح الرابط
        const block = (ev: Event) => ev.preventDefault();
        track.addEventListener("click", block, { capture: true, once: true });
        setTimeout(() => track.removeEventListener("click", block, { capture: true }), 0);
      }
      track.classList.remove("dragging");
    };
    track.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      track.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const goTo = (i: number) => {
    const track = trackRef.current;
    const card = track?.children[Math.max(0, Math.min(count - 1, i))] as HTMLElement | undefined;
    if (!track || !card) return;
    const rtl = document.documentElement.dir === "rtl";
    const pad = parseFloat(getComputedStyle(track).paddingInlineStart) || 0;
    const left = rtl
      ? card.offsetLeft + card.offsetWidth - track.clientWidth + pad
      : card.offsetLeft - pad;
    track.scrollTo({ left, behavior: "smooth" });
  };

  const navBtn =
    "grid h-12 w-12 place-items-center rounded-full border border-line bg-card transition hover:border-ink disabled:opacity-35 disabled:hover:border-line";

  return (
    <section id="doctors" className="relative scroll-mt-16 bg-card py-24 sm:py-32" data-tooth>
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-4 sm:px-8">
        <div className="max-w-xl">
          <p className="reveal text-sm font-semibold text-blue">{t.doctors.eyebrow}</p>
          <h2 className="reveal mt-3 text-[clamp(32px,3.6vw,54px)] font-bold leading-tight tracking-tight rtl:leading-snug" style={{ "--delay": "80ms" } as React.CSSProperties}>
            {t.doctors.title}
          </h2>
          <p className="reveal mt-4 leading-relaxed text-muted" style={{ "--delay": "160ms" } as React.CSSProperties}>
            {t.doctors.lead}
          </p>
        </div>
        <div className="reveal flex gap-2.5" style={{ "--delay": "200ms" } as React.CSSProperties}>
          <button type="button" className={navBtn} onClick={() => goTo(active - 1)} disabled={active === 0} aria-label={t.doctors.prev}>
            <Arrow className="h-5 w-5 rotate-180" />
          </button>
          <button type="button" className={navBtn} onClick={() => goTo(active + 1)} disabled={active >= count - 1} aria-label={t.doctors.nextDoc}>
            <Arrow className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="doc-track mt-12 pb-4 [--pad:16px] sm:[--pad:32px] xl:[--pad:calc((100vw-80rem)/2+32px)]"
        onKeyDown={(e) => {
          const rtl = document.documentElement.dir === "rtl";
          if (e.key === "ArrowRight") goTo(active + (rtl ? -1 : 1));
          if (e.key === "ArrowLeft") goTo(active + (rtl ? 1 : -1));
        }}
      >
        {DOCTORS.map((d, i) => {
          const free = next?.[d.slug];
          return (
            <article
              key={d.slug}
              className="reveal group flex w-[78vw] max-w-[340px] flex-col sm:w-[340px]"
              style={{ "--delay": `${i * 80}ms` } as React.CSSProperties}
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-aqua">
                <DoctorPhoto
                  src={photos[d.photo]}
                  name={d.name[lang]}
                  className="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <span className="absolute start-3 top-3 rounded-full bg-card/92 px-3 py-1 text-xs font-medium backdrop-blur">
                  {t.doctors.years(d.years)}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-semibold">{d.name[lang]}</h3>
              <p className="mt-0.5 text-[15px] font-medium text-blue">{d.role[lang]}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{d.bio[lang]}</p>
              <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t.doctors.days}</dt>
                  <dd className="text-end">{dayNames(d, lang).join("، ")}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t.doctors.next}</dt>
                  <dd className={`text-end font-medium ${next ? "" : "animate-pulse text-muted"}`}>
                    {next === null
                      ? "···"
                      : free
                        ? `${formatDay(free.date, lang, "short")} · ${formatTime(free.start, lang)}`
                        : t.doctors.nextNone}
                  </dd>
                </div>
              </dl>
              <Link
                href={`/${lang}/book?doctor=${d.slug}`}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-ink px-5 py-3 text-[15px] font-semibold transition-colors hover:bg-ink hover:text-white"
              >
                {t.doctors.book(d.name[lang])}
              </Link>
            </article>
          );
        })}

        <Link
          href={`/${lang}/book`}
          className="reveal flex w-[78vw] max-w-[340px] flex-col justify-end rounded-[22px] bg-blue p-7 text-white transition-colors hover:bg-blue-dark sm:w-[340px]"
          style={{ "--delay": `${DOCTORS.length * 80}ms` } as React.CSSProperties}
        >
          <span className="text-2xl font-semibold leading-snug">{t.doctors.any}</span>
          <Arrow className="mt-6 h-6 w-6" />
        </Link>
      </div>

      <div className="mt-6 flex justify-center gap-2" role="tablist" aria-label={t.doctors.title}>
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={i < DOCTORS.length ? DOCTORS[i]!.name[lang] : t.doctors.any}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all ${i === active ? "w-6 bg-ink" : "w-2 bg-line hover:bg-muted"}`}
          />
        ))}
      </div>
    </section>
  );
}

/* ---------- طريقة الحجز ---------- */

function How({ lang, t }: { lang: Locale; t: Dictionary }) {
  return (
    <section id="how" className="relative scroll-mt-16 overflow-hidden bg-night py-24 text-white sm:py-32" data-tooth data-theme="dark">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-8 lg:grid-cols-2">
        <div>
          <p className="reveal text-sm font-semibold text-[#8fb6f5]">{t.how.eyebrow}</p>
          <h2 className="reveal mt-3 text-[clamp(32px,3.6vw,54px)] font-bold leading-tight tracking-tight rtl:leading-snug" style={{ "--delay": "80ms" } as React.CSSProperties}>
            {t.how.title}
          </h2>
          <ol className="mt-12 space-y-8">
            {t.how.steps.map((s, i) => (
              <li key={s.title} className="reveal grid grid-cols-[3.5rem_1fr] gap-4" style={{ "--delay": `${160 + i * 90}ms` } as React.CSSProperties}>
                <span className="text-4xl font-bold tabular-nums leading-none text-white/25">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className="block text-lg font-semibold">{s.title}</span>
                  <span className="mt-1.5 block leading-relaxed text-white/65">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="reveal mt-12 flex flex-wrap items-center gap-x-6 gap-y-4" style={{ "--delay": "450ms" } as React.CSSProperties}>
            <Link href={`/${lang}/book`} className="inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 font-semibold text-night hover:bg-sky">
              {t.how.cta} <Arrow />
            </Link>
            <Link href={`/${lang}/manage`} className="text-[15px] text-white/75 underline-offset-4 hover:text-white hover:underline">
              {t.how.manage}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- التواصل ---------- */

function Footer({ lang, t }: { lang: Locale; t: Dictionary }) {
  const tel = t.footer.phone.replace(/\s/g, "");
  return (
    <section id="contact" className="relative scroll-mt-16 bg-paper pt-24 sm:pt-32" data-tooth>
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-12">
          <h2 className="reveal max-w-xl text-[clamp(32px,4vw,60px)] font-bold leading-tight tracking-tight rtl:leading-snug">{t.footer.title}</h2>
          <Link href={`/${lang}/book`} className="reveal inline-flex items-center gap-2.5 rounded-full bg-blue px-7 py-3.5 font-semibold text-white hover:bg-blue-dark">
            {t.nav.cta} <Arrow />
          </Link>
        </div>
        <div className="grid gap-10 py-12 text-[15px] sm:grid-cols-2 lg:grid-cols-4">
          <div className="reveal">
            <h3 className="text-sm font-semibold text-muted">{t.footer.visit}</h3>
            <p className="mt-3 leading-relaxed">{t.footer.address}</p>
          </div>
          <div className="reveal" style={{ "--delay": "60ms" } as React.CSSProperties}>
            <h3 className="text-sm font-semibold text-muted">{t.footer.hours}</h3>
            <dl className="mt-3 space-y-1.5">
              {t.footer.days.map(([d, h]) => (
                <div key={d} className="flex justify-between gap-4">
                  <dt>{d}</dt>
                  <dd className="text-muted">{h}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="reveal" style={{ "--delay": "120ms" } as React.CSSProperties}>
            <h3 className="text-sm font-semibold text-muted">{t.footer.contact}</h3>
            <a href={`tel:${tel}`} dir="ltr" className="mt-3 block hover:text-blue">{t.footer.phone}</a>
            <a href={`mailto:${t.footer.email}`} className="mt-1.5 block hover:text-blue">{t.footer.email}</a>
          </div>
          <div className="reveal" style={{ "--delay": "180ms" } as React.CSSProperties}>
            <h3 className="text-sm font-semibold text-muted">{t.footer.links}</h3>
            <Link href={`/${lang}/book`} className="mt-3 block hover:text-blue">{t.footer.book}</Link>
            <Link href={`/${lang}/manage`} className="mt-1.5 block hover:text-blue">{t.footer.manage}</Link>
            <Link href={`/${lang}/clinic`} className="mt-1.5 block text-muted hover:text-blue">{t.footer.staff}</Link>
          </div>
        </div>
        <div className="flex items-center gap-2.5 border-t border-line py-7 text-sm text-muted">
          <LogoMark className="h-6 w-6" />© {t.footer.rights}
        </div>
      </div>
    </section>
  );
}

/* ---------- الصفحة ---------- */

export default function Landing({ lang, photos }: { lang: Locale; photos: Photos }) {
  const t = getDictionary(lang);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [toothReady, setToothReady] = useState(false);

  const gallery = t.gallery.captions
    .map((caption, i) => ({ caption, src: photos[`gallery-${i + 1}`] }))
    .filter((g): g is { caption: string; src: string } => Boolean(g.src));

  useEffect(() => {
    const id = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // العناصر بتظهر لما توصلها
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    root.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // السن الثلاثي الأبعاد — بيتحمّل بعد ما الصفحة تظهر
  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    let disposed = false;
    let scene: { dispose: () => void } | null = null;
    import("./toothScene")
      .then(({ createToothScene }) => {
        if (disposed) return;
        scene = createToothScene(canvas, {
          rtl: lang === "ar",
          reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          sections: Array.from(root.querySelectorAll<HTMLElement>("[data-tooth]")),
          onReady: () => setToothReady(true),
        });
      })
      .catch(() => {});
    return () => {
      disposed = true;
      scene?.dispose();
    };
  }, [lang]);

  return (
    <div ref={rootRef} className={loaded ? "loaded" : ""}>
      <a href="#main" className="skip-link">
        {t.nav.skip}
      </a>
      <Header lang={lang} t={t} />
      <canvas ref={canvasRef} id="tooth" className={toothReady ? "ready" : ""} aria-hidden="true" />
      <main id="main">
        <Hero lang={lang} t={t} photo={photos.hero} />
        {gallery.length >= 4 && <GalleryBand t={t} photos={gallery} />}
        <Services lang={lang} t={t} />
        <Doctors lang={lang} t={t} photos={photos} />
        <How lang={lang} t={t} />
        <Footer lang={lang} t={t} />
      </main>
    </div>
  );
}
