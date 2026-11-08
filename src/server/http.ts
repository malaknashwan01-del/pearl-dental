import "server-only";
import { connection } from "next/server";
import { BookingError } from "./bookings";
import { getDb, type DB } from "./db";

/** كل الأخطاء بترجع بنفس الشكل: { error, reason, fields } */
export function handle<A extends unknown[]>(fn: (db: DB, ...args: A) => Promise<Response>) {
  return async (...args: A) => {
    // بيخلي الرد يتحسب وقت الطلب، مش وقت بناء الموقع (ما بنفتح قاعدة البيانات وقت البناء)
    await connection();
    try {
      return await fn(await getDb(), ...args);
    } catch (err) {
      if (err instanceof BookingError) {
        return Response.json({ error: err.message, reason: err.reason, fields: err.fields }, { status: err.status });
      }
      console.error(err);
      return Response.json({ error: "Something went wrong", reason: "server" }, { status: 500 });
    }
  };
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new BookingError(400, "invalid", "Invalid JSON");
  }
}
