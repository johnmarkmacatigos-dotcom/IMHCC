"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/admin/Form";
import { dbError, fieldErrors, formObject, optional, optionalUrl, required, slug, slugify } from "@/lib/admin/forms";
import { refreshSite } from "@/lib/admin/revalidate";
import { logActivity, requireAdmin } from "@/lib/admin/session";

const money = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v.replace(/[₱,\s]/g, ""))))
  .pipe(z.number({ message: "Enter a number, for example 450" }).min(0).max(100_000_000).nullable());

const schema = z.object({
  name: required(160, "Name"),
  slug,
  category: required(60, "Category"),
  sku: optional(60, "SKU"),
  description: optional(3000, "Description"),
  specifications: optional(3000, "Specifications"),
  price: money,
  price_unit: optional(40, "Unit"),
  price_on_request: z.boolean(),
  stock_quantity: z.coerce.number({ message: "Enter a whole number" }).int().min(0).max(10_000_000),
  stock_status: z.enum(["in_stock", "low_stock", "out_of_stock", "made_to_order"]),
  delivery_info: optional(300, "Delivery info"),
  image_url: optionalUrl,
  is_featured: z.boolean(),
  is_published: z.boolean(),
});

export async function saveProduct(_: FormState, fd: FormData): Promise<FormState> {
  const s = await requireAdmin("team");
  const id = String(fd.get("id") ?? "");
  const parsed = schema.safeParse(formObject(fd, { booleans: ["price_on_request", "is_featured", "is_published"] }));
  if (!parsed.success) return fieldErrors(parsed.error);
  const values = { ...parsed.data, slug: parsed.data.slug || slugify(parsed.data.name) };
  if (id) {
    const { error } = await s.db.from("products").update(values).eq("id", id);
    if (error) return dbError(error, "product");
    await logActivity(s, "updated", "product", id, { name: values.name, stock: values.stock_quantity });
    refreshSite();
    return { message: "Saved." };
  }
  const { data, error } = await s.db.from("products").insert(values).select("id").single();
  if (error) return dbError(error, "product");
  await logActivity(s, "created", "product", data.id, { name: values.name });
  refreshSite();
  redirect("/admin/products");
}

export async function deleteProduct(fd: FormData) {
  const s = await requireAdmin("team");
  const id = z.string().uuid().parse(fd.get("id"));
  const { error } = await s.db.from("products").delete().eq("id", id);
  if (error) throw new Error("Could not delete.");
  await logActivity(s, "deleted", "product", id);
  refreshSite();
  redirect("/admin/products");
}
