"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { Bubbles, Chevron, HangingTube, LogoMark, Toothbrush, ToothpasteSwirl } from "./Decor";

const lines = (parts: string[]) =>
  parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && <br />}
    </span>
  ));

export default function Landing({ lang, t }: { lang: Locale; t: Dictionary }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [toothReady, setToothReady] = useState(false);
  const [onDark, setOnDark] = useState(false);
  const otherLang = lang === "ar" ? "en" : "ar";

  // دخول العنوان بعد أول رسم
  useEffect(() => {
    const id = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // الأقسام بتظهر لما توصلها + البارالاكس + لون الناف فوق القسم الغامق
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>("main > section"));
    const parallax = Array.from(root.querySelectorAll<HTMLElement>("[data-speed]"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.3 }
    );
    sections.forEach((s) => io.observe(s));

    let ticking = false;
    const update = () => {
      ticking = false;
      const h = window.innerHeight;
      if (!reduced) {
        for (const el of parallax) {
          const sec = el.closest("section")!;
          const p = -sec.getBoundingClientRect().top / h;
          const speed = Number(el.dataset.speed ?? 0);
          const rot = Number(el.dataset.rot ?? 0);
          el.style.transform = `translate3d(0, ${p * speed * h}px, 0) rotate(${p * rot}deg)`;
        }
      }
      const probe = h * 0.06;
      const current = sections.find((s) => {
        const r = s.getBoundingClientRect();
        return r.top <= probe && r.bottom > probe;
      });
      setOnDark(current?.dataset.theme === "dark");
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // السن الثلاثي الأبعاد — three.js بينزل لحاله بعد ما الصفحة تظهر
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
          sections: Array.from(root.querySelectorAll<HTMLElement>("main > section")),
          onReady: () => setToothReady(true),
        });
      })
      .catch(() => {
        // جهاز بدون WebGL — الصفحة بتشتغل عادي بدون السن
      });

    return () => {
      disposed = true;
      scene?.dispose();
    };
  }, [lang]);

  return (
    <div ref={rootRef} className={`landing ${loaded ? "loaded" : ""} ${onDark ? "on-dark" : ""}`}>
      <a href="#main" className="skip-link">
        {lang === "ar" ? "تخطَّ إلى المحتوى" : "Skip to content"}
      </a>

      <nav className="nav" aria-label={lang === "ar" ? "القائمة الرئيسية" : "Main"}>
        <a className="logo" href="#top" aria-label={t.nav.home}>
          <LogoMark />
          <span>Pearl Dental</span>
        </a>
        <div className="nav__links">
          <a href="#services">{t.nav.services}</a>
          <a href="#book">{t.nav.book}</a>
          <a href="#team">{t.nav.team}</a>
        </div>
        <div className="nav__end">
          <Link className="nav__lang" href={`/${otherLang}`} hrefLang={otherLang} aria-label={t.nav.switchLabel}>
            {t.nav.switchTo}
          </Link>
          <a className="nav__cta" href="#book">
            {t.nav.cta}
          </a>
        </div>
      </nav>

      <canvas ref={canvasRef} id="tooth" className={toothReady ? "ready" : ""} aria-hidden="true" />

      <main id="main">
        <section className="hero" id="top" data-theme="light">
          <h1 data-speed="0.55">
            <span className="line">
              <span>{t.hero.line1}</span>
            </span>
            <span className="line">
              <span className="accent">{t.hero.line2}</span>
            </span>
          </h1>
          <div className="decor decor--swirl" data-speed="-0.25" data-rot="6">
            <ToothpasteSwirl />
          </div>
          <div className="hero__side">
            <p>{t.hero.side}</p>
            <a className="join" href="#book">
              <i>
                <Chevron />
              </i>
              {t.hero.cta}
            </a>
          </div>
        </section>

        <section className="s1" id="services" data-theme="light">
          <div className="decor decor--tube" data-speed="0.35" data-rot="-6">
            <HangingTube />
          </div>
          <div className="num reveal">01</div>
          <div className="text">
            <h2 className="title reveal d1">{lines(t.services.title)}</h2>
            <p className="copy reveal d2">{t.services.copy}</p>
            <ul className="chips reveal d3">
              {t.services.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="s2" id="book" data-theme="dark">
          <div className="text">
            <div className="num reveal">02</div>
            <h2 className="title reveal d1">{lines(t.book.title)}</h2>
            <p className="copy reveal d2">{t.book.copy}</p>
            <a className="join join--light reveal d3" href="#contact">
              <i>
                <Chevron />
              </i>
              {t.book.cta}
            </a>
          </div>
          <div className="decor decor--bubbles" data-speed="-0.3" data-rot="10">
            <Bubbles />
          </div>
        </section>

        <section className="s3" id="team" data-theme="light">
          <div className="decor decor--brush" data-speed="-0.2" data-rot="-8">
            <Toothbrush />
          </div>
          <div className="text">
            <div className="num reveal">03</div>
            <h2 className="title reveal d1">{lines(t.team.title)}</h2>
            <p className="copy reveal d2">{t.team.copy}</p>
            <dl className="stats reveal d3">
              {t.team.stats.map((s) => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="foot" id="contact" data-theme="light">
          <div className="cta">
            <h2 className="title reveal">{t.footer.cta}</h2>
            <a className="join reveal d1" href="#book">
              <i>
                <Chevron />
              </i>
              {t.footer.button}
            </a>
          </div>
          <div className="brand reveal">
            <strong>Pearl Dental</strong>
            <span>{t.footer.tagline}</span>
          </div>
          <div className="cols reveal d1">
            <div>
              <h3>{t.footer.hoursTitle}</h3>
              {t.footer.hours.map((h) => (
                <p key={h}>{h}</p>
              ))}
            </div>
            <div>
              <h3>{t.footer.contactTitle}</h3>
              <a href={`tel:${t.footer.phone.replace(/\s/g, "")}`} dir="ltr">
                {t.footer.phone}
              </a>
              <a href={`mailto:${t.footer.email}`}>{t.footer.email}</a>
            </div>
            <div>
              <h3>{t.footer.socialTitle}</h3>
              <a href="#">Instagram</a>
              <a href="#">Facebook</a>
            </div>
          </div>
        </section>
      </main>

      <div className="badge">
        <LogoMark />
        {t.badge.made} <b>{t.badge.name}</b>
      </div>
    </div>
  );
}
