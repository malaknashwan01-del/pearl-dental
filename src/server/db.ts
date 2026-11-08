import "server-only";
import { mkdirSync } from "node:fs";
import { sql } from "drizzle-orm";
import { integer, pgTable, primaryKey, serial, text, timestamp } from "drizzle-orm/pg-core";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  service: text("service").notNull(),
  doctor: text("doctor").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  patientName: text("patient_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  note: text("note"),
  locale: text("locale").notNull().default("ar"),
  status: text("status", { enum: ["booked", "attended", "no_show", "cancelled"] }).notNull().default("booked"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * كل ربع ساعة محجوز عند طبيب = سطر هون.
 * المفتاح (doctor, slot_start) فريد، فلو مريضين حاولوا ياخذوا نفس الوقت
 * بنفس اللحظة، قاعدة البيانات نفسها بترفض الثاني.
 */
export const bookingSlots = pgTable(
  "booking_slots",
  {
    doctor: text("doctor").notNull(),
    slotStart: timestamp("slot_start", { withTimezone: true }).notNull(),
    bookingId: integer("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.doctor, t.slotStart] })]
);

export type DB = PgDatabase<PgQueryResultHKT>;
export type Booking = typeof bookings.$inferSelect;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS bookings (
    id serial PRIMARY KEY,
    code text NOT NULL UNIQUE,
    service text NOT NULL,
    doctor text NOT NULL,
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    patient_name text NOT NULL,
    phone text NOT NULL,
    email text,
    note text,
    locale text NOT NULL DEFAULT 'ar',
    status text NOT NULL DEFAULT 'booked' CHECK (status IN ('booked','attended','no_show','cancelled')),
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS bookings_starts_at_idx ON bookings (starts_at);
  CREATE TABLE IF NOT EXISTS booking_slots (
    doctor text NOT NULL,
    slot_start timestamptz NOT NULL,
    booking_id integer NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    PRIMARY KEY (doctor, slot_start)
  );
`;

/** بننشئ الجداول إذا مش موجودة — بأمر لكل جدول لأنه السائق ما بيقبل أكثر من أمر */
async function ensureSchema(db: DB) {
  for (const statement of SCHEMA.split(";").map((x) => x.trim()).filter(Boolean)) {
    await db.execute(sql.raw(statement));
  }
}

/**
 * - DATABASE_URL (postgres://...) → Postgres حقيقي (Neon على النشر)
 * - "memory://" → قاعدة بالذاكرة للاختبارات
 * - بدون، أو "local" → Postgres مدمج محفوظ بمجلد .data للتطوير
 */
export async function createDb(url = process.env.DATABASE_URL): Promise<{ db: DB; close: () => Promise<void> }> {
  if (url?.startsWith("postgres")) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const pool = new Pool({ connectionString: url, max: 3 });
    const db = drizzle(pool) as unknown as DB;
    await ensureSchema(db);
    return { db, close: () => pool.end() };
  }

  // بالنشر لازم قاعدة حقيقية — إلا إذا طلبنا القاعدة المحلية صراحة (DATABASE_URL=local)
  if (process.env.NODE_ENV === "production" && !url) {
    throw new Error("DATABASE_URL must be set in production");
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  let client;
  if (url === "memory://") {
    client = new PGlite();
  } else {
    mkdirSync(".data", { recursive: true });
    client = new PGlite(".data/pgdata");
  }
  const db = drizzle(client) as unknown as DB;
  await ensureSchema(db);
  return { db, close: () => client.close() };
}

// اتصال واحد للتطبيق كله — محفوظ على globalThis عشان التحديث السريع بالتطوير ما يفتح اتصالات جديدة
const globalForDb = globalThis as unknown as { pearlDb?: Promise<{ db: DB }> };

export function getDb() {
  globalForDb.pearlDb ??= createDb();
  return globalForDb.pearlDb.then((x) => x.db);
}
