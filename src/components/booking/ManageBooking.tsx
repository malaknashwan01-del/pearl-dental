"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getBookingCopy } from "@/i18n/booking";
import { getDoctor, getService } from "@/lib/clinic";
import { formatDay, formatTime } from "@/lib/format";
import DoctorPhoto from "./DoctorPhoto";

interface Booking {
  code: string;
  service: string;
  doctor: string;
  start: string;
  name: string;
  status: "booked" | "attended" | "no_show" | "cancelled";
}

const clinicDate = (iso: string) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Gaza", year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value])
  );
  return `${p.year}-${p.month}-${p.day}`;
};

const input = "w-full rounded-xl border border-line bg-card px-4 py-3 text-[16px] outline-none focus:border-blue";

export default function ManageBooking({ lang, photos }: { lang: Locale; photos: Record<string, string> }) {
  const c = getBookingCopy(lang);
  const m = c.manage;
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [booking, setBooking] = useState<Booking>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [justCancelled, setJustCancelled] = useState(false);

  const call = async (url: string) => {
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return data.booking as Booking;
      setError(data.reason === "too_late" ? m.tooLate : res.status === 404 ? m.notFound : c.failed);
    } catch {
      setError(c.failed);
    } finally {
      setBusy(false);
    }
  };

  const find = async (e: FormEvent) => {
    e.preventDefault();
    setJustCancelled(false);
    const b = await call("/api/bookings/lookup");
    if (b) setBooking(b);
  };

  const cancel = async () => {
    const b = await call("/api/bookings/cancel");
    setConfirming(false);
    if (b) {
      setBooking(b);
      setJustCancelled(true);
    }
  };

  const service = booking ? getService(booking.service) : undefined;
  const doctor = booking ? getDoctor(booking.doctor) : undefined;
  const upcoming = booking?.status === "booked";

  return (
    <div className="mx-auto max-w-xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
      <h1 className="text-4xl font-bold">{m.title}</h1>
      <p className="mt-3 text-muted">{m.lead}</p>

      <form onSubmit={find} className="mt-8 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[15px] font-medium">{m.code}</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="PD-XXXXXX"
            dir="ltr"
            autoCapitalize="characters"
            spellCheck={false}
            required
            className={`${input} font-mono tracking-wider rtl:text-right`}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[15px] font-medium">{m.phone}</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" dir="ltr" required className={`${input} rtl:text-right`} />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={busy} className="rounded-full bg-blue px-7 py-3 font-semibold text-white hover:bg-blue-dark disabled:opacity-60">
            {m.find}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-6 rounded-xl border border-warn/30 bg-[#fff7ed] px-4 py-3 text-[15px] text-[#7c3a06]">
          {error}
        </p>
      )}

      {booking && service && doctor && (
        <section className="mt-10 overflow-hidden rounded-3xl border border-line bg-card" aria-live="polite">
          <div className="flex items-center gap-4 border-b border-line p-6">
            <DoctorPhoto src={photos[doctor.photo]} name={doctor.name[lang]} className="h-14 w-14 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className={`text-lg font-semibold ${upcoming ? "" : "text-muted line-through decoration-1"}`}>
                {formatDay(clinicDate(booking.start), lang)} · {formatTime(booking.start, lang)}
              </p>
              <p className="text-muted">
                {service.name[lang]} · {doctor.name[lang]}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                upcoming ? "bg-[#e3f4ec] text-ok" : "bg-paper text-muted"
              }`}
            >
              {m.status[booking.status]}
            </span>
          </div>

          <div className="p-6">
            {justCancelled ? (
              <p className="text-[15px]">{m.cancelled}</p>
            ) : upcoming && !confirming ? (
              <button type="button" onClick={() => setConfirming(true)} className="font-semibold text-error hover:underline">
                {m.cancel}
              </button>
            ) : upcoming && confirming ? (
              <div>
                <p className="font-medium">{m.confirmCancel}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={cancel} disabled={busy} className="rounded-full bg-error px-6 py-2.5 font-semibold text-white disabled:opacity-60">
                    {m.yesCancel}
                  </button>
                  <button type="button" onClick={() => setConfirming(false)} className="rounded-full border border-line px-6 py-2.5 font-semibold hover:border-ink">
                    {m.keep}
                  </button>
                </div>
              </div>
            ) : null}
            {!upcoming && (
              <Link href={`/${lang}/book`} className="mt-4 inline-block font-semibold text-blue hover:underline">
                {m.newBooking}
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
