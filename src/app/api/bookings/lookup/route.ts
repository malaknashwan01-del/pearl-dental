import { getBooking, toPublic } from "@/server/bookings";
import { handle, readJson } from "@/server/http";

// POST مش GET عشان رقم الهاتف ما يطلع بالرابط ولا بسجلات السيرفر
export const POST = handle(async (db, request: Request) => {
  const { code, phone } = await readJson(request);
  const booking = await getBooking(db, String(code ?? ""), String(phone ?? ""));
  return Response.json({ booking: toPublic(booking) });
});
