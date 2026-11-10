"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server";
import type { FormState } from "@/components/admin/Form";

const email = z.string().trim().toLowerCase().email("Enter a valid email");

function safeNext(value: FormDataEntryValue | null) {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/admin") && !v.startsWith("//") ? v : "/admin";
}

async function siteOrigin(path: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const base = host ? `${h.get("x-forwarded-proto") ?? "https"}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL ?? "");
  return `${base}${path}`;
}

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  const db = await getServerClient();
  if (!db) return { error: "The dashboard is not connected to the database yet." };
  const parsed = z.object({ email, password: z.string().min(1, "Enter your password") }).safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await db.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message.includes("confirm") ? "Please confirm your email first, using the link we sent you." : "Wrong email or password." };
  // The sign-in account may come from another app on the same Supabase project.
  // join_team() gives it a dashboard profile (waiting for access) if it has none yet.
  await db.rpc("join_team");
  redirect(safeNext(fd.get("next")));
}

export async function signUp(_: FormState, fd: FormData): Promise<FormState> {
  const db = await getServerClient();
  if (!db) return { error: "The dashboard is not connected to the database yet." };
  const parsed = z
    .object({
      full_name: z.string().trim().min(2, "Enter your name").max(120),
      email,
      password: z.string().min(10, "Use at least 10 characters for your password").max(72),
    })
    .safeParse({ full_name: fd.get("full_name"), email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { data, error } = await db.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    // The Supabase project may be shared with other apps, so send the confirmation link
    // back to this website rather than the project's default Site URL.
    options: { data: { full_name: parsed.data.full_name, app: "imhcc" }, emailRedirectTo: await siteOrigin("/admin/auth/confirm") },
  });
  if (error) return { error: error.message.includes("registered") ? "That email already has an account. Sign in with its password instead." : "Could not create the account. Please try again." };
  if (!data.session) return { message: "Account created. Check your email for the confirmation link, then sign in." };
  redirect("/admin");
}

export async function signOut() {
  const db = await getServerClient();
  await db?.auth.signOut();
  redirect("/admin/login");
}
