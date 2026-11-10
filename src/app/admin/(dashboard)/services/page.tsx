import { CategoryTag } from "@/components/site/CategoryTag";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, EmptyState, PageHeader, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Services" };

export default async function ServicesPage() {
  const s = await requireAdmin("edit");
  const { data } = await s.db.from("services").select("id, name, category, summary, sort_order, is_published, is_featured").order("sort_order");
  return (
    <>
      <PageHeader
        title="Services"
        intro="What the business offers. These appear on the Services page and in the quotation form."
        action={
          <Link href="/admin/services/new" className="btn-gold">
            <Plus className="size-4" aria-hidden /> Add service
          </Link>
        }
      />
      {data && data.length > 0 ? (
        <Table head={["Order", "Service", "Category", "Website"]}>
          {data.map((x) => (
            <tr key={x.id} className="hover:bg-mist">
              <Td className="w-16 text-gray-500">{x.sort_order}</Td>
              <Td>
                <Link href={`/admin/services/${x.id}`} className="block font-semibold text-navy-800">
                  {x.name}
                </Link>
                <span className="line-clamp-1 text-[13px] text-gray-500">{x.summary}</span>
              </Td>
              <Td>
                <CategoryTag category={x.category} />
              </Td>
              <Td>
                <span className="flex gap-1.5">
                  {x.is_published ? <Badge tone="green">Shown</Badge> : <Badge>Hidden</Badge>}
                  {x.is_featured && <Badge tone="goldSolid">Featured</Badge>}
                </span>
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState>No services yet.</EmptyState>
      )}
    </>
  );
}
