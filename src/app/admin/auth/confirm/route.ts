import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/** Landing page for the sign-up confirmation email: signs the person in, then opens the dashboard. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const db = await getServerClient();

  let ok = false;
  if (db && code) ok = !(await db.auth.exchangeCodeForSession(code)).error;
  else if (db && tokenHash && type) ok = !(await db.auth.verifyOtp({ token_hash: tokenHash, type })).error;

  const dest = url.clone();
  dest.search = "";
  dest.pathname = ok ? "/admin" : "/admin/login";
  if (!ok) dest.searchParams.set("confirmed", "1");
  return NextResponse.redirect(dest);
}
