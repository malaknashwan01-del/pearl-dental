import "server-only";
import { randomInt } from "node:crypto";
import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";
import { z } from "zod";
import { CANCEL_NOTICE_HOURS, DOCTORS, getDoctor, getService } from "@/lib/clinic";
import { availableSlots, clinicParts, clinicTime, addDays, isDateString, nextAvailable, slotBlocks, workingDays } from "@/lib/schedule";
import { bookingSlots, bookings, type Booking, type DB } from "./db";

export class BookingError extends Error {
  constructor(
    public status: number,
    public reason: "invalid" | "taken" | "not_found" | "too_late",
    message: string,
    public fields: Record<string, string> = {}
  ) {
    super(message);
  }
}

/** بنقارن الأرقام بآخر 9 خانات، فـ 0599… و +970599… نفس الرقم */
export const normalizePhone = (phone: string) => phone.replace(/\D/g, "").slice(-9);

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // بدون حروف بتتلخبط زي O و 0
const newCode = () => "PD-" + Array.from({ length: 6 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");

/** الأرباع المحجوزة لطبيب بين لحظتين */
async function takenFor(db: DB, doctor: string, from: Date, to: Date) {
  const rows = await db
    .select({ slotStart: bookingSlots.slotStart })
    .from(bookingSlots)
    .where(and(eq(bookingSlots.doctor, doctor), gte(bookingSlots.slotStart, from), lt(bookingSlots.slotStart, to)));
  return new Set(rows.map((r) => r.slotStart.getTime()));
}

export async function getAvailability(db: DB, input: { doctor: string; service: string; date: string }, now = new Date()) {
  if (!isDateString(input.date)) throw new BookingError(400, "invalid", "Invalid date");
  const taken = await takenFor(db, input.doctor, clinicTime(input.date, 0), clinicTime(addDays(input.date, 1), 0));
  return availableSlots({ doctorSlug: input.doctor, serviceId: input.service, date: input.date, now, taken });
}

export async function getDays(db: DB, doctorSlug: string, now = new Date()) {
  const doctor = getDoctor(doctorSlug);
  if (!doctor) throw new BookingError(404, "not_found", "Doctor not found");
  return workingDays(doctor, now);
}

/** أقرب موعد لكل طبيب — للكروت بالصفحة الرئيسية */
export async function getNextAvailable(db: DB, now = new Date()) {
  const today = clinicParts(now).date;
  const from = clinicTime(today, 0);
  const to = clinicTime(addDays(today, 22), 0);
  const result: Record<string, { date: string; time: string; start: string } | null> = {};
  for (const d of DOCTORS) {
    result[d.slug] = nextAvailable(d.slug, now, await takenFor(db, d.slug, from, to));
  }
  return result;
}

export const bookingInput = z.object({
  service: z.string(),
  doctor: z.string(),
  start: z.iso.datetime(),
  name: z.string().trim().min(2, "name").max(80),
  phone: z
    .string()
    .trim()
    .refine((v) => /^\+?[\d\s-]{9,16}$/.test(v), "phone"),
  email: z.union([z.literal(""), z.email("email")]).optional(),
  note: z.string().trim().max(400).optional(),
  locale: z.enum(["ar", "en"]).default("ar"),
  // حقل مخفي — البوتات بتعبيه، البشر لا
  website: z.string().max(0).optional(),
});

export async function createBooking(db: DB, raw: unknown, now = new Date()) {
  const parsed = bookingInput.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    throw new BookingError(400, "invalid", "Please check the highlighted fields", fields);
  }
  const input = parsed.data;
  const service = getService(input.service);
  const doctor = getDoctor(input.doctor);
  if (!service || !doctor || !doctor.services.includes(service.id)) {
    throw new BookingError(400, "invalid", "This doctor doesn't offer that treatment");
  }

  // الوقت لازم يكون واحد من الأوقات الفاضية فعلاً — ما بنثق بالمتصفح
  const start = new Date(input.start);
  const date = clinicParts(start).date;
  const slots = await getAvailability(db, { doctor: doctor.slug, service: service.id, date }, now);
  if (!slots.some((s) => s.start === start.toISOString())) {
    throw new BookingError(409, "taken", "That time is no longer available");
  }

  const end = new Date(start.getTime() + service.minutes * 60_000);
  try {
    return await db.transaction(async (tx) => {
      const [booking] = await tx
        .insert(bookings)
        .values({
          code: newCode(),
          service: service.id,
          doctor: doctor.slug,
          startsAt: start,
          endsAt: end,
          patientName: input.name,
          phone: input.phone,
          email: input.email || null,
          note: input.note || null,
          locale: input.locale,
        })
        .returning();
      await tx
        .insert(bookingSlots)
        .values(slotBlocks(start, service.minutes).map((slotStart) => ({ doctor: doctor.slug, slotStart, bookingId: booking!.id })));
      return booking!;
    });
  } catch (err) {
    // 23505 = تكرار بالمفتاح الفريد: حدا ثاني حجز نفس الوقت قبلنا بلحظة
    if (isUniqueViolation(err)) throw new BookingError(409, "taken", "That time was just taken");
    throw err;
  }
}

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; cause?: unknown };
  return e.code === "23505" || isUniqueViolation(e.cause);
}

