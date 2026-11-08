import { sessionCookie } from "@/server/clinicAuth";

export async function POST() {
  return new Response(null, { status: 204, headers: { "Set-Cookie": sessionCookie("", 0) } });
}
