"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/components/admin/Form";
import { logActivity, requireAdmin } from "@/lib/admin/session";

const schema = z.object({
  id: z.string().uuid(),
  role: z.enum(["owner", "admin", "editor", "staff"]),
  is_active: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export async function updateMember(_: FormState, fd: FormData): Promise<FormState> {
  const s = await requireAdmin("manage");
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Something is off with that change." };
  const { id, ...values } = parsed.data;
  if (id === s.userId) return { error: "You cannot change your own role or access." };
  if (values.role === "owner" && !s.can.owner) return { error: "Only an owner can make someone an owner." };

  const { data, error } = await s.db.from("profiles").update(values).eq("id", id).select("full_name, email").maybeSingle();
  if (error) return { error: error.code === "42501" || error.code === "P0001" ? error.message : "Could not save. Please try again." };
  if (!data) return { error: "Your role does not allow changing this account." };
  await logActivity(s, `${values.is_active ? "access on" : "access off"}, role ${values.role}`, "team member", id, { name: data.full_name ?? data.email });
  revalidatePath("/admin/team");
  return { message: "Saved." };
}
