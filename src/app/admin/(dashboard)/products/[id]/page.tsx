import Link from "next/link";
import { notFound } from "next/navigation";
import { Boxes } from "lucide-react";
import { AdminForm, CheckField, SelectField, TextArea, TextField } from "@/components/admin/Form";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ImageField } from "@/components/admin/ImageField";
import { BackLink, Card, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import type { Product } from "@/lib/types";
import { deleteProduct, saveProduct } from "../actions";

export const metadata = { title: "Product" };

type P = Product & { sku: string | null; stock_quantity: number; is_published: boolean };

export default async function ProductEditor({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireAdmin("team");
  const { id } = await params;
  let x: P | null = null;
  if (id !== "new") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const { data } = await s.db.from("products").select("*").eq("id", id).maybeSingle<P>();
    if (!data) notFound();
    x = data;
  }
  const tracked = x
    ? (await s.db.from("inventory_items").select("id, quantity, unit").eq("product_id", x.id).maybeSingle<{ id: string; quantity: number; unit: string }>()).data
    : null;
  return (
    <>
      <BackLink href="/admin/products">All products</BackLink>
      <PageHeader title={x ? x.name : "Add a product"} />
      {tracked && (
        <p className="flex flex-wrap items-center gap-2 rounded-lg bg-gold-100 px-4 py-3 text-sm text-navy-800">
          <Boxes className="size-4 text-gold-700" aria-hidden />
          Stock for this product comes from Inventory ({Number(tracked.quantity).toLocaleString("en-PH")} {tracked.unit} on hand).
          <Link href={`/admin/inventory/${tracked.id}`} className="font-semibold underline">
            Record stock there
          </Link>
        </p>
      )}
      <Card>
        <AdminForm action={saveProduct} submitLabel={x ? "Save changes" : "Add product"}>
          {x && <input type="hidden" name="id" value={x.id} />}
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="name" label="Name" defaultValue={x?.name} required />
            <TextField name="category" label="Category" defaultValue={x?.category} placeholder="Cabinet hardware" required />
            <TextField name="sku" label="SKU / item code (optional)" defaultValue={x?.sku} />
            <SelectField
              name="stock_status"
              label="Availability"
              defaultValue={x?.stock_status ?? "in_stock"}
              options={[
                { value: "in_stock", label: "In stock" },
                { value: "low_stock", label: "Low stock" },
                { value: "out_of_stock", label: "Out of stock" },
                { value: "made_to_order", label: "Made to order" },
              ]}
            />
            <TextField name="price" label="Price (₱)" inputMode="decimal" defaultValue={x?.price} placeholder="450" />
            <TextField name="price_unit" label="Per" defaultValue={x?.price_unit} placeholder="piece, box, meter" />
            {tracked ? (
              <input type="hidden" name="stock_quantity" value={x?.stock_quantity ?? 0} />
            ) : (
              <TextField name="stock_quantity" label="Quantity on hand" type="number" defaultValue={x?.stock_quantity ?? 0} />
            )}
          </div>
          <CheckField name="price_on_request" label="Hide the price (show 'Ask for price')" defaultChecked={x?.price_on_request} />
          <TextArea name="description" label="Description" defaultValue={x?.description} />
          <TextArea name="specifications" label="Specifications" defaultValue={x?.specifications} hint="Size, color, material, brand." />
          <TextField name="delivery_info" label="Delivery info" defaultValue={x?.delivery_info} placeholder="Delivery within Santa Barbara and Iloilo City" />
          <ImageField name="image_url" label="Picture" folder="products" defaultValue={x?.image_url} />
          <div className="grid gap-4 sm:grid-cols-2">
            <CheckField name="is_published" label="Show on website" defaultChecked={x?.is_published ?? true} />
            <CheckField name="is_featured" label="Feature on hardware page" defaultChecked={x?.is_featured} />
          </div>
          <TextField name="slug" label="Web address" defaultValue={x?.slug} hint="Leave blank to make one from the name." />
        </AdminForm>
      </Card>
      {x && (
        <div className="flex justify-end">
          <DeleteButton action={deleteProduct} id={x.id} confirm={`Delete "${x.name}"? This cannot be undone.`} />
        </div>
      )}
    </>
  );
}
