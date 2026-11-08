import { connection } from "next/server";
import { getNextAvailable } from "@/server/bookings";
import { handle } from "@/server/http";

// أقرب موعد لكل طبيب — بيتحسب وقت الطلب
export const GET = handle(async (db) => {
  await connection();
  return Response.json({ next: await getNextAvailable(db) });
});