async function findOwned(db: DB, code: string, phone: string) {
  const [booking] = await db.select().from(bookings).where(eq(bookings.code, code.trim().toUpperCase()));
  // نفس الرد إذا الكود غلط أو الرقم غلط، عشان ما حدا يخمّن حجوزات غيره
  if (!booking || normalizePhone(booking.phone) !== normalizePhone(phone)) {
    throw new BookingError(404, "not_found", "Booking not found");
  }
  return booking;
}

export const toPublic = (b: Booking) => ({
  code: b.code,
  service: b.service,
  doctor: b.doctor,
  start: b.startsAt.toISOString(),
  end: b.endsAt.toISOString(),
  name: b.patientName,
  status: b.status,
});

export const getBooking = (db: DB, code: string, phone: string) => findOwned(db, code, phone);

export async function cancelBooking(db: DB, code: string, phone: string, now = new Date()) {
  const booking = await findOwned(db, code, phone);
  if (booking.status !== "booked") return booking;
  if (booking.startsAt.getTime() - now.getTime() < CANCEL_NOTICE_HOURS * 3600_000) {
    throw new BookingError(409, "too_late", "Online cancellation closes 12 hours before the visit");
  }
  return db.transaction(async (tx) => {
    await tx.delete(bookingSlots).where(eq(bookingSlots.bookingId, booking.id));
    const [updated] = await tx.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, booking.id)).returning();
    return updated!;
  });
}

/* ---------------- للعيادة ---------------- */

export async function getSchedule(db: DB, date: string) {
  if (!isDateString(date)) throw new BookingError(400, "invalid", "Invalid date");
  return db
    .select()
    .from(bookings)
    .where(and(gte(bookings.startsAt, clinicTime(date, 0)), lt(bookings.startsAt, clinicTime(addDays(date, 1), 0))))
    .orderBy(asc(bookings.startsAt));
}

export const STATUSES = ["booked", "attended", "no_show", "cancelled"] as const;

export async function setStatus(db: DB, id: number, status: (typeof STATUSES)[number]) {
  return db.transaction(async (tx) => {
    const [current] = await tx.select({ status: bookings.status }).from(bookings).where(eq(bookings.id, id));
    if (!current) throw new BookingError(404, "not_found", "Booking not found");
    // الوقت الملغي ممكن يكون انحجز لغيره، فما بنرجّعه
    if (current.status === "cancelled") throw new BookingError(409, "invalid", "A cancelled booking can't be reopened");
    const [updated] = await tx.update(bookings).set({ status }).where(eq(bookings.id, id)).returning();
    // الإلغاء بيفضّي الوقت لغيره
    if (status === "cancelled") await tx.delete(bookingSlots).where(inArray(bookingSlots.bookingId, [id]));
    return updated;
  });
}
