import { cancelBooking, toPublic } from "@/server/bookings";
import { handle, readJson } from "@/server/http";

export const POST = handle(async (db, request: Request) => {
  const { code, phone } = await readJson(request);
  const booking = await cancelBooking(db, String(code ?? ""), String(phone ?? ""));
  return Response.json({ booking: toPublic(booking) });
});
