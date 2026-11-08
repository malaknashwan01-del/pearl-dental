import { checkPassword, sessionCookie } from "@/server/clinicAuth";
import { BookingError } from "@/server/bookings";
import { readJson } from "@/server/http";

export async function POST(request: Request) {
  try {
    const { password } = await readJson(request);
    const value = await checkPassword(password);
    return new Response(null, { status: 204, headers: { "Set-Cookie": sessionCookie(value) } });
  } catch (err) {
    if (err instanceof BookingError) return Response.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
