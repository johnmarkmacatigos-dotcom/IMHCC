import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, EmptyState, PageHeader, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import { formatPeso } from "@/lib/utils";

export const metadata = { title: "Hardware products" };

const stockLabels = {
  in_stock: { label: "In stock", tone: "green" },
  low_stock: { label: "Low stock", tone: "gold" },
  out_of_stock: { label: "Out of stock", tone: "red" },
  made_to_order: { label: "Made to order", tone: "navy" },
} as const;

type Row = { id: string; name: string; category: string; sku: string | null; price: number | null; price_unit: string | null; price_on_request: boolean; stock_quantity: number; stock_status: keyof typeof stockLabels; is_published: boolean };

export default async function ProductsPage() {
  const s = await requireAdmin("team");
  const { data } = await s.db.from("products").select("id, name, category, sku, price, price_unit, price_on_request, stock_quantity, stock_status, is_published").order("category").order("name").returns<Row[]>();
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
        <Table head={["Product", "Category", "Price", "Stock", "Website"]}>
          {data.map((x) => (
            <tr key={x.id} className="hover:bg-mist">
              <Td>
                <Link href={`/admin/products/${x.id}`} className="block font-semibold text-navy-800">
                  {x.name}
                </Link>
                {x.sku && <span className="text-[13px] text-gray-500">SKU {x.sku}</span>}
              </Td>
              <Td>{x.category}</Td>
              <Td className="whitespace-nowrap">{x.price_on_request || x.price == null ? "On request" : `${formatPeso(x.price)}${x.price_unit ? ` / ${x.price_unit}` : ""}`}</Td>
              <Td>
                <span className="flex flex-wrap items-center gap-2">
                  <Badge tone={stockLabels[x.stock_status].tone}>{stockLabels[x.stock_status].label}</Badge>
                  <span className="text-gray-500">{x.stock_quantity}</span>
                </span>
              </Td>
              <Td>{x.is_published ? <Badge tone="green">Shown</Badge> : <Badge>Hidden</Badge>}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState>No products yet.</EmptyState>
      )}
    </>
  );
}
