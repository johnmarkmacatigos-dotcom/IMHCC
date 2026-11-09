import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Supabase client that acts as the signed-in dashboard user (session from cookies).
 * Row Level Security decides what that user may read and change.
 */
export async function getServerClient() {
  if (!isSupabaseConfigured) return null;
  const store = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only. The middleware refreshes them.
        }
      },
    },
  });
}

export type ServerClient = NonNullable<Awaited<ReturnType<typeof getServerClient>>>;
