import { createBrowserClient } from "@supabase/ssr";
import { dbSchema, isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

let client: ReturnType<typeof createBrowserClient> | null = null;

/** Signed-in browser client for the dashboard (used for direct photo uploads). */
export function getBrowserClient() {
  if (!isSupabaseConfigured) return null;
  client ??= createBrowserClient(supabaseUrl, supabaseAnonKey, { db: { schema: dbSchema } });
  return client;
}
