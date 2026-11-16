import type { StockStatus } from "@/lib/types";

/**
 * The availability to show and save for a product, given its quantity on hand.
 * "Made to order" is never overridden. Zero on hand means out of stock; a positive
 * quantity is never shown as out of stock. "Low stock" stays as the owner set it.
 * An unknown quantity (sample content) keeps the saved status.
 */
export function effectiveStockStatus(status: StockStatus, quantity: number | null | undefined): StockStatus {
  if (status === "made_to_order" || quantity == null) return status;
  if (Number(quantity) <= 0) return "out_of_stock";
  if (status === "out_of_stock") return "in_stock";
  return status;
}
