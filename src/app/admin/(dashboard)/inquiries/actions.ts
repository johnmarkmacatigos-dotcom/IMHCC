"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/admin/Form";
import { dbError, fieldErrors } from "@/lib/admin/forms";
import { logActivity, requireAdmin } from "@/lib/admin/session";

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "contacted", "site_visit", "quoted", "won", "lost", "closed"]),
  assigned_to: z
    .string()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.string().uuid().nullable()),
  internal_notes: z
    .string()
    .trim()
    .max(5000, "Notes are too long")
    .transform((v) => (v === "" ? null : v)),
});

export async function updateInquiry(_: FormState, fd: FormData): Promise<FormState> {
  const s = await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return fieldErrors(parsed.error);
  const { id, ...values } = parsed.data;

  const { data: before } = await s.db.from("inquiries").select("status, reference_no").eq("id", id).single();
  const { error } = await s.db.from("inquiries").update(values).eq("id", id);
  if (error) return dbError(error, "inquiry");

  await logActivity(s, before?.status !== values.status ? `status: ${before?.status} → ${values.status}` : "updated", "inquiry", id, {
    reference: before?.reference_no,
  });
  revalidatePath("/admin", "layout");
  const changed = before?.status !== values.status;
  if (changed && values.status === "won") {
    return {
      message: "Saved.",
      celebrate: {
        title: `Job won! Congratulations on ${before?.reference_no ?? "this one"}.`,
        next: s.can.edit ? { href: "/admin/projects/new", label: "Start its project page for photos" } : undefined,
      },
    };
  }
  if (changed && values.status === "quoted") {
    return { message: "Marked as quoted. Follow up in 2 to 3 days if the customer hasn't replied." };
  }
  if (changed && values.status === "contacted") {
    return { message: "Marked as contacted. Next: book a site visit or send the quotation." };
  }
  return { message: "Saved." };
}
