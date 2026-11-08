"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import type { Locale } from "@/i18n/config";
import { getBookingCopy } from "@/i18n/booking";
import { DOCTORS, getDoctor, getService } from "@/lib/clinic";
import { addDays, clinicParts } from "@/lib/schedule";
import { formatDay, formatTime } from "@/lib/format";

type Status = "booked" | "attended" | "no_show" | "cancelled";
interface Row {
  id: number;
  code: string;
  service: string;
  doctor: string;
  start: string;
  end: string;
  name: string;
  phone: string;
  email: string | null;
  note: string | null;
  status: Status;
}

const STATUS_STYLE: Record<Status, string> = {
  booked: "bg-sky text-blue",
  attended: "bg-[#e3f4ec] text-ok",
  no_show: "bg-[#fdecef] text-error",
  cancelled: "bg-paper text-muted",
};

export default function ClinicSchedule({ lang }: { lang: Locale }) {
  const c = getBookingCopy(lang).clinic;
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  // اليوم بتوقيت العيادة — بالمتصفح بس (وقت بناء الصفحة ما في "اليوم")
  const today = useSyncExternalStore(
    () => () => {},
    () => clinicParts(new Date()).date,
    () => null
  );
  const [picked, setDate] = useState<string>();
  const date = picked ?? today ?? undefined;
  // version بتزيد لما بدنا نعيد تحميل الجدول (بعد الدخول أو خطأ)
  const [version, setVersion] = useState(0);
  const key = date ? `${date}|${version}` : null;
  const [loaded, setLoaded] = useState<{ key: string; rows: Row[] }>();
  const rows = loaded && loaded.key === key ? loaded.rows : null;
  const reload = () => setVersion((v) => v + 1);
  const [doctor, setDoctor] = useState<string>("all");

  useEffect(() => {
    if (!key || !date) return;
    let alive = true;
    fetch(`/api/clinic/schedule?date=${date}`).then(async (res) => {
      if (!alive) return;
      if (res.status === 401) return setAuthed(false);
      setAuthed(true);
      const list: Row[] = res.ok ? (await res.json()).bookings : [];
      if (alive) setLoaded({ key, rows: list });
    });
    return () => {
      alive = false;
    };
  }, [key, date]);

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(false);
    const res = await fetch("/api/clinic/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setPassword("");
      reload();
    } else setLoginError(true);
  };

  const logout = async () => {
    await fetch("/api/clinic/logout", { method: "POST" });
    setAuthed(false);
  };

  const setStatus = async (id: number, status: Status) => {
    // تحديث فوري، وإذا فشل بنعيد التحميل
    setLoaded((l) => l && { ...l, rows: l.rows.map((x) => (x.id === id ? { ...x, status } : x)) });
    const res = await fetch(`/api/clinic/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) reload();
  };

  if (authed === false) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20">
        <h1 className="text-3xl font-bold">{c.login}</h1>
        <form onSubmit={login} className="mt-8 grid gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[15px] font-medium">{c.password}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="rounded-xl border border-line bg-card px-4 py-3 outline-none focus:border-blue"
            />
            {loginError && <span className="text-sm text-error">{c.wrong}</span>}
          </label>
          <button type="submit" className="rounded-full bg-blue px-6 py-3 font-semibold text-white hover:bg-blue-dark">
            {c.enter}
          </button>
        </form>
      </div>
    );
  }

  if (!date || !today) return <p className="animate-pulse px-4 py-16 text-center text-muted">…</p>;

  const visible = (rows ?? []).filter((r) => doctor === "all" || r.doctor === doctor);
  const active = visible.filter((r) => r.status !== "cancelled");

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{c.title}</h1>
          <p className="mt-1 text-muted">
            {formatDay(date, lang)} · {c.count(active.length)}
          </p>
        </div>
        <button type="button" onClick={logout} className="text-sm font-medium text-muted hover:text-ink">
          {c.logout}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setDate(addDays(date, -1))} className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card hover:border-ink" aria-label="−1">
          <span className="rtl:rotate-180">‹</span>
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="h-10 rounded-full border border-line bg-card px-4 text-sm"
        />
        <button type="button" onClick={() => setDate(addDays(date, 1))} className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card hover:border-ink" aria-label="+1">
          <span className="rtl:rotate-180">›</span>
        </button>
        {date !== today && (
          <button type="button" onClick={() => setDate(today)} className="h-10 rounded-full border border-line bg-card px-4 text-sm font-medium hover:border-ink">
            {c.today}
          </button>
        )}
        <select
          value={doctor}
          onChange={(e) => setDoctor(e.target.value)}
          className="ms-auto h-10 rounded-full border border-line bg-card px-4 text-sm"
        >
          <option value="all">{lang === "ar" ? "كل الأطباء" : "All dentists"}</option>
          {DOCTORS.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name[lang]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-card">
        {rows === null ? (
          <p className="animate-pulse p-8 text-muted">…</p>
        ) : visible.length === 0 ? (
          <p className="p-10 text-center text-muted">{c.empty}</p>
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((r) => (
              <li key={r.id} className={`grid gap-3 p-5 sm:grid-cols-[7rem_1fr_auto] sm:items-start ${r.status === "cancelled" ? "opacity-55" : ""}`}>
                <div className="font-semibold tabular-nums">
                  {formatTime(r.start, lang)}
                  <span className="block text-sm font-normal text-muted">{formatTime(r.end, lang)}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-sm text-muted">
                    {getService(r.service)?.name[lang]} · {getDoctor(r.doctor)?.name[lang]}
                  </p>
                  <p className="mt-1 text-sm" dir="ltr" style={{ textAlign: lang === "ar" ? "right" : "left" }}>
                    <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="text-blue hover:underline">{r.phone}</a>
                    <span className="text-muted"> · {r.code}</span>
                  </p>
                  {r.note && (
                    <p className="mt-2 rounded-lg bg-paper px-3 py-2 text-sm">
                      <span className="font-medium">{c.noteLabel}: </span>
                      {r.note}
                    </p>
                  )}
                </div>
                <select
                  value={r.status}
                  disabled={r.status === "cancelled"}
                  onChange={(e) => setStatus(r.id, e.target.value as Status)}
                  aria-label={c.statusFor(r.name)}
                  className={`h-9 rounded-full border-0 px-3 text-sm font-semibold ${STATUS_STYLE[r.status]}`}
                >
                  {(["booked", "attended", "no_show", "cancelled"] as const).map((s) => (
                    <option key={s} value={s}>
                      {c.status[s]}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
