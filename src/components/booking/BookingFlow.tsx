"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { getBookingCopy } from "@/i18n/booking";
import { DOCTORS, SERVICES, doctorsFor, getDoctor, getService, type Doctor, type Service } from "@/lib/clinic";
import { formatDay, formatPrice, formatTime } from "@/lib/format";
import { Arrow } from "@/components/landing/Decor";
import DoctorPhoto from "./DoctorPhoto";

type Photos = Record<string, string>;
type Free = { date: string; time: string; start: string } | null;
interface Slot {
  start: string;
  time: string;
  doctor: string;
}
interface Confirmed {
  code: string;
  start: string;
  end: string;
  name: string;
  doctor: string;
  service: string;
}

const ANY = "any";

class RequestError extends Error {
  constructor(
    public status: number,
    public reason: string,
    public fields: Record<string, string> = {}
  ) {
    super(reason);
  }
}

async function request<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new RequestError(res.status, data.reason ?? "server", data.fields ?? {});
  return data as T;
}

/** ملف تقويم .ics — بيفتح بتقويم الجوال أو Google أو Outlook */
function calendarFile(b: Confirmed, title: string, location: string) {
  const stamp = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pearl Dental//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${b.code}@pearldental`,
    `DTSTAMP:${stamp(b.start)}`,
    `DTSTART:${stamp(b.start)}`,
    `DTEND:${stamp(b.end)}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${b.code}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

const part = (time: string) => {
  const h = Number(time.slice(0, 2));
  return h < 12 ? "morning" : h < 16 ? "afternoon" : "evening";
};

export default function BookingFlow({ lang, photos }: { lang: Locale; photos: Photos }) {
  const c = getBookingCopy(lang);
  const params = useSearchParams();

  // روابط الصفحة الرئيسية: ?service=cleaning أو ?doctor=sara
  const preset = useMemo(() => {
    const s = getService(params.get("service") ?? "");
    let d = getDoctor(params.get("doctor") ?? "");
    if (s && d && !d.services.includes(s.id)) d = undefined;
    return { service: s?.id, doctor: d?.slug };
  }, [params]);

  const [serviceId, setServiceId] = useState<string | undefined>(preset.service);
  const [doctorId, setDoctorId] = useState<string | undefined>(preset.doctor);
  const [step, setStep] = useState(() => (preset.service ? (preset.doctor ? 2 : 1) : 0));
  const [date, setDate] = useState<string>();
  const [slot, setSlot] = useState<Slot>();
  const [notice, setNotice] = useState<string>();
  const [confirmed, setConfirmed] = useState<Confirmed>();
  const [refresh, setRefresh] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);
  // true لما احنا اخترنا اليوم تلقائياً — إذا طلع فاضي بننقل لليوم اللي بعده
  const autoDay = useRef(true);

  const service = serviceId ? getService(serviceId) : undefined;
  const doctor = doctorId && doctorId !== ANY ? getDoctor(doctorId) : undefined;
  // الأطباء اللي بيعملوا هالعلاج
  const eligible = useMemo(() => (service ? doctorsFor(service.id) : DOCTORS), [service]);
  const searchDoctors = useMemo(() => (doctor ? [doctor] : eligible), [doctor, eligible]);

  const go = (n: number) => {
    setStep(n);
    setNotice(undefined);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ---------- أقرب موعد لكل طبيب ---------- */
  const [nextFree, setNextFree] = useState<Record<string, Free> | null>(null);
  useEffect(() => {
    let alive = true;
    request<{ next: Record<string, Free> }>("/api/doctors/next")
      .then((d) => alive && setNextFree(d.next))
      .catch(() => alive && setNextFree({}));
    return () => {
      alive = false;
    };
  }, [refresh]);

  /* ---------- أيام الدوام ----------
   * النتيجة محفوظة مع "مفتاح" الطلب، فلما يتغير الاختيار بتصير null (تحميل) لحالها
   */
  const daysKey = step === 2 && service ? `${service.id}|${searchDoctors.map((d) => d.slug).join(",")}` : null;
  const [daysState, setDaysState] = useState<{ key: string; days: string[] }>();
  const days = daysState && daysState.key === daysKey ? daysState.days : null;
  useEffect(() => {
    if (!daysKey) return;
    let alive = true;
    Promise.all(searchDoctors.map((d) => request<{ days: string[] }>(`/api/days?doctor=${d.slug}`)))
      .then((lists) => [...new Set(lists.flatMap((l) => l.days))].sort())
      .catch(() => [] as string[])
      .then((all) => {
        if (!alive) return;
        setDaysState({ key: daysKey, days: all });
        setDate((current) => {
          if (current && all.includes(current)) return current;
          autoDay.current = true;
          return all[0];
        });
      });
    return () => {
      alive = false;
    };
  }, [daysKey, searchDoctors]);

  /* ---------- الأوقات الفاضية لليوم المختار ---------- */
  const slotsKey = daysKey && date ? `${daysKey}|${date}|${refresh}` : null;
  const [slotsState, setSlotsState] = useState<{ key: string; slots: Slot[] }>();
  const slots = slotsState && slotsState.key === slotsKey ? slotsState.slots : null;
  useEffect(() => {
    if (!slotsKey || !service || !date) return;
    let alive = true;
    Promise.all(
      searchDoctors.map((d) =>
        request<{ slots: { start: string; time: string }[] }>(
          `/api/availability?doctor=${d.slug}&service=${service.id}&date=${date}`
        ).then((r) => r.slots.map((s) => ({ ...s, doctor: d.slug })))
      )
    )
      .then((lists) => {
        // "أي طبيب": لكل وقت بناخذ أول طبيب فاضي فيه
        const byTime = new Map<string, Slot>();
        for (const s of lists.flat()) if (!byTime.has(s.start)) byTime.set(s.start, s);
        return [...byTime.values()].sort((a, b) => a.start.localeCompare(b.start));
      })
      .catch(() => [] as Slot[])
      .then((list) => {
        if (!alive) return;
        // اليوم اللي اخترناه تلقائياً ما فيه أوقات (مثلاً الدوام خلص)؟ بننقل لأول يوم فيه
        const nextDay = days ? days[days.indexOf(date) + 1] : undefined;
        if (!list.length && autoDay.current && nextDay) return setDate(nextDay);
        setSlotsState({ key: slotsKey, slots: list });
      });
    return () => {
      alive = false;
    };
  }, [slotsKey, service, date, searchDoctors, days]);

  /* ---------- التأكيد ---------- */
  const [form, setForm] = useState({ name: "", phone: "", email: "", note: "", website: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!service || !slot) return;
    setSending(true);
    setFieldErrors({});
    setNotice(undefined);
    try {
      const { booking } = await request<{ booking: Confirmed }>("/api/bookings", {
        service: service.id,
        doctor: slot.doctor,
        start: slot.start,
        ...form,
        locale: lang,
      });
      setConfirmed(booking);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      if (err instanceof RequestError && err.status === 400 && Object.keys(err.fields).length) {
        setFieldErrors(Object.fromEntries(Object.entries(err.fields).map(([k, v]) => [k, c.details.errors[v] ?? c.details.errors[k] ?? v])));
      } else if (err instanceof RequestError && err.status === 409) {
        // حدا سبقنا على هالوقت: منرجع لاختيار الوقت والقائمة بتتحدث
        setSlot(undefined);
        setRefresh((n) => n + 1);
        setStep(2);
        setNotice(c.taken);
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        setNotice(c.failed);
      }
    } finally {
      setSending(false);
    }
  };

  /* ---------- العرض ---------- */

  if (confirmed) {
    return <Done lang={lang} booking={confirmed} photos={photos} topRef={topRef} />;
  }

  const stepTitle = [c.service.heading, c.doctor.heading, c.time.heading, c.details.heading][step]!;

  return (
    <div ref={topRef} className="mx-auto max-w-6xl scroll-mt-4 px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <h1 className="text-sm font-semibold text-blue">{c.title}</h1>

      {/* الخطوات */}
      <ol className="mt-4 flex gap-1.5" aria-label={c.step(step + 1, 4)}>
        {c.steps.map((label, i) => {
          const reachable = i < step;
          return (
            <li key={label} className="flex-1">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => go(i)}
                aria-current={i === step ? "step" : undefined}
                className="group w-full text-start disabled:cursor-default"
              >
                <span className={`block h-1 rounded-full transition-colors ${i <= step ? "bg-blue" : "bg-line"}`} />
                <span className={`mt-2 hidden text-[13px] sm:block ${i === step ? "font-semibold text-ink" : reachable ? "text-muted group-hover:text-ink" : "text-muted/70"}`}>
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px] lg:gap-12">
        <div className="min-w-0">
          <p className="text-sm text-muted">{c.step(step + 1, 4)}</p>
          <h2 className="mt-1 text-3xl font-bold leading-tight sm:text-4xl rtl:leading-snug">{stepTitle}</h2>

          {notice && (
            <p role="alert" className="mt-6 rounded-xl border border-warn/30 bg-[#fff7ed] px-4 py-3 text-[15px] text-[#7c3a06]">
              {notice}
            </p>
          )}

          <div className="mt-8">
            {step === 0 && (
              <ServiceStep
                lang={lang}
                services={doctor ? SERVICES.filter((s) => doctor.services.includes(s.id)) : SERVICES}
                selected={serviceId}
                onPick={(id) => {
                  setServiceId(id);
                  setSlot(undefined);
                  // إذا الطبيب المختار ما بيعمل هالعلاج بنلغي اختياره
                  if (doctor && !doctor.services.includes(id as Service["id"])) setDoctorId(undefined);
                  go(doctor && doctor.services.includes(id as Service["id"]) ? 2 : 1);
                }}
              />
            )}

            {step === 1 && service && (
              <DoctorStep
                lang={lang}
                doctors={eligible}
                photos={photos}
                nextFree={nextFree}
                selected={doctorId}
                onPick={(id) => {
                  setDoctorId(id);
                  setSlot(undefined);
                  go(2);
                }}
              />
            )}

            {step === 2 && service && (
              <TimeStep
                lang={lang}
                days={days}
                date={date}
                onDate={(d) => {
                  autoDay.current = false;
                  setDate(d);
                  setSlot(undefined);
                }}
                slots={slots}
                any={!doctor}
                selected={slot}
                onPick={(s) => {
                  setSlot(s);
                  go(3);
                }}
              />
            )}

            {step === 3 && service && slot && (
              <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
                <Field label={c.details.name} error={fieldErrors.name} className="sm:col-span-2">
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    autoComplete="name"
                    required
                    className={inputCls(fieldErrors.name)}
                  />
                </Field>
                <Field label={c.details.phone} hint={c.details.phoneHint} error={fieldErrors.phone}>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    dir="ltr"
                    placeholder="059 000 0000"
                    required
                    className={`${inputCls(fieldErrors.phone)} rtl:text-right`}
                  />
                </Field>
                <Field label={c.details.email} error={fieldErrors.email}>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    type="email"
                    autoComplete="email"
                    dir="ltr"
                    className={`${inputCls(fieldErrors.email)} rtl:text-right`}
                  />
                </Field>
                <Field label={c.details.note} className="sm:col-span-2">
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    rows={3}
                    maxLength={400}
                    placeholder={c.details.notePlaceholder}
                    className={inputCls()}
                  />
                </Field>
                {/* حقل فخ للبوتات — مخفي عن البشر */}
                <input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute -start-[9999px] h-0 w-0 opacity-0"
                />
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-blue px-8 py-4 font-semibold text-white transition-colors hover:bg-blue-dark disabled:opacity-60 sm:w-auto"
                  >
                    {sending ? c.details.sending : c.details.submit}
                    {!sending && <Arrow />}
                  </button>
                </div>
              </form>
            )}
          </div>

          {step > 0 && (
            <button type="button" onClick={() => go(step - 1)} className="mt-8 inline-flex items-center gap-2 text-[15px] text-muted hover:text-ink">
              <Arrow className="h-4 w-4 rotate-180" />
              {c.previous}
            </button>
          )}
        </div>

        <Summary lang={lang} service={service} doctor={doctor} slot={slot} photos={photos} onEdit={go} step={step} />
      </div>
    </div>
  );
}

/* ---------------- الخطوات ---------------- */

const inputCls = (error?: string) =>
  `w-full rounded-xl border bg-card px-4 py-3 text-[16px] outline-none transition-colors focus:border-blue ${
    error ? "border-error" : "border-line"
  }`;

function Field({
  label,
  hint,
  error,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[15px] font-medium">{label}</span>
      {children}
      {error ? <span className="text-sm text-error">{error}</span> : hint ? <span className="text-sm text-muted">{hint}</span> : null}
    </label>
  );
}

function ServiceStep({
  lang,
  services,
  selected,
  onPick,
}: {
  lang: Locale;
  services: Service[];
  selected?: string;
  onPick: (id: Service["id"]) => void;
}) {
  const c = getBookingCopy(lang);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {services.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onPick(s.id)}
          aria-pressed={selected === s.id}
          className={`flex flex-col rounded-2xl border bg-card p-5 text-start transition hover:border-ink ${
            selected === s.id ? "border-blue ring-2 ring-blue/20" : "border-line"
          }`}
        >
          <span className="text-lg font-semibold">{s.name[lang]}</span>
          <span className="mt-1.5 text-[15px] leading-relaxed text-muted">{s.blurb[lang]}</span>
          <span className="mt-4 flex items-center gap-2 text-sm">
            <span className="font-semibold">{s.priceFrom === 0 ? c.service.free : c.service.from(s.priceFrom)}</span>
            <span className="text-line">|</span>
            <span className="text-muted">{c.service.minutes(s.minutes)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function DoctorStep({
  lang,
  doctors,
  photos,
  nextFree,
  selected,
  onPick,
}: {
  lang: Locale;
  doctors: Doctor[];
  photos: Photos;
  nextFree: Record<string, Free> | null;
  selected?: string;
  onPick: (id: string) => void;
}) {
  const c = getBookingCopy(lang);
  const card = (active: boolean) =>
    `flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-start transition hover:border-ink ${
      active ? "border-blue ring-2 ring-blue/20" : "border-line"
    }`;
  return (
    <div className="grid gap-3">
      <button type="button" onClick={() => onPick(ANY)} aria-pressed={selected === ANY} className={card(selected === ANY)}>
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-sky text-blue">
          <Arrow className="h-6 w-6" />
        </span>
        <span>
          <span className="block font-semibold">{c.doctor.any}</span>
          <span className="mt-0.5 block text-sm text-muted">{c.doctor.anyHint}</span>
        </span>
      </button>
      {doctors.map((d) => {
        const free = nextFree?.[d.slug];
        return (
          <button key={d.slug} type="button" onClick={() => onPick(d.slug)} aria-pressed={selected === d.slug} className={card(selected === d.slug)}>
            <DoctorPhoto src={photos[d.photo]} name={d.name[lang]} className="h-16 w-16 shrink-0 rounded-xl" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{d.name[lang]}</span>
              <span className="mt-0.5 block text-sm text-blue">{d.role[lang]}</span>
            </span>
            <span className="hidden text-end text-sm sm:block">
              <span className="block text-muted">{c.doctor.next}</span>
              <span className={`block font-medium ${nextFree ? "" : "animate-pulse text-muted"}`}>
                {nextFree === null ? "···" : free ? `${formatDay(free.date, lang, "short")} · ${formatTime(free.start, lang)}` : c.doctor.none}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TimeStep({
  lang,
  days,
  date,
  onDate,
  slots,
  any,
  selected,
  onPick,
}: {
  lang: Locale;
  days: string[] | null;
  date?: string;
  onDate: (d: string) => void;
  slots: Slot[] | null;
  any: boolean;
  selected?: Slot;
  onPick: (s: Slot) => void;
}) {
  const c = getBookingCopy(lang);
  const dayFmt = new Intl.DateTimeFormat(lang === "ar" ? "ar-u-nu-latn" : "en-GB", { timeZone: "UTC", weekday: "short" });
  const numFmt = new Intl.DateTimeFormat(lang === "ar" ? "ar-u-nu-latn" : "en-GB", { timeZone: "UTC", day: "numeric", month: "short" });

  if (days === null) return <p className="animate-pulse text-muted">{c.time.loading}</p>;
  if (days.length === 0) return <p className="text-muted">{c.doctor.none}</p>;

  const groups = (["morning", "afternoon", "evening"] as const)
    .map((key) => ({ key, slots: (slots ?? []).filter((s) => part(s.time) === key) }))
    .filter((g) => g.slots.length);

  return (
    <div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {days.map((d) => {
          const at = new Date(`${d}T12:00:00Z`);
          const active = d === date;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onDate(d)}
              aria-pressed={active}
              className={`flex w-[76px] shrink-0 flex-col items-center rounded-2xl border px-2 py-3 transition ${
                active ? "border-ink bg-ink text-white" : "border-line bg-card hover:border-ink"
              }`}
            >
              <span className={`text-xs ${active ? "text-white/70" : "text-muted"}`}>{dayFmt.format(at)}</span>
              <span className="mt-1 text-[15px] font-semibold">{numFmt.format(at)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 min-h-40" aria-live="polite">
        {slots === null ? (
          <p className="animate-pulse text-muted">{c.time.loading}</p>
        ) : slots.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-muted">{c.time.empty}</p>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <div key={g.key}>
                <h3 className="text-sm font-semibold text-muted">{c.time[g.key]}</h3>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {g.slots.map((s) => {
                    const active = selected?.start === s.start;
                    return (
                      <button
                        key={s.start}
                        type="button"
                        onClick={() => onPick(s)}
                        aria-pressed={active}
                        title={any ? c.time.with(getDoctor(s.doctor)!.name[lang]) : undefined}
                        className={`rounded-xl border px-2 py-3 text-[15px] font-medium tabular-nums transition ${
                          active ? "border-blue bg-blue text-white" : "border-line bg-card hover:border-blue hover:text-blue"
                        }`}
                      >
                        {formatTime(s.start, lang)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- الملخص ---------------- */

function Summary({
  lang,
  service,
  doctor,
  slot,
  photos,
  onEdit,
  step,
}: {
  lang: Locale;
  service?: Service;
  doctor?: Doctor;
  slot?: Slot;
  photos: Photos;
  onEdit: (step: number) => void;
  step: number;
}) {
  const c = getBookingCopy(lang);
  // مع "أي طبيب" بنعرف الطبيب لما يختار الوقت
  const shownDoctor = doctor ?? (slot ? getDoctor(slot.doctor) : undefined);
  const row = (label: string, value: React.ReactNode, edit: number) => (
    <div className="flex items-start justify-between gap-3 py-3.5">
      <div className="min-w-0">
        <dt className="text-sm text-muted">{label}</dt>
        <dd className="mt-0.5 font-medium">{value}</dd>
      </div>
      {step > edit && (
        <button type="button" onClick={() => onEdit(edit)} className="shrink-0 text-sm font-medium text-blue hover:underline">
          {c.summary.change}
        </button>
      )}
    </div>
  );

  return (
    <aside className="h-fit rounded-3xl border border-line bg-card p-6 lg:sticky lg:top-6">
      <h2 className="font-semibold">{c.summary.heading}</h2>
      {!service ? (
        <p className="mt-3 text-sm text-muted">{c.summary.empty}</p>
      ) : (
        <>
          {shownDoctor && (
            <div className="mt-4 flex items-center gap-3">
              <DoctorPhoto src={photos[shownDoctor.photo]} name={shownDoctor.name[lang]} className="h-12 w-12 rounded-xl" />
              <div>
                <p className="font-semibold">{shownDoctor.name[lang]}</p>
                <p className="text-sm text-muted">{shownDoctor.role[lang]}</p>
              </div>
            </div>
          )}
          <dl className="mt-3 divide-y divide-line border-t border-line">
            {row(c.steps[0]!, `${service.name[lang]} · ${c.service.minutes(service.minutes)}`, 0)}
            {(doctor || slot) && row(c.steps[1]!, shownDoctor ? shownDoctor.name[lang] : c.doctor.any, 1)}
            {slot && row(c.steps[2]!, `${formatDay(dateOf(slot), lang)} · ${formatTime(slot.start, lang)}`, 2)}
          </dl>
          <div className="mt-2 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-sm text-muted">{c.summary.total}</span>
            <span className="text-xl font-bold">{service.priceFrom === 0 ? c.service.free : formatPrice(service.priceFrom, lang)}</span>
          </div>
        </>
      )}
    </aside>
  );
}

/** تاريخ الموعد بتوقيت العيادة (مش بتوقيت جهاز المستخدم) */
function dateOf(slot: Slot) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Gaza", year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(new Date(slot.start))
      .map((p) => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/* ---------------- تم الحجز ---------------- */

function Done({
  lang,
  booking,
  photos,
  topRef,
}: {
  lang: Locale;
  booking: Confirmed;
  photos: Photos;
  topRef: React.RefObject<HTMLDivElement | null>;
}) {
  const c = getBookingCopy(lang);
  const service = getService(booking.service)!;
  const doctor = getDoctor(booking.doctor)!;
  const date = dateOf({ start: booking.start, time: "", doctor: "" });
  const ics = calendarFile(
    booking,
    `Pearl Dental · ${service.name[lang]}`,
    lang === "ar" ? "شارع عمر المختار، الطابق الثاني" : "Omar Al-Mukhtar St, 2nd floor"
  );

  return (
    <div ref={topRef} className="mx-auto max-w-2xl scroll-mt-4 px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-[#e3f4ec] text-ok">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </div>
      <h1 className="mt-6 text-4xl font-bold">{c.done.heading}</h1>
      <p className="mt-2 text-lg text-muted">{c.done.lead(booking.name.split(" ")[0]!)}</p>

      <div className="mt-8 overflow-hidden rounded-3xl border border-line bg-card">
        <div className="flex items-center gap-4 border-b border-line p-6">
          <DoctorPhoto src={photos[doctor.photo]} name={doctor.name[lang]} className="h-14 w-14 rounded-xl" />
          <div>
            <p className="text-lg font-semibold">{formatDay(date, lang)} · {formatTime(booking.start, lang)}</p>
            <p className="text-muted">
              {service.name[lang]} · {doctor.name[lang]}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="text-sm text-muted">{c.done.code}</p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-wider" dir="ltr">
              {booking.code}
            </p>
            <p className="mt-1 max-w-xs text-sm text-muted">{c.done.codeHint}</p>
          </div>
          {(
            <a
              href={ics}
              download={`pearl-dental-${booking.code}.ics`}
              className="rounded-full border border-ink px-5 py-2.5 text-sm font-semibold hover:bg-ink hover:text-white"
            >
              {c.done.calendar}
            </a>
          )}
        </div>
      </div>

      <p className="mt-6 leading-relaxed text-muted">{c.done.arrive}</p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href={`/${lang}/manage`} className="rounded-full bg-ink px-6 py-3 font-semibold text-white hover:bg-night">
          {c.done.manage}
        </Link>
        <Link href={`/${lang}`} className="rounded-full border border-line bg-card px-6 py-3 font-semibold hover:border-ink">
          {c.back}
        </Link>
      </div>
    </div>
  );
}
