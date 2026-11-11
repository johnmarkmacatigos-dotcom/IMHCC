"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/admin/Form";
import { dbError, fieldErrors, formObject, optional, required } from "@/lib/admin/forms";
import { refreshSite } from "@/lib/admin/revalidate";
import { logActivity, requireAdmin, type AdminSession } from "@/lib/admin/session";

const amount = (label: string, { allowZero = true } = {}) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? 0 : Number(v.replace(/[,\s]/g, ""))))
    .pipe(
      z
        .number({ message: `${label}: enter a number, for example 25` })
        .min(allowZero ? 0 : 0.01, allowZero ? `${label} cannot be below zero` : `${label} must be more than zero`)
        .max(100_000_000, `${label} is too large`),
    );

const money = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v.replace(/[₱,\s]/g, ""))))
  .pipe(z.number({ message: "Enter a number, for example 265" }).min(0).max(100_000_000).nullable());

const uuidOrNull = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(z.string().uuid().nullable());

const itemSchema = z.object({
  name: required(160, "Name"),
  kind: z.enum(["material", "product", "tool", "other"]),
  category: optional(60, "Category"),
  sku: optional(60, "SKU"),
  unit: required(20, "Unit"),
  reorder_level: amount("Reorder level"),
  unit_cost: money,
  location: optional(80, "Location"),
  supplier: optional(120, "Supplier"),
  notes: optional(1000, "Notes"),
  product_id: uuidOrNull,
});

const moveSchema = z.object({
  item_id: z.string().uuid(),
  type: z.enum(["in", "out", "adjust"]),
  quantity: amount("Quantity"),
  reason: optional(80, "Reason"),
  project_id: uuidOrNull,
  reference: optional(120, "Reference"),
  note: optional(500, "Note"),
  unit_cost: money,
});

function refresh(linkedProduct: boolean) {
  revalidatePath("/admin", "layout");
  // A linked catalog product shows its stock on the public hardware page.
  if (linkedProduct) refreshSite();
}

function friendly(error: { code?: string; message: string }, what: string): FormState {
  if (error.code === "23505") return { error: "Another item already uses that SKU, or that catalog product is already linked to another item." };
  // Messages raised on purpose by record_stock_movement() are written for people.
  if (error.code === "22023" || (error.code === "42501" && !/permission denied|row-level security/i.test(error.message))) return { error: error.message };
  return dbError(error, what);
}

async function move(s: AdminSession, v: z.infer<typeof moveSchema>) {
  return s.db.rpc("record_stock_movement", {
    p_item: v.item_id,
    p_type: v.type,
    p_quantity: v.quantity,
    p_reason: v.reason,
    p_project: v.project_id,
    p_reference: v.reference,
    p_note: v.note,
    p_unit_cost: v.unit_cost,
  });
}

export async function saveItem(_: FormState, fd: FormData): Promise<FormState> {
  const s = await requireAdmin("team");
  const id = String(fd.get("id") ?? "");
  const parsed = itemSchema.safeParse({ category: "", sku: "", unit_cost: "", location: "", supplier: "", notes: "", product_id: "", ...formObject(fd) });
  if (!parsed.success) return fieldErrors(parsed.error);
  const values = parsed.data;

  if (id) {
    const { error } = await s.db.from("inventory_items").update(values).eq("id", id);
    if (error) return friendly(error, "item");
    await logActivity(s, "updated", "inventory item", id, { name: values.name });
    refresh(Boolean(values.product_id));
    return { message: "Saved." };
  }

  const opening = amount("Opening stock").safeParse(String(fd.get("opening") ?? ""));
  if (!opening.success) return { error: "Please check the highlighted fields.", fieldErrors: { opening: opening.error.issues[0].message } };

  const { data, error } = await s.db.from("inventory_items").insert(values).select("id").single();
  if (error) return friendly(error, "item");
  await logActivity(s, "created", "inventory item", data.id, { name: values.name });
  if (opening.data > 0) {
    const res = await move(s, {
      item_id: data.id,
      type: "in",
      quantity: opening.data,
      reason: "Opening stock",
      project_id: null,
      reference: null,
      note: null,
      unit_cost: values.unit_cost,
    });
    if (res.error) console.error("[inventory] opening stock", res.error.message);
  }
  refresh(Boolean(values.product_id));
  redirect(`/admin/inventory/${data.id}`);
}

export async function recordMovement(_: FormState, fd: FormData): Promise<FormState> {
  const s = await requireAdmin("team");
  // The dialog only sends the boxes that fit the movement type, so start from blanks.
  const parsed = moveSchema.safeParse({ reason: "", project_id: "", reference: "", note: "", unit_cost: "", ...formObject(fd) });
  if (!parsed.success) return fieldErrors(parsed.error);
  const v = parsed.data;
  if (v.type !== "adjust" && v.quantity <= 0) return { error: "Please check the highlighted fields.", fieldErrors: { quantity: "Quantity must be more than zero" } };
  if (v.type === "adjust" && !s.can.edit) return { error: "Only the owner, admins, and editors can correct a stock count." };

  const { data, error } = await move(s, v);
  if (error) return friendly(error, "stock movement");
  const { data: item } = await s.db.from("inventory_items").select("unit, product_id").eq("id", v.item_id).maybeSingle<{ unit: string; product_id: string | null }>();
  refresh(Boolean(item?.product_id));
  const balance = Number((data as { balance_after: number } | null)?.balance_after ?? 0);
  const unit = item?.unit ?? "";
  const verb = v.type === "in" ? "Stocked in" : v.type === "out" ? "Stocked out" : "Count set";
  return { message: `${verb}. Now ${balance.toLocaleString("en-PH", { maximumFractionDigits: 2 })} ${unit} on hand.` };
}

export async function archiveItem(fd: FormData) {
  const s = await requireAdmin("edit");
  const id = z.string().uuid().parse(fd.get("id"));
  const active = fd.get("active") === "true";
  const { error } = await s.db.from("inventory_items").update({ is_active: active }).eq("id", id);
  if (error) throw new Error("Could not update.");
  await logActivity(s, active ? "restored" : "archived", "inventory item", id);
  refresh(false);
  redirect(active ? `/admin/inventory/${id}` : "/admin/inventory");
}

export async function deleteItem(fd: FormData) {
  const s = await requireAdmin("manage");
  const id = z.string().uuid().parse(fd.get("id"));
  const { error } = await s.db.from("inventory_items").delete().eq("id", id);
  if (error) throw new Error("Could not delete.");
  await logActivity(s, "deleted", "inventory item", id);
  refresh(true);
  redirect("/admin/inventory");
}
