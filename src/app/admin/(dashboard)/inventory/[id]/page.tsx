import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArchiveRestore, ExternalLink } from "lucide-react";
import { AdminForm, SelectField, TextArea, TextField } from "@/components/admin/Form";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { CountUp } from "@/components/admin/motion";
import { MoveIcon, StockDialog, StockMeter } from "@/components/admin/StockDialog";
import { BackLink, Badge, Card, EmptyState, PageHeader, Table, Td, dateTime, timeAgo } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import { commonUnits, formatQty, inventoryKinds, meterScale, stockStates, type InventoryLevel, type Movement } from "@/lib/inventory";
import { cn, formatPeso } from "@/lib/utils";
import { archiveItem, deleteItem, saveItem } from "../actions";

export const metadata = { title: "Inventory item" };

export default async function InventoryItemPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ name?: string }> }) {
  const s = await requireAdmin("team");
  const { id } = await params;
  const suggestedName = (await searchParams).name?.slice(0, 120);
  const isNew = id === "new";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [item, products, linked, projects, history] = await Promise.all([
    isNew ? Promise.resolve(null) : s.db.from("inventory_levels").select("*").eq("id", id).maybeSingle<InventoryLevel>().then((r) => r.data),
    s.db.from("products").select("id, name").order("name").limit(500).returns<{ id: string; name: string }[]>().then((r) => r.data ?? []),
    s.db.from("inventory_items").select("id, product_id").not("product_id", "is", null).returns<{ id: string; product_id: string }[]>().then((r) => r.data ?? []),
    s.db.from("projects").select("id, title").order("created_at", { ascending: false }).limit(50).returns<{ id: string; title: string }[]>().then((r) => r.data ?? []),
    isNew
      ? Promise.resolve([] as Movement[])
      : s.db
          .from("inventory_movements")
          .select("id, type, quantity, change, balance_after, reason, reference, note, unit_cost, created_at, project_id, projects(title), profiles(full_name)")
          .eq("item_id", id)
          .order("created_at", { ascending: false })
          .limit(100)
          .returns<Movement[]>()
          .then((r) => r.data ?? []),
  ]);
  if (!isNew && !item) notFound();

  const takenProducts = new Set(linked.filter((l) => l.id !== item?.id).map((l) => l.product_id));
  const productOptions = [{ value: "", label: "Not on the website" }, ...products.filter((p) => !takenProducts.has(p.id)).map((p) => ({ value: p.id, label: p.name }))];
  const linkedProduct = item?.product_id ? products.find((p) => p.id === item.product_id) : null;

  const form = (
    <AdminForm action={saveItem} submitLabel={item ? "Save changes" : "Add item"} redirectToast={item ? "Saved." : "Item added."}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="name" label="Name" defaultValue={item?.name ?? suggestedName} placeholder="Portland cement, 40 kg" required />
        <SelectField name="kind" label="Type" defaultValue={item?.kind ?? "material"} options={Object.entries(inventoryKinds).map(([value, label]) => ({ value, label }))} />
        <TextField name="unit" label="Counted in" defaultValue={item?.unit ?? "pcs"} hint={`For example: ${commonUnits.slice(0, 6).join(", ")}`} required />
        <TextField name="category" label="Category (optional)" defaultValue={item?.category} placeholder="Masonry, Electrical, Plumbing" />
        {!item && <TextField name="opening" label="Opening stock" inputMode="decimal" placeholder="0" hint="How many you have right now. Recorded as the first stock in." />}
        <TextField name="reorder_level" label="Reorder when at or below" inputMode="decimal" defaultValue={item?.reorder_level ?? ""} placeholder="10" hint="The item turns Low stock and shows in Reorder soon." />
        <TextField name="unit_cost" label="Cost per unit (₱, optional)" inputMode="decimal" defaultValue={item?.unit_cost} placeholder="265" hint="Used for stock value. Updated when you stock in with a new cost." />
        <TextField name="sku" label="SKU / item code (optional)" defaultValue={item?.sku} />
        <TextField name="location" label="Where it is kept (optional)" defaultValue={item?.location} placeholder="Warehouse, shop, site" />
        <TextField name="supplier" label="Supplier (optional)" defaultValue={item?.supplier} />
      </div>
      <SelectField
        name="product_id"
        label="Hardware catalog product"
        defaultValue={item?.product_id ?? ""}
        options={productOptions}
        hint="Link a product and its stock and availability on the website follow this item."
      />
      <TextArea name="notes" label="Notes (optional)" defaultValue={item?.notes} rows={3} />
    </AdminForm>
  );

  if (!item) {
    return (
      <>
        <BackLink href="/admin/inventory">All inventory</BackLink>
        <PageHeader title="Add an item" intro="Anything you want to keep count of: construction materials, hardware for sale, or tools." />
        <Card>{form}</Card>
      </>
    );
  }

  const m = meterScale(item.quantity, item.reorder_level);
  const st = stockStates[item.stock_state];

  return (
    <>
      <BackLink href="/admin/inventory">All inventory</BackLink>
      <PageHeader
        title={item.name}
        intro={[inventoryKinds[item.kind], item.category, item.sku && `SKU ${item.sku}`, item.location].filter(Boolean).join(" · ")}
        action={item.is_active ? <StockDialog item={item} canAdjust={s.can.edit} projects={projects} /> : <Badge>Archived</Badge>}
      />

      <div className="admin-stagger grid gap-3 sm:grid-cols-3">
        <section className={cn("relative flex flex-col gap-3 rounded-xl border-t-4 bg-white p-5 shadow-sm ring-1 sm:col-span-2", item.stock_state === "ok" ? "border-navy-800 ring-gray-200" : "border-brick-600 ring-brick-500")}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <span className="flex items-baseline gap-2">
              <span className={cn("font-display text-5xl font-semibold", item.stock_state === "ok" ? "text-navy-800" : "text-brick-600")}>
                <CountUp value={Math.round(Number(item.quantity))} />
              </span>
              <span className="text-lg text-gray-600">{item.unit} on hand</span>
            </span>
            <span key={item.stock_state} className="admin-pop">
              <Badge tone={st.tone}>{st.label}</Badge>
            </span>
          </div>
          <StockMeter fill={m.fill} mark={m.mark} state={item.stock_state} />
          <span className="text-[13px] text-gray-500">
            {Number(item.reorder_level) > 0 ? `Reorder at ${formatQty(item.reorder_level)} ${item.unit} (red line).` : "No reorder level set."}
            {item.last_moved_at && ` Last moved ${timeAgo(item.last_moved_at)}.`}
          </span>
        </section>
        <section className="flex flex-col gap-1 rounded-xl border-t-4 border-gold-500 bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <span className="font-display text-3xl font-semibold text-navy-800">{formatPeso(Number(item.stock_value))}</span>
          <span className="text-sm text-gray-600">Stock value{item.unit_cost != null ? ` at ${formatPeso(Number(item.unit_cost))} / ${item.unit}` : " (add a cost per unit)"}</span>
          {linkedProduct && (
            <Link href={`/admin/products/${linkedProduct.id}`} className="mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-semibold text-navy-800 hover:underline">
              <ExternalLink className="size-4" aria-hidden /> On the website as {linkedProduct.name}
            </Link>
          )}
        </section>
      </div>

      <Card title="Stock history">
        {history.length > 0 ? (
          <Table head={["When", "Movement", "Balance", "Details", "By"]}>
            {history.map((h) => (
              <tr key={h.id} className="hover:bg-mist">
                <Td className="whitespace-nowrap text-gray-600">{dateTime(h.created_at)}</Td>
                <Td>
                  <span className="flex items-center gap-2.5">
                    <MoveIcon type={h.type} />
                    <span className={cn("font-semibold", Number(h.change) > 0 ? "text-[#1e6b3e]" : Number(h.change) < 0 ? "text-brick-600" : "text-gray-600")}>
                      {Number(h.change) > 0 ? "+" : Number(h.change) < 0 ? "−" : "±"}
                      {formatQty(Math.abs(Number(h.change)))} {item.unit}
                    </span>
                    {h.type === "adjust" && <span className="text-[13px] text-gray-500">(counted {formatQty(h.quantity)})</span>}
                  </span>
                </Td>
                <Td className="font-semibold text-navy-800">{formatQty(h.balance_after)}</Td>
                <Td className="text-gray-700">
                  {[h.reason, h.projects?.title, h.reference && `Ref ${h.reference}`, h.unit_cost != null && `${formatPeso(Number(h.unit_cost))} / ${item.unit}`, h.note].filter(Boolean).join(" · ") || "—"}
                </Td>
                <Td className="text-gray-600">{h.profiles?.full_name ?? "—"}</Td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState>No stock movements yet. Use Record stock to add the first delivery.</EmptyState>
        )}
      </Card>

      <Card title="Item details">{form}</Card>

      <div className="flex flex-wrap justify-end gap-2">
        {s.can.edit && (
          <form action={archiveItem}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="active" value={item.is_active ? "false" : "true"} />
            <button className="admin-press inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold text-navy-800 hover:bg-navy-100">
              {item.is_active ? <Archive className="size-4" aria-hidden /> : <ArchiveRestore className="size-4" aria-hidden />}
              {item.is_active ? "Archive" : "Restore"}
            </button>
          </form>
        )}
        {s.can.manage && <DeleteButton action={deleteItem} id={item.id} confirm={`Delete "${item.name}" and its whole stock history? This cannot be undone. Archive it instead to keep the history.`} />}
      </div>
    </>
  );
}
