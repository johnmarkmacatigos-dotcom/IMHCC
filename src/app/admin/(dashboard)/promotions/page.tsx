import { Megaphone, Plus } from "lucide-react";
import Link from "next/link";
import { Badge, EmptyState, PageHeader, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Promotions" };

export default async function PromotionsPage() {
  const s = await requireAdmin("edit");
  const { data } = await s.db.from("promotions").select("id, title, starts_on, ends_on, is_published").order("created_at", { ascending: false });
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <PageHeader
        title="Promotions"
        intro="Limited-time offers shown on the Promos page. Expired promotions hide themselves."
        action={
          <Link href="/admin/promotions/new" className="btn-gold">
            <Plus className="size-4" aria-hidden /> Add promotion
          </Link>
        }
      />
      {data && data.length > 0 ? (
        <Table head={["Promotion", "Runs", "Website"]}>
          {data.map((x) => {
            const expired = x.ends_on && x.ends_on < today;
            const upcoming = x.starts_on && x.starts_on > today;
            return (
              <tr key={x.id} className="hover:bg-mist">
                <Td>
                  <Link href={`/admin/promotions/${x.id}`} className="font-semibold text-navy-800">
                    {x.title}
                  </Link>
                </Td>
                <Td className="text-gray-600">
                  {x.starts_on ? formatDate(x.starts_on) : "Now"} to {x.ends_on ? formatDate(x.ends_on) : "no end date"}
                </Td>
                <Td>
                  {!x.is_published ? <Badge>Draft</Badge> : expired ? <Badge tone="red">Ended</Badge> : upcoming ? <Badge tone="navy">Scheduled</Badge> : <Badge tone="green">Running</Badge>}
                </Td>
              </tr>
            );
          })}
        </Table>
      ) : (
        <EmptyState
          icon={Megaphone}
          title="No promotions running"
          action={
            <Link href="/admin/promotions/new" className="btn-gold">
              Create a promotion
            </Link>
          }
        >
          A promo shows on the Promotions page and scrolls in the gold banner at the top of every page while it&apos;s active.
        </EmptyState>
      )}
    </>
  );
}
