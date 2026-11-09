import { notFound } from "next/navigation";
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
  return (
    <>
      <BackLink href="/admin/products">All products</BackLink>
      <PageHeader title={x ? x.name : "Add a product"} />
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
            <TextField name="stock_quantity" label="Quantity on hand" type="number" defaultValue={x?.stock_quantity ?? 0} />
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
