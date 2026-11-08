import { describe, expect, it } from "vitest";
import { DOCTORS, getDoctor } from "./clinic";
import { availableSlots, clinicParts, clinicTime, nextAvailable, slotBlocks, workingDays } from "./schedule";

// السبت 7 نوفمبر 2026، الساعة 8 الصبح بتوقيت غزة (UTC+2 بالشتوية)
const NOW = new Date("2026-11-07T06:00:00Z");

describe("clinic time", () => {
  it("converts clinic wall time to UTC and back", () => {
    expect(clinicTime("2026-11-07", 9 * 60).toISOString()).toBe("2026-11-07T07:00:00.000Z");
    expect(clinicParts(NOW)).toMatchObject({ date: "2026-11-07", minutes: 8 * 60, weekday: 6 });
  });

  it("round-trips in summer time too", () => {
    const t = clinicTime("2026-07-01", 10 * 60 + 30);
    expect(clinicParts(t)).toMatchObject({ date: "2026-07-01", minutes: 630 });
  });
});

describe("working days", () => {
  it("never includes Friday and stays inside the booking window", () => {
    for (const doctor of DOCTORS) {
      const days = workingDays(doctor, NOW);
      expect(days.every((d) => new Date(`${d}T12:00:00Z`).getUTCDay() !== 5)).toBe(true);
      expect(days.at(-1)! <= "2026-11-28").toBe(true);
    }
  });

  it("follows each doctor's own week", () => {
    // د. ليث: أحد، ثلاثاء، خميس
    expect(workingDays(getDoctor("laith")!, NOW).slice(0, 3)).toEqual(["2026-11-08", "2026-11-10", "2026-11-12"]);
  });
});

describe("available slots", () => {
  const base = { doctorSlug: "rana", serviceId: "cleaning", date: "2026-11-07", now: NOW, taken: new Set<number>() };

  it("lists every quarter hour that fits the treatment before closing", () => {
    const slots = availableSlots(base);
    expect(slots[0]!.time).toBe("09:00");
    expect(slots.at(-1)!.time).toBe("14:15"); // 45 دقيقة لحد 15:00
    expect(slots).toHaveLength(22);
  });

  it("needs at least an hour's notice", () => {
    const slots = availableSlots({ ...base, now: new Date("2026-11-07T09:10:00Z") }); // 11:10
    expect(slots[0]!.time).toBe("12:15");
  });

  it("skips any start that would overlap a booked quarter", () => {
    const taken = new Set(slotBlocks(clinicTime("2026-11-07", 10 * 60), 30).map((d) => d.getTime())); // 10:00–10:30
    const times = availableSlots({ ...base, taken }).map((s) => s.time);
    expect(times).not.toContain("09:30"); // 09:30–10:15 بيتقاطع
    expect(times).not.toContain("10:15");
    expect(times).toContain("09:15"); // بيخلص 10:00 بالضبط
    expect(times).toContain("10:30");
  });

  it("returns nothing for a treatment the doctor doesn't do, or a day off", () => {
    expect(availableSlots({ ...base, serviceId: "implant" })).toEqual([]);
    expect(availableSlots({ ...base, date: "2026-11-13" })).toEqual([]); // جمعة
  });

  it("finds the next free time", () => {
    expect(nextAvailable("rana", NOW, new Set())).toMatchObject({ date: "2026-11-07", time: "09:00" });
    expect(nextAvailable("laith", NOW, new Set())).toMatchObject({ date: "2026-11-08", time: "12:00" });
  });
});
