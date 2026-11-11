import { History } from "lucide-react";
import Link from "next/link";
import { EmptyState, PageHeader, Table, Td, dateTime } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Activity log" };

type Row = { id: number; action: string; entity: string; entity_id: string | null; details: Record<string, unknown> | null; created_at: string; actor: { full_name: string | null; email: string | null } | null };

const links: Record<string, string> = {
  inquiry: "/admin/inquiries/",
  project: "/admin/projects/",
  testimonial: "/admin/testimonials/",
  service: "/admin/services/",
  product: "/admin/products/",
  promotion: "/admin/promotions/",
};

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const s = await requireAdmin("manage");
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const size = 50;
  const { data } = await s.db
    .from("activity_logs")
    .select("id, action, entity, entity_id, details, created_at, actor:profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .range((page - 1) * size, page * size)
    .returns<Row[]>();
  const rows = (data ?? []).slice(0, size);
  const hasMore = (data ?? []).length > size;

  const describe = (r: Row) => {
    const d = r.details ?? {};
    const name = d.title ?? d.name ?? d.customer ?? d.reference;
    return name ? String(name) : "";
  };

  return (
    <>
      <PageHeader title="Activity log" intro="Who changed what in the dashboard, newest first." />
      {rows.length > 0 ? (
        <Table head={["When", "Who", "What"]}>
          {rows.map((r) => {
            const href = r.entity_id && links[r.entity] && !r.action.startsWith("deleted") ? `${links[r.entity]}${r.entity_id}` : null;
            const label = `${r.entity} ${describe(r)}`.trim();
            return (
              <tr key={r.id}>
                <Td className="whitespace-nowrap text-gray-600">{dateTime(r.created_at)}</Td>
                <Td>{r.actor?.full_name ?? r.actor?.email ?? "Unknown"}</Td>
                <Td>
                  <span className="text-gray-700">{r.action}</span>{" "}
                  {href ? (
                    <Link href={href} className="font-semibold text-navy-800 hover:underline">
                      {label}
                    </Link>
                  ) : (
                    <span className="font-semibold">{label}</span>
                  )}
                </Td>
              </tr>
            );
          })}
        </Table>
      ) : (
        <EmptyState icon={History} title="Nothing has changed yet">
          Every save, upload, and status change by the team will be listed here, with who did it and when.
        </EmptyState>
      )}
      <nav className="flex justify-end gap-2">
        {page > 1 && (
          <Link className="btn-outline px-4 py-2" href={`/admin/activity?page=${page - 1}`}>
            Newer
          </Link>
        )}
        {hasMore && (
          <Link className="btn-outline px-4 py-2" href={`/admin/activity?page=${page + 1}`}>
            Older
          </Link>
        )}
      </nav>
    </>
  );
}
