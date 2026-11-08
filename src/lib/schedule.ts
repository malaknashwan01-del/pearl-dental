import {
  BOOKING_WINDOW_DAYS,
  CLINIC_TZ,
  MIN_NOTICE_MINUTES,
  SLOT_MINUTES,
  getDoctor,
  getService,
  type Doctor,
} from "./clinic";

/* ---------------- وقت العيادة ----------------
 * السيرفر ممكن يكون بأي بلد، فكل الحسابات بتوقيت العيادة (غزة) مع التوقيت الصيفي.
 */

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CLINIC_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** التاريخ والساعة بتوقيت العيادة لأي لحظة */
export function clinicParts(date: Date) {
  const p = Object.fromEntries(partsFormatter.formatToParts(date).map((x) => [x.type, x.value]));
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    minutes: Number(p.hour) * 60 + Number(p.minute),
    weekday: WEEKDAYS.indexOf(p.weekday!) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    seconds: Number(p.second),
  };
}

function offsetMs(at: Date) {
  const p = clinicParts(at);
  const [y, m, d] = p.date.split("-").map(Number) as [number, number, number];
  const asUtc = Date.UTC(y, m - 1, d, Math.floor(p.minutes / 60), p.minutes % 60, p.seconds);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** "2026-11-08" + 570 دقيقة (9:30) بتوقيت العيادة → لحظة UTC */
export function clinicTime(date: string, minutes: number) {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const guess = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  let result = guess - offsetMs(new Date(guess));
  // مرة ثانية عشان أيام تغيير الساعة
  result = guess - offsetMs(new Date(result));
  return new Date(result);
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number) as [number, number];
  return h * 60 + m;
};

export const formatHHMM = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

const weekdayOf = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const isDateString = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

/* ---------------- الأوقات المتاحة ---------------- */

/** كل ربع ساعة بيغطيها الموعد — هدول اللي بنقفلهم بقاعدة البيانات */
export function slotBlocks(start: Date, minutes: number) {
  return Array.from({ length: Math.ceil(minutes / SLOT_MINUTES) }, (_, i) => new Date(start.getTime() + i * SLOT_MINUTES * 60_000));
}

/** الأيام اللي الطبيب بيداوم فيها خلال فترة الحجز */
export function workingDays(doctor: Doctor, now: Date) {
  const today = clinicParts(now).date;
  const days: string[] = [];
  for (let i = 0; i <= BOOKING_WINDOW_DAYS; i++) {
    const date = addDays(today, i);
    if (doctor.hours[weekdayOf(date)]) days.push(date);
  }
  return days;
}

export interface Slot {
  start: string; // ISO
  time: string; // HH:MM بتوقيت العيادة
}

/**
 * الأوقات الفاضية لطبيب وخدمة بيوم معيّن.
 * taken: بدايات الأرباع المحجوزة (ms) للطبيب.
 */
export function availableSlots(opts: {
  doctorSlug: string;
  serviceId: string;
  date: string;
  now: Date;
  taken: Set<number>;
}): Slot[] {
  const doctor = getDoctor(opts.doctorSlug);
  const service = getService(opts.serviceId);
  if (!doctor || !service || !doctor.services.includes(service.id)) return [];
  if (!workingDays(doctor, opts.now).includes(opts.date)) return [];

  const hours = doctor.hours[weekdayOf(opts.date)]!;
  const open = toMinutes(hours[0]);
  const close = toMinutes(hours[1]);
  const earliest = opts.now.getTime() + MIN_NOTICE_MINUTES * 60_000;

  const slots: Slot[] = [];
  for (let m = open; m + service.minutes <= close; m += SLOT_MINUTES) {
    const start = clinicTime(opts.date, m);
    if (start.getTime() < earliest) continue;
    const free = slotBlocks(start, service.minutes).every((b) => !opts.taken.has(b.getTime()));
    if (free) slots.push({ start: start.toISOString(), time: formatHHMM(m) });
  }
  return slots;
}

/** أقرب موعد فاضي لطبيب (لأقصر خدمة عنده) */
export function nextAvailable(doctorSlug: string, now: Date, taken: Set<number>) {
  const doctor = getDoctor(doctorSlug);
  if (!doctor) return null;
  const shortest = doctor.services
    .map((id) => getService(id)!)
    .sort((a, b) => a.minutes - b.minutes)[0]!;
  for (const date of workingDays(doctor, now)) {
    const [first] = availableSlots({ doctorSlug, serviceId: shortest.id, date, now, taken });
    if (first) return { date, ...first };
  }
  return null;
}
