"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/admin/Form";
import { dbError, fieldErrors, formObject, list, optional, optionalUrl, required, slug, slugify } from "@/lib/admin/forms";
import { refreshSite } from "@/lib/admin/revalidate";
import { logActivity, requireAdmin } from "@/lib/admin/session";

const schema = z.object({
  name: required(120, "Name"),
  slug,
  category: required(60, "Category"),
  summary: optional(400, "Summary"),
  description: optional(6000, "Description"),
  scope: list,
  cover_image: optionalUrl,
  sort_order: z.coerce.number().int().min(-1000).max(1000).default(0),
  is_featured: z.boolean(),
  is_published: z.boolean(),
});

export async function saveService(_: FormState, fd: FormData): Promise<FormState> {
  const s = await requireAdmin("edit");
  const id = String(fd.get("id") ?? "");
  const parsed = schema.safeParse(formObject(fd, { booleans: ["is_featured", "is_published"], lists: ["scope"] }));
  if (!parsed.success) return fieldErrors(parsed.error);
  const values = { ...parsed.data, slug: parsed.data.slug || slugify(parsed.data.name) };
  if (id) {
    const { error } = await s.db.from("services").update(values).eq("id", id);
    if (error) return dbError(error, "service");
    await logActivity(s, "updated", "service", id, { name: values.name });
    refreshSite();
    return { message: "Saved." };
  }
  const { data, error } = await s.db.from("services").insert(values).select("id").single();
  if (error) return dbError(error, "service");
  await logActivity(s, "created", "service", data.id, { name: values.name });
  refreshSite();
  redirect("/admin/services");
}

export async function deleteService(fd: FormData) {
  const s = await requireAdmin("edit");
  const id = z.string().uuid().parse(fd.get("id"));
  const { error } = await s.db.from("services").delete().eq("id", id);
  if (error) throw new Error("Could not delete.");
  await logActivity(s, "deleted", "service", id);
  refreshSite();
  redirect("/admin/services");
}
