import { BookingError, setStatus, STATUSES } from "@/server/bookings";
import { requireClinic } from "@/server/clinicAuth";
import { handle, readJson } from "@/server/http";

export const PATCH = handle(async (db, request: Request, ctx: RouteContext<"/api/clinic/bookings/[id]">) => {
  requireClinic(request);
  const id = Number((await ctx.params).id);
  const { status } = await readJson(request);
  if (!Number.isInteger(id) || !STATUSES.includes(status)) throw new BookingError(400, "invalid", "Invalid status");
  const booking = await setStatus(db, id, status);
  return Response.json({ booking: { id: booking.id, status: booking.status } });
});
