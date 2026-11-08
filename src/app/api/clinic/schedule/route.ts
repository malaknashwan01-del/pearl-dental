import { getSchedule } from "@/server/bookings";
import { requireClinic } from "@/server/clinicAuth";
import { handle } from "@/server/http";

export const GET = handle(async (db, request: Request) => {
  requireClinic(request);
  const date = new URL(request.url).searchParams.get("date") ?? "";
  const rows = await getSchedule(db, date);
  return Response.json({
    bookings: rows.map((b) => ({
      id: b.id,
      code: b.code,
      service: b.service,
      doctor: b.doctor,
      start: b.startsAt.toISOString(),
      end: b.endsAt.toISOString(),
      name: b.patientName,
      phone: b.phone,
      email: b.email,
      note: b.note,
      status: b.status,
    })),
  });
});
