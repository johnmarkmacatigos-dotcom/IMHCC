import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Tells the open dashboard whether the sign-in is still valid, without redirecting. */
export async function GET() {
  const db = await getServerClient();
  if (!db) return NextResponse.json({ active: false, reason: "not_connected" });
  const {
    data: { user },
  } = await db.auth.getUser();
  return NextResponse.json({ active: Boolean(user) }, { headers: { "Cache-Control": "no-store" } });
}
