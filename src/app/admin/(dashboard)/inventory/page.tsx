import Link from "next/link";
import { ArrowRight, Boxes, Plus, Search } from "lucide-react";
import { CountUp } from "@/components/admin/motion";
import { MoveIcon, StockDialog, StockMeter } from "@/components/admin/StockDialog";
import { Badge, EmptyState, PageHeader, Table, Td, timeAgo } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import { formatQty, inventoryKinds, meterScale, stockStates, type InventoryLevel, type Movement } from "@/lib/inventory";
import { cn } from "@/lib/utils";

export const metadata = { title: "Inventory" };

const kindTone = { material: "navy", product: "gold", tool: "gray", other: "gray" } as const;

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ kind?: string; state?: string; q?: string; archived?: string }> }) {
  const s = await requireAdmin("team");
  const sp = await searchParams;
  const archived = sp.archived === "1";

  let q = s.db.from("inventory_levels").select("*").eq("is_active", !archived).order("name").limit(500);
  if (sp.kind && sp.kind in inventoryKinds) q = q.eq("kind", sp.kind);
  if (sp.state === "reorder") q = q.in("stock_state", ["low", "out"]);
  const term = sp.q
    ?.trim()
    .replace(/[%,()]/g, " ")
    .slice(0, 60);
  if (term) q = q.or(`name.ilike.%${term}%,sku.ilike.%${term}%,category.ilike.%${term}%,location.ilike.%${term}%`);

  const [{ data: items }, { data: all }, { data: moves }, { data: projects }] = await Promise.all([
    q.returns<InventoryLevel[]>(),
    s.db
      .from("inventory_levels")
      .select("id, name, unit, quantity, stock_state, stock_value")
      .eq("is_active", true)
      .limit(2000)
      .returns<Pick<InventoryLevel, "id" | "name" | "unit" | "quantity" | "stock_state" | "stock_value">[]>(),
    s.db
      .from("inventory_movements")
      .select("id, type, quantity, change, reason, created_at, item_id, inventory_items(name, unit), projects(title), profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<Movement[]>(),
    s.db.from("projects").select("id, title").order("created_at", { ascending: false }).limit(50).returns<{ id: string; title: string }[]>(),
  ]);

  const everything = all ?? [];
  const reorder = everything.filter((x) => x.stock_state !== "ok");
  const value = everything.reduce((n, x) => n + Number(x.stock_value), 0);

  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ kind: sp.kind, state: sp.state, q: sp.q, archived: sp.archived, ...patch })) if (v) p.set(k, v);
    const str = p.toString();
    return `/admin/inventory${str ? `?${str}` : ""}`;
  };

  const tiles = [
    { label: "Items tracked", value: everything.length, accent: "border-navy-800", href: link({ kind: undefined, state: undefined, archived: undefined }) },
    { label: "Low stock, reorder soon", value: reorder.filter((x) => x.stock_state === "low").length, accent: "border-brick-600", href: link({ state: "reorder" }), alert: true },
    { label: "Out of stock", value: reorder.filter((x) => x.stock_state === "out").length, accent: "border-brick-600", href: link({ state: "reorder" }), alert: true },
  ];

  const chips = [
    { label: "All items", href: link({ kind: undefined, state: undefined, archived: undefined }), on: !sp.kind && !sp.state && !archived },
    ...Object.entries(inventoryKinds).map(([k, label]) => ({ label: `${label}s`, href: link({ kind: k, state: undefined }), on: sp.kind === k && !sp.state })),
    { label: "Needs reorder", href: link({ state: "reorder", kind: undefined }), on: sp.state === "reorder", alert: true },
  ];

  return (
    <>
      <PageHeader
        title="Inventory"
        intro="Materials, products, and tools on hand. Every stock in and out is recorded, so you always know what is left and where it went."
        action={
          <Link href="/admin/inventory/new" className="btn-gold">
            <Plus className="size-4" aria-hidden /> Add item
          </Link>
        }
      />

      <div className="admin-stagger grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((t) => {
          const hot = t.alert && t.value > 0;
          return (
            <Link
              key={t.label}
              href={t.href}
              className={cn(
                "admin-lift group relative flex flex-col gap-1 overflow-hidden rounded-xl border-t-4 bg-white p-5 shadow-sm ring-1 hover:ring-navy-800",
                t.accent,
                hot ? "ring-brick-500" : "ring-gray-200",
              )}
            >
              <span className={cn("font-display text-3xl font-semibold", hot ? "text-brick-600" : "text-navy-800")}>
                <CountUp value={t.value} />
              </span>
              <span className="text-sm text-gray-600">{t.label}</span>
              {hot && (
                <span className="absolute right-4 top-5 flex size-2" aria-hidden>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-brick-500 opacity-60 motion-reduce:hidden" />
                  <span className="relative inline-flex size-2 rounded-full bg-brick-600" />
                </span>
              )}
            </Link>
          );
        })}
        <div className="admin-lift relative flex flex-col gap-1 overflow-hidden rounded-xl border-t-4 border-gold-500 bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <span className="font-display text-3xl font-semibold text-navy-800">
            ₱<CountUp value={Math.round(value)} />
          </span>
          <span className="text-sm text-gray-600">Stock value at cost</span>
        </div>
      </div>

      <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[1fr_320px] xl:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <nav aria-label="Filter items" className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <Link
                  key={c.label}
                  href={c.href}
                  aria-current={c.on ? "page" : undefined}
                  className={cn(
                    "admin-press min-h-10 rounded-full px-4 py-2 text-sm font-medium",
                    c.on
                      ? "bg-navy-800 text-white"
                      : c.alert
                        ? "bg-brick-50 text-brick-700 ring-1 ring-brick-500/40 hover:bg-brick-50/70"
                        : "bg-white text-navy-800 ring-1 ring-gray-200 hover:bg-navy-100",
                  )}
                >
                  {c.label}
                  {c.alert && reorder.length > 0 && (
                    <span
                      key={reorder.length}
                      className={cn("admin-pop ml-1.5 rounded-full px-1.5 text-xs font-bold", c.on ? "bg-white text-brick-700" : "bg-brick-600 text-white")}
                    >
                      {reorder.length}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            <form className="flex gap-2" action="/admin/inventory">
              {sp.kind && <input type="hidden" name="kind" value={sp.kind} />}
              {sp.state && <input type="hidden" name="state" value={sp.state} />}
              <label className="flex min-h-10 flex-1 items-center gap-2 rounded-lg bg-white px-3 ring-1 ring-gray-300 focus-within:ring-2 focus-within:ring-gold-500">
                <Search className="size-4 text-gray-500" aria-hidden />
                <span className="sr-only">Search items</span>
                <input name="q" defaultValue={sp.q} placeholder="Name, SKU, or location" className="w-full min-w-40 bg-transparent py-2 text-sm outline-none" />
              </label>
            </form>
          </div>

          {items && items.length > 0 ? (
            <>
              {/* Phones: one card per item, so names and quick buttons stay readable. */}
              <ul className="admin-stagger flex flex-col gap-2 md:hidden">
                {items.map((x, i) => {
                  const m = meterScale(x.quantity, x.reorder_level);
                  const st = stockStates[x.stock_state];
                  return (
                    <li key={x.id} className={cn("flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1", x.stock_state === "ok" ? "ring-gray-200" : "ring-brick-500/50")}>
                      <div className="flex items-start justify-between gap-3">
                        <Link href={`/admin/inventory/${x.id}`} className="flex min-w-0 flex-col">
                          <span className="font-semibold text-navy-800">{x.name}</span>
                          <span className="text-[13px] text-gray-500">{[inventoryKinds[x.kind], x.location].filter(Boolean).join(" · ")}</span>
                        </Link>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex flex-1 flex-col gap-1.5">
                          <span className="font-semibold text-navy-800">
                            {formatQty(x.quantity)} <span className="font-normal text-gray-500">{x.unit}</span>
                          </span>
                          <StockMeter fill={m.fill} mark={m.mark} state={x.stock_state} index={i} />
                        </span>
                        {!archived && (
                          <span className="flex gap-1.5">
                            <StockDialog item={x} initialType="out" trigger="minus" canAdjust={s.can.edit} projects={projects ?? []} />
                            <StockDialog item={x} initialType="in" trigger="plus" canAdjust={s.can.edit} projects={projects ?? []} />
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="hidden md:block">
                <Table head={["Item", "Type", "On hand", "Status", ""]}>
                  {items.map((x, i) => {
                    const m = meterScale(x.quantity, x.reorder_level);
                    const st = stockStates[x.stock_state];
                    return (
                      <tr key={x.id} className={cn("hover:bg-mist", x.stock_state === "out" && "bg-brick-50/40")}>
                        <Td>
                          <Link href={`/admin/inventory/${x.id}`} className="group block font-semibold text-navy-800">
                            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">{x.name}</span>
                          </Link>
                          <span className="text-[13px] text-gray-500">
                            {[x.sku && `SKU ${x.sku}`, x.location, x.product_id && "On website"].filter(Boolean).join(" · ") || x.category}
                          </span>
                        </Td>
                        <Td>
                          <Badge tone={kindTone[x.kind]}>{inventoryKinds[x.kind]}</Badge>
                        </Td>
                        <Td className="w-56">
                          <span className="flex flex-col gap-1.5">
                            <span className="font-semibold text-navy-800">
                              {formatQty(x.quantity)} <span className="font-normal text-gray-500">{x.unit}</span>
                            </span>
                            <StockMeter fill={m.fill} mark={m.mark} state={x.stock_state} index={i} />
                          </span>
                        </Td>
                        <Td>
                          <Badge tone={st.tone}>{st.label}</Badge>
                        </Td>
                        <Td className="whitespace-nowrap">
                          {!archived && (
                            <span className="flex justify-end gap-1.5">
                              <StockDialog item={x} initialType="out" trigger="minus" canAdjust={s.can.edit} projects={projects ?? []} />
                              <StockDialog item={x} initialType="in" trigger="plus" canAdjust={s.can.edit} projects={projects ?? []} />
                            </span>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </Table>
              </div>
            </>
          ) : (
            <EmptyState>
              {term || sp.kind || sp.state || archived ? (
                "Nothing matches. Try another filter."
              ) : (
                <>
                  <Boxes className="mx-auto mb-3 size-8 text-gold-500" aria-hidden />
                  No items yet. Add the materials, products, and tools you keep, then record stock in and out as it moves.
                </>
              )}
            </EmptyState>
          )}
          <Link
            href={link({ archived: archived ? undefined : "1", kind: undefined, state: undefined })}
            className="self-start text-sm font-medium text-gray-600 hover:text-navy-800 hover:underline"
          >
            {archived ? "← Back to current items" : "Show archived items"}
          </Link>
        </div>

        <aside className="admin-stagger flex flex-col gap-6">
          <section className="rounded-xl bg-navy-800 p-5 text-white shadow-sm">
            <h2 className="mb-3 text-lg text-white">Reorder soon</h2>
            {reorder.length > 0 ? (
              <ul className="flex flex-col">
                {reorder.slice(0, 8).map((x) => (
                  <li key={x.id} className="border-t border-white/10 first:border-t-0">
                    <Link href={`/admin/inventory/${x.id}`} className="group flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="transition-transform duration-200 group-hover:translate-x-1">{x.name}</span>
                      <span className={cn("whitespace-nowrap font-semibold", x.stock_state === "out" ? "text-[#ff8f84]" : "text-gold-300")}>
                        {x.stock_state === "out" ? "None left" : `${formatQty(x.quantity)} ${x.unit} left`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#c9d3df]">Everything is above its reorder level.</p>
            )}
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-2 text-lg">Recent movements</h2>
            {moves && moves.length > 0 ? (
              <ul className="admin-stagger flex flex-col divide-y divide-gray-100">
                {moves.map((m) => (
                  <li key={m.id}>
                    <Link href={`/admin/inventory/${m.item_id}`} className="flex items-start gap-3 py-3">
                      <MoveIcon type={m.type} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-semibold text-ink">
                          {m.inventory_items?.name} ·{" "}
                          {m.type === "adjust" ? `count set to ${formatQty(m.quantity)}` : `${formatQty(m.quantity)} ${m.inventory_items?.unit ?? ""} ${m.type}`}
                        </span>
                        <span className="truncate text-[13px] text-gray-500">{[m.projects?.title, m.reason, m.profiles?.full_name].filter(Boolean).join(" · ") || "—"}</span>
                      </span>
                      <span className="whitespace-nowrap text-[12px] text-gray-500">{timeAgo(m.created_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">Stock ins and outs will show up here.</p>
            )}
            <Link href="/admin/inventory/history" className="group mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:underline">
              Full history <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}
