"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/admin/Form";
import { dbError, fieldErrors, formObject, optional, optionalDate, optionalUrl, required } from "@/lib/admin/forms";
import { refreshSite } from "@/lib/admin/revalidate";
import { logActivity, requireAdmin } from "@/lib/admin/session";

const schema = z
  .object({
    title: required(160, "Title"),
    description: optional(3000, "Description"),
    banner_image: optionalUrl,
    terms: optional(3000, "Terms"),
    cta_label: optional(40, "Button text"),
    cta_url: optionalUrl,
    starts_on: optionalDate,
    ends_on: optionalDate,
    is_published: z.boolean(),
  })
  .refine((v) => !v.starts_on || !v.ends_on || v.ends_on >= v.starts_on, { path: ["ends_on"], message: "The end date must be on or after the start date." });

export async function savePromotion(_: FormState, fd: FormData): Promise<FormState> {
  const s = await requireAdmin("edit");
  const id = String(fd.get("id") ?? "");
  const parsed = schema.safeParse(formObject(fd, { booleans: ["is_published"] }));
  if (!parsed.success) return fieldErrors(parsed.error);
  const values = parsed.data;
  if (id) {
    const { error } = await s.db.from("promotions").update(values).eq("id", id);
    if (error) return dbError(error, "promotion");
    await logActivity(s, "updated", "promotion", id, { title: values.title });
    refreshSite();
    return { message: "Saved." };
  }
  const { data, error } = await s.db.from("promotions").insert(values).select("id").single();
  if (error) return dbError(error, "promotion");
  await logActivity(s, "created", "promotion", data.id, { title: values.title });
  refreshSite();
  redirect("/admin/promotions");
}

export async function deletePromotion(fd: FormData) {
  const s = await requireAdmin("edit");
  const id = z.string().uuid().parse(fd.get("id"));
  const { error } = await s.db.from("promotions").delete().eq("id", id);
  if (error) throw new Error("Could not delete.");
  await logActivity(s, "deleted", "promotion", id);
  refreshSite();
  redirect("/admin/promotions");
}
