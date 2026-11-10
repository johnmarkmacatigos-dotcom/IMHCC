import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { dbSchema, isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

type PublicClient = SupabaseClient<any, typeof dbSchema>; // eslint-disable-line @typescript-eslint/no-explicit-any
let client: PublicClient | null = null;

/**
 * Anonymous client for reading published content and submitting inquiries.
 * Row Level Security limits it to public data and the submit_inquiry() function.
 */
export function getPublicClient(): PublicClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: dbSchema },
    });
  }
  return client;
}
