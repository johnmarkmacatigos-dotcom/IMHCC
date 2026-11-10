export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True once the Supabase project is connected through environment variables. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Database schema and storage buckets used by this site. They carry an "imhcc" prefix so the
 * site can share a Supabase project with other apps without clashing. */
export const dbSchema = "imhcc";
export const buckets = { media: "imhcc-media", inquiryUploads: "imhcc-inquiry-uploads" } as const;
