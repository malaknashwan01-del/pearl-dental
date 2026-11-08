import { getDays } from "@/server/bookings";
import { handle } from "@/server/http";

// أيام دوام الطبيب خلال فترة الحجز
export const GET = handle(async (db, request: Request) => {
  const days = await getDays(db, new URL(request.url).searchParams.get("doctor") ?? "");
  return Response.json({ days });
});
