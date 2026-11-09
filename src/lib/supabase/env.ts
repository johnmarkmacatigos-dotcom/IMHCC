export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True once the Supabase project is connected through environment variables. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
