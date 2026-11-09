"use server";

import { z } from "zod";
import type { FormState } from "@/components/admin/Form";
import { dbError, fieldErrors, formObject, optional, optionalUrl, required } from "@/lib/admin/forms";
import { refreshSite } from "@/lib/admin/revalidate";
import { logActivity, requireAdmin } from "@/lib/admin/session";

const coord = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(z.number({ message: "Enter a number" }).min(min).max(max).nullable());

const schema = z.object({
  company_name: required(160, "Business name"),
  tagline: optional(300, "Tagline"),
  hero_title: optional(160, "Homepage headline"),
  hero_subtitle: optional(500, "Homepage text"),
  phone_primary: optional(40, "Phone"),
  phone_secondary: optional(40, "Second phone"),
  email: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.string().email("Enter a valid email").nullable()),
  address: optional(300, "Address"),
  business_hours: optional(200, "Business hours"),
  facebook_url: optionalUrl,
  messenger_url: optionalUrl,
  latitude: coord(-90, 90),
  longitude: coord(-180, 180),
  about_intro: optional(3000, "About"),
  mission: optional(1500, "Mission"),
  vision: optional(1500, "Vision"),
  stats: z.array(z.object({ value: z.string().max(20), label: z.string().max(60) })).max(6),
});

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  const s = await requireAdmin("manage");
  const raw = formObject(fd, { lists: ["stats"] });
  raw.stats = (raw.stats as string[]).map((line) => {
    const [value, ...rest] = line.split("|");
    return { value: value.trim(), label: rest.join("|").trim() };
  });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return fieldErrors(parsed.error);
  const { error } = await s.db.from("site_settings").update(parsed.data).eq("id", 1);
  if (error) return dbError(error, "setting");
  await logActivity(s, "updated", "website settings", "1");
  refreshSite();
  return { message: "Saved. The website shows the changes within a few minutes." };
}
