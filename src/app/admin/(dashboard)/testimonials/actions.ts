"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/admin/Form";
import { dbError, fieldErrors, formObject, optional, optionalDate, optionalUrl, required } from "@/lib/admin/forms";
import { refreshSite } from "@/lib/admin/revalidate";
import { logActivity, requireAdmin } from "@/lib/admin/session";

const schema = z
  .object({
    customer_name: required(120, "Customer name"),
    customer_town: optional(120, "Town"),
    service_label: optional(120, "Service"),
    quote: required(1500, "Testimonial"),
    rating: z
      .string()
      .transform((v) => (v === "" ? null : Number(v)))
      .pipe(z.number().int().min(1).max(5).nullable()),
    photo_url: optionalUrl,
    project_id: z
      .string()
      .transform((v) => (v === "" ? null : v))
      .pipe(z.string().uuid().nullable()),
    consent_given: z.boolean(),
    consent_date: optionalDate,
    status: z.enum(["pending", "approved", "hidden"]),
    is_featured: z.boolean(),
  })
  .refine((v) => v.status !== "approved" || v.consent_given, {
    path: ["consent_given"],
    message: "Tick this only when the customer agreed. Approved testimonials need the customer's consent.",
  });

export async function saveTestimonial(_: FormState, fd: FormData): Promise<FormState> {
  const s = await requireAdmin("edit");
  const id = String(fd.get("id") ?? "");
  const parsed = schema.safeParse(formObject(fd, { booleans: ["consent_given", "is_featured"] }));
  if (!parsed.success) return fieldErrors(parsed.error);
  const values = { ...parsed.data, consent_date: parsed.data.consent_given ? (parsed.data.consent_date ?? new Date().toISOString().slice(0, 10)) : null };

  if (id) {
    const { error } = await s.db.from("testimonials").update(values).eq("id", id);
    if (error) return dbError(error, "testimonial");
    await logActivity(s, `updated (${values.status})`, "testimonial", id, { customer: values.customer_name });
    refreshSite();
    return { message: values.status === "approved" ? "Saved. It is shown on the website." : "Saved. It is not shown on the website." };
  }
  const { data, error } = await s.db.from("testimonials").insert(values).select("id").single();
  if (error) return dbError(error, "testimonial");
  await logActivity(s, "created", "testimonial", data.id, { customer: values.customer_name });
  refreshSite();
  redirect("/admin/testimonials");
}

export async function deleteTestimonial(fd: FormData) {
  const s = await requireAdmin("edit");
  const id = z.string().uuid().parse(fd.get("id"));
  const { error } = await s.db.from("testimonials").delete().eq("id", id);
  if (error) throw new Error("Could not delete.");
  await logActivity(s, "deleted", "testimonial", id);
  refreshSite();
  redirect("/admin/testimonials");
}
