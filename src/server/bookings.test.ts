import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDb, type DB } from "./db";
import { BookingError, cancelBooking, createBooking, getAvailability, getBooking, getSchedule, setStatus } from "./bookings";

const NOW = new Date("2026-11-07T06:00:00Z"); // السبت 8:00 بتوقيت غزة
const at = (hhmm: string, date = "2026-11-07") => {
  const [h, m] = hhmm.split(":").map(Number);
  // الشتوية: غزة UTC+2
  return new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8)), h! - 2, m!)).toISOString();
};

const patient = { name: "Sara Ahmad", phone: "0599 123 456", locale: "ar" as const };
let db: DB;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await createDb("memory://"));
});
afterAll(() => close());

async function expectError(promise: Promise<unknown>, reason: BookingError["reason"]) {
  const err = await promise.then(
    () => null,
    (e) => e
  );
  expect(err).toBeInstanceOf(BookingError);
  expect((err as BookingError).reason).toBe(reason);
  return err as BookingError;
}

describe("booking", () => {
  it("books a free time and returns a reference code", async () => {
    const booking = await createBooking(db, { ...patient, service: "cleaning", doctor: "rana", start: at("09:00") }, NOW);
    expect(booking.code).toMatch(/^PD-[A-Z2-9]{6}$/);
    expect(booking.endsAt.toISOString()).toBe(at("09:45"));
  });

  it("refuses any time that overlaps an existing visit", async () => {
    await expectError(createBooking(db, { ...patient, service: "cleaning", doctor: "rana", start: at("09:30") }, NOW), "taken");
    const times = (await getAvailability(db, { doctor: "rana", service: "cleaning", date: "2026-11-07" }, NOW)).map((s) => s.time);
    expect(times[0]).toBe("09:45");
  });

  it("lets only one of two simultaneous requests win the same time", async () => {
    const req = { ...patient, service: "whitening", doctor: "rana", start: at("12:00") };
    const results = await Promise.allSettled([createBooking(db, req, NOW), createBooking(db, req, NOW)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const failed = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect((failed.reason as BookingError).reason).toBe("taken");
  });

  it("keeps doctors' calendars separate", async () => {
    await createBooking(db, { ...patient, service: "aligners", doctor: "sara", start: at("12:00") }, NOW);
  });

  it("rejects bad details, wrong doctor and times outside the schedule", async () => {
    const err = await expectError(
      createBooking(db, { service: "cleaning", doctor: "rana", start: at("10:00"), name: "S", phone: "12" }, NOW),
      "invalid"
    );
    expect(Object.keys(err.fields).sort()).toEqual(["name", "phone"]);
    await expectError(createBooking(db, { ...patient, service: "implant", doctor: "rana", start: at("10:00") }, NOW), "invalid");
    await expectError(createBooking(db, { ...patient, service: "cleaning", doctor: "rana", start: at("16:00") }, NOW), "taken");
    await expectError(createBooking(db, { ...patient, service: "cleaning", doctor: "rana", start: at("09:07") }, NOW), "taken");
  });

  it("ignores bots that fill the hidden field", async () => {
    await expectError(
      createBooking(db, { ...patient, service: "cleaning", doctor: "rana", start: at("13:00"), website: "spam.example" }, NOW),
      "invalid"
    );
  });
});

describe("managing a booking", () => {
  it("only shows a booking to someone with the matching phone", async () => {
    const b = await createBooking(db, { ...patient, service: "checkup", doctor: "laith", start: at("15:00", "2026-11-10") }, NOW);
    await expectError(getBooking(db, b.code, "0599 000 000"), "not_found");
    expect((await getBooking(db, b.code.toLowerCase(), "+970 599 123 456")).id).toBe(b.id);
  });

  it("cancels and frees the time", async () => {
    const start = at("16:00", "2026-11-10");
    const b = await createBooking(db, { ...patient, service: "checkup", doctor: "laith", start }, NOW);
    const before = await getAvailability(db, { doctor: "laith", service: "checkup", date: "2026-11-10" }, NOW);
    expect(before.some((s) => s.start === start)).toBe(false);

    expect((await cancelBooking(db, b.code, patient.phone, NOW)).status).toBe("cancelled");
    const after = await getAvailability(db, { doctor: "laith", service: "checkup", date: "2026-11-10" }, NOW);
    expect(after.some((s) => s.start === start)).toBe(true);
  });

  it("doesn't allow online cancelling within 12 hours", async () => {
    const b = await createBooking(db, { ...patient, service: "filling", doctor: "rana", start: at("14:00") }, NOW);
    await expectError(cancelBooking(db, b.code, patient.phone, NOW), "too_late");
  });
});

describe("clinic dashboard", () => {
  it("lists the day's visits in order and updates status", async () => {
    const day = await getSchedule(db, "2026-11-07");
    const times = day.map((b) => b.startsAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));

    const first = day[0]!;
    expect((await setStatus(db, first.id, "attended")).status).toBe("attended");
    await setStatus(db, first.id, "cancelled");
    await expectError(setStatus(db, first.id, "booked"), "invalid");
  });
});
