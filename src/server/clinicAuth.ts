import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { BookingError } from "./bookings";

export const CLINIC_COOKIE = "pearl_clinic";

function password() {
  const value = process.env.CLINIC_PASSWORD;
  if (value) return value;
  if (process.env.NODE_ENV === "production") throw new Error("CLINIC_PASSWORD must be set in production");
  return "clinic1234"; // للتطوير بس
}

/** قيمة الكوكي = توقيع، فما حدا بيقدر يزوّرها بدون السر */
const sessionValue = () =>
  createHmac("sha256", process.env.SESSION_SECRET ?? password()).update("pearl-clinic-session-v1").digest("hex");

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export async function checkPassword(attempt: unknown) {
  if (typeof attempt === "string" && same(attempt, password())) return sessionValue();
  // تأخير بسيط بيبطّئ تخمين كلمة السر
  await new Promise((r) => setTimeout(r, 600));
  throw new BookingError(401, "invalid", "Wrong password");
}

export function sessionCookie(value: string, maxAge = 60 * 60 * 12) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${CLINIC_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function requireClinic(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const value = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CLINIC_COOKIE}=`))
    ?.slice(CLINIC_COOKIE.length + 1);
  if (!value || !same(value, sessionValue())) throw new BookingError(401, "invalid", "Please sign in");
}
