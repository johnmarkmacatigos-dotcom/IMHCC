import { CategoryTag } from "@/components/site/CategoryTag";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { Badge, EmptyState, PageHeader, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import { effectiveStockStatus } from "@/lib/stock";
import { formatPeso } from "@/lib/utils";
import { deleteProduct } from "./actions";

export const metadata = { title: "Hardware products" };

const stockLabels = {
  in_stock: { label: "In stock", tone: "green" },
  low_stock: { label: "Low stock", tone: "goldSolid" },
  out_of_stock: { label: "Out of stock", tone: "brick" },
  made_to_order: { label: "Made to order", tone: "navy" },
} as const;

type Row = { id: string; name: string; category: string; sku: string | null; price: number | null; price_unit: string | null; price_on_request: boolean; stock_quantity: number; sizes: string[] | null; stock_status: keyof typeof stockLabels; is_published: boolean };

export default async function ProductsPage() {
  const s = await requireAdmin("team");
  const { data } = await s.db.from("products").select("id, name, category, sku, price, price_unit, price_on_request, stock_quantity, sizes, stock_status, is_published").order("category").order("name").returns<Row[]>();
  return (
    <>
      <PageHeader
        title="Hardware products"
        intro="Items in the hardware catalog, with prices and stock."
        action={
          <Link href="/admin/products/new" className="btn-gold">
            <Plus className="size-4" aria-hidden /> Add product
          </Link>
        }
      />
      {data && data.length > 0 ? (
        <Table head={["Product", "Category", "Price", "Stock", "Website", "Actions"]}>
          {data.map((x) => {
            const stock = stockLabels[effectiveStockStatus(x.stock_status, x.stock_quantity)];
            return (
              <tr key={x.id} className="hover:bg-mist">
              <Td>
                <Link href={`/admin/products/${x.id}`} className="block font-semibold text-navy-800">
                  {x.name}
                </Link>
                {x.sku && <span className="text-[13px] text-gray-500">SKU {x.sku}</span>}
                {x.sizes && x.sizes.length > 0 && (
                  <span className="block max-w-72 truncate text-[13px] text-gray-500" title={x.sizes.join(", ")}>
                    {x.sizes.length} {x.sizes.length === 1 ? "size" : "sizes"}: {x.sizes.join(", ")}
                  </span>
                )}
              </Td>
              <Td>
                <CategoryTag category={x.category} />
              </Td>
              <Td className="whitespace-nowrap">{x.price_on_request || x.price == null ? "On request" : `${formatPeso(x.price)}${x.price_unit ? ` / ${x.price_unit}` : ""}`}</Td>
              <Td>
                <span className="flex flex-wrap items-center gap-2">
                  <Badge tone={stock.tone}>{stock.label}</Badge>
                  <span className="text-gray-500">{x.stock_quantity}</span>
                </span>
              </Td>
              <Td>{x.is_published ? <Badge tone="green">Shown</Badge> : <Badge>Hidden</Badge>}</Td>
              <Td>
                <span className="flex items-center gap-1">
                  <Link
                    href={`/admin/products/${x.id}`}
                    aria-label={`Edit ${x.name}`}
                    title="Edit"
                    className="admin-press inline-flex size-11 items-center justify-center rounded-md text-navy-800 hover:bg-gold-100"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Link>
                  {s.can.edit && (
                    <DeleteButton action={deleteProduct} id={x.id} compact title={x.name} confirm={`Delete "${x.name}"? It will be removed from the website. This cannot be undone.`} />
                  )}
                </span>
              </Td>
              </tr>
            );
          })}
        </Table>
      ) : (
        <EmptyState>No products yet.</EmptyState>
      )}
    </>
  );
}
