import { getAvailability } from "@/server/bookings";
import { handle } from "@/server/http";

// الأوقات الفاضية: /api/availability?doctor=rana&service=cleaning&date=2026-11-08
export const GET = handle(async (db, request: Request) => {
  const q = new URL(request.url).searchParams;
  const slots = await getAvailability(db, {
    doctor: q.get("doctor") ?? "",
    service: q.get("service") ?? "",
    date: q.get("date") ?? "",
  });
  return Response.json({ slots });
});
