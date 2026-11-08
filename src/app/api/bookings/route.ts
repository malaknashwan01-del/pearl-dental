import { createBooking, toPublic } from "@/server/bookings";
import { handle, readJson } from "@/server/http";

export const POST = handle(async (db, request: Request) => {
  const booking = await createBooking(db, await readJson(request));
  return Response.json({ booking: toPublic(booking) }, { status: 201 });
});
