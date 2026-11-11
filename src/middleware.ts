import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

const openPaths = ["/admin/login", "/admin/signup", "/admin/auth/confirm", "/admin/session"];

/** Keeps the dashboard session fresh and sends signed-out visitors to the sign-in page. */
export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });
  const db = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  const {
    data: { user },
  } = await db.auth.getUser();

  const path = request.nextUrl.pathname;
  const isOpen = openPaths.some((p) => path === p);
  if (!user && !isOpen) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    // A sign-in cookie that no longer works means the session ran out (not a first visit),
    // so the sign-in page can explain that and promise the unsaved work is kept.
    const hadSession = request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
    const params = new URLSearchParams();
    if (path !== "/admin") params.set("next", path + request.nextUrl.search);
    if (hadSession) params.set("expired", "1");
    url.search = params.size ? `?${params}` : "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
