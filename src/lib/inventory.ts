/** Shared labels and helpers for the dashboard's Inventory pages. */

export const inventoryKinds = {
  material: "Material",
  product: "Product",
  tool: "Tool",
  other: "Other",
} as const;
export type InventoryKind = keyof typeof inventoryKinds;

export const stockStates = {
  ok: { label: "In stock", tone: "green" },
  low: { label: "Low stock", tone: "goldSolid" },
  out: { label: "Out of stock", tone: "brick" },
} as const;
export type StockState = keyof typeof stockStates;

export const moveTypes = {
  in: "Stock in",
  out: "Stock out",
  adjust: "Count correction",
} as const;
export type MoveType = keyof typeof moveTypes;

/** Quick picks for the reason box; anything else can be typed. */
export const moveReasons: Record<MoveType, string[]> = {
  in: ["Supplier delivery", "Opening stock", "Returned from site", "Customer return"],
  out: ["Used on a project", "Sold", "Damaged or lost", "Returned to supplier"],
  adjust: ["Stock count", "Found extra", "Missing"],
};

export const commonUnits = ["pcs", "bags", "boxes", "sheets", "meters", "kg", "liters", "rolls", "sets", "units", "gallons", "lengths"];

export type InventoryLevel = {
  id: string;
  name: string;
  kind: InventoryKind;
  category: string | null;
  sku: string | null;
  unit: string;
  quantity: number;
  reorder_level: number;
  unit_cost: number | null;
  location: string | null;
  supplier: string | null;
  notes: string | null;
  product_id: string | null;
  is_active: boolean;
  stock_state: StockState;
  stock_value: number;
  last_moved_at: string | null;
  updated_at: string;
};

export type Movement = {
  id: string;
  item_id: string;
  type: MoveType;
  quantity: number;
  change: number;
  balance_after: number;
  reason: string | null;
  reference: string | null;
  note: string | null;
  unit_cost: number | null;
  created_at: string;
  project_id: string | null;
  projects?: { title: string } | null;
  profiles?: { full_name: string | null } | null;
  inventory_items?: { name: string; unit: string } | null;
};

const qtyFormat = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 });
/** 12, 12.5, 1,250 — no trailing ".00". */
export function formatQty(n: number | string) {
  return qtyFormat.format(Number(n));
}

/** How full the level bar is: the reorder line sits at one third, so "low" reads at a glance. */
export function meterScale(quantity: number, reorder: number) {
  const scale = Math.max(Number(reorder) * 3, Number(quantity), 1);
  return { fill: Math.min(1, Number(quantity) / scale), mark: Number(reorder) > 0 ? Number(reorder) / scale : null };
}
