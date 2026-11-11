import Link from "next/link";
import { MoveIcon } from "@/components/admin/StockDialog";
import { BackLink, EmptyState, PageHeader, Table, Td, dateTime } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import { formatQty, moveTypes, type Movement } from "@/lib/inventory";
import { cn } from "@/lib/utils";

export const metadata = { title: "Stock history" };

const PAGE = 50;

export default async function StockHistoryPage({ searchParams }: { searchParams: Promise<{ type?: string; page?: string }> }) {
  const s = await requireAdmin("team");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  let q = s.db
    .from("inventory_movements")
    .select("id, item_id, type, quantity, change, balance_after, reason, reference, created_at, inventory_items(name, unit), projects(title), profiles(full_name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (sp.type && sp.type in moveTypes) q = q.eq("type", sp.type);
  const { data, count } = await q.returns<Movement[]>();
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ type: sp.type, page: sp.page, ...patch })) if (v) p.set(k, v);
    return `/admin/inventory/history${p.size ? `?${p}` : ""}`;
  };

  const tabs = [{ key: undefined, label: "All" }, ...Object.entries(moveTypes).map(([key, label]) => ({ key, label }))];

  return (
    <>
      <BackLink href="/admin/inventory">All inventory</BackLink>
      <PageHeader title="Stock history" intro="Every stock in, stock out, and count correction, newest first." />
      <nav aria-label="Filter by movement" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={link({ type: t.key, page: undefined })}
            aria-current={sp.type === t.key ? "page" : undefined}
            className={cn("admin-press min-h-10 rounded-full px-4 py-2 text-sm font-medium", sp.type === t.key ? "bg-navy-800 text-white" : "bg-white text-navy-800 ring-1 ring-gray-200 hover:bg-navy-100")}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {data && data.length > 0 ? (
        <Table head={["When", "Item", "Movement", "Balance", "Details", "By"]}>
          {data.map((h) => {
            const unit = h.inventory_items?.unit ?? "";
            const c = Number(h.change);
            return (
              <tr key={h.id} className="hover:bg-mist">
                <Td className="whitespace-nowrap text-gray-600">{dateTime(h.created_at)}</Td>
                <Td>
                  <Link href={`/admin/inventory/${h.item_id}`} className="font-semibold text-navy-800 hover:underline">
                    {h.inventory_items?.name}
                  </Link>
                </Td>
                <Td>
                  <span className="flex items-center gap-2.5">
                    <MoveIcon type={h.type} />
                    <span className={cn("whitespace-nowrap font-semibold", c > 0 ? "text-[#1e6b3e]" : c < 0 ? "text-brick-600" : "text-gray-600")}>
                      {c > 0 ? "+" : c < 0 ? "−" : "±"}
                      {formatQty(Math.abs(c))} {unit}
                    </span>
                  </span>
                </Td>
                <Td className="font-semibold text-navy-800">{formatQty(h.balance_after)}</Td>
                <Td className="text-gray-700">{[h.reason, h.projects?.title, h.reference && `Ref ${h.reference}`].filter(Boolean).join(" · ") || "—"}</Td>
                <Td className="text-gray-600">{h.profiles?.full_name ?? "—"}</Td>
              </tr>
            );
          })}
        </Table>
      ) : (
        <EmptyState>No stock movements yet.</EmptyState>
      )}
      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between text-sm">
          {page > 1 ? <Link href={link({ page: String(page - 1) })} className="btn-outline">Newer</Link> : <span />}
          <span className="text-gray-600">
            Page {page} of {pages}
          </span>
          {page < pages ? <Link href={link({ page: String(page + 1) })} className="btn-outline">Older</Link> : <span />}
        </nav>
      )}
    </>
  );
}
