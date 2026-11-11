import "server-only";
import { z } from "zod";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
  celebrate?: { title: string; next?: { href: string; label: string } };
};

/** Turns a zod error into "first message per field" for the form. */
export function fieldErrors(error: z.ZodError): ActionState {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return { error: "Please check the highlighted fields.", fieldErrors: out };
}

/** Reads a FormData into a plain object; checkboxes become booleans, "list" fields become arrays. */
export function formObject(fd: FormData, opts: { booleans?: string[]; lists?: string[] } = {}) {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (k.startsWith("$ACTION")) continue;
    if (typeof v === "string") obj[k] = v;
  }
  for (const b of opts.booleans ?? []) obj[b] = fd.get(b) === "on" || fd.get(b) === "true";
  for (const l of opts.lists ?? []) {
    obj[l] = String(fd.get(l) ?? "")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return obj;
}

export const text = (max: number, label = "This") => z.string().trim().max(max, `${label} is too long (max ${max} characters)`);
export const required = (max: number, label: string) => text(max, label).min(1, `${label} is required`);
/** Empty string becomes null so optional database columns stay clean. */
export const optional = (max: number, label = "This") => text(max, label).transform((v) => (v === "" ? null : v));
export const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || /^https?:\/\//.test(v) || v.startsWith("/"), "Use a full link starting with https://");
export const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a valid date");
export const list = z.array(z.string().max(200)).max(40);
export const slug = z
  .string()
  .trim()
  .toLowerCase()
  .max(80)
  .regex(/^[a-z0-9-]*$/, "Use lowercase letters, numbers, and dashes only");

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Friendly message for common database errors. */
export function dbError(error: { code?: string; message: string }, what = "this item"): ActionState {
  if (error.code === "23505") return { error: `Another ${what} already uses that web address (slug). Change it and save again.` };
  if (error.code === "23514") return { error: "One of the values is not allowed. Testimonials need the customer's consent before they can be shown." };
  if (error.code === "42501") return { error: "Your role doesn't allow this change. Ask the owner or an admin to make it for you, or to give you a role that can (Dashboard → Team)." };
  console.error("[admin] database error", error);
  return { error: "Couldn't save just now. Nothing was changed. Check your connection and press Save again; if it keeps failing, wait a minute and retry." };
}
