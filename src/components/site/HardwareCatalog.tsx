"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, PackageSearch, Search, Truck, X } from "lucide-react";
import { StatePanel } from "@/components/states/StatePanel";
import type { Product, StockStatus } from "@/lib/types";
import { cn, formatPeso } from "@/lib/utils";

const stockLabel: Record<StockStatus, { text: string; cls: string }> = {
  in_stock: { text: "In stock", cls: "bg-[#e7f3ec] text-[#1e6b3e]" },
  low_stock: { text: "Low stock", cls: "bg-gold-500 text-navy-900" },
  out_of_stock: { text: "Out of stock", cls: "bg-brick-600 text-white" },
  made_to_order: { text: "Made to order", cls: "bg-navy-800 text-white" },
};

/**
 * The hardware catalog with a search box. A search that finds nothing never dead-ends: it
 * suggests nearby categories and offers to ask us directly, since we may stock it anyway.
 */
export function HardwareCatalog({ products }: { products: Product[] }) {
  const [q, setQ] = useState("");
  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const term = q.trim().toLowerCase();
  const shown = term
    ? products.filter((p) => [p.name, p.category, p.description, p.specifications].some((v) => v?.toLowerCase().includes(term)))
    : products;
  const shownCategories = categories.filter((c) => shown.some((p) => p.category === c));

  if (products.length === 0) {
    return (
      <StatePanel
        tone="empty"
        icon={PackageSearch}
        eyebrow="Catalog coming soon"
        title="We're putting our product list online"
        actions={
          <>
            <Link href="/contact?tab=contact" className="btn-gold">
              <MessageCircle className="size-4" aria-hidden /> Ask what&apos;s available
            </Link>
            <Link href="/services" className="btn-outline">
              See our services
            </Link>
          </>
        }
      >
        Wall panels, ceiling materials, and construction supplies are in stock at our Santa Barbara shop. Message us for today&apos;s prices and delivery.
      </StatePanel>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <label className="flex min-h-12 max-w-xl items-center gap-2.5 rounded-lg border border-[#cbd2dc] bg-white px-3.5 focus-within:border-navy-800 focus-within:ring-2 focus-within:ring-navy-800/20">
          <Search className="size-5 shrink-0 text-gray-500" aria-hidden />
          <span className="sr-only">Search products</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search panels, ceiling, cement…"
            className="w-full bg-transparent py-2.5 text-[15px] outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="flex size-8 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100">
              <X className="size-4" aria-hidden />
            </button>
          )}
        </label>
        <p className="text-sm text-gray-600" aria-live="polite">
          {term ? `${shown.length} of ${products.length} products match “${q.trim()}”` : `${products.length} products in ${categories.length} categories`}
        </p>
      </div>

      {shown.length === 0 ? (
        <StatePanel
          tone="search"
          icon={PackageSearch}
          title={`No products match “${q.trim()}”`}
          role="status"
          tips={[
            "Check the spelling, or try a shorter word like “panel” or “ceiling”.",
            "Not everything we sell is online yet. Ask us, we may have it in the shop.",
          ]}
          actions={
            <>
              <Link href={`/contact?tab=contact`} className="btn-gold">
                <MessageCircle className="size-4" aria-hidden /> Ask if we have it
              </Link>
              <button type="button" onClick={() => setQ("")} className="btn-outline">
                Show all products
              </button>
            </>
          }
        >
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <span className="w-full text-sm text-gray-500">Or browse a category:</span>
            {categories.map((c) => (
              <button key={c} type="button" onClick={() => setQ(c)} className="min-h-10 rounded-full bg-navy-100 px-4 text-sm font-medium text-navy-800 hover:bg-navy-800 hover:text-white">
                {c}
              </button>
            ))}
          </div>
        </StatePanel>
      ) : (
        shownCategories.map((cat) => (
          <section key={cat} className="flex flex-col gap-6" aria-labelledby={`pc-${cat}`}>
            <h2 id={`pc-${cat}`} className="text-2xl sm:text-3xl">
              {cat}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown
                .filter((p) => p.category === cat)
                .map((p) => (
              <article key={p.id} id={p.slug} className="flex scroll-mt-28 flex-col overflow-hidden rounded-xl border border-gray-200">
                <div className="relative aspect-[4/3] bg-mist">
                  {p.image_url && <Image src={p.image_url} alt={p.name} fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover" />}
                  <span className={cn("absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold", stockLabel[p.stock_status].cls)}>{stockLabel[p.stock_status].text}</span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <h3 className="text-xl">{p.name}</h3>
                  {p.description && <p className="text-[15px] leading-relaxed text-gray-600">{p.description}</p>}
                  {p.specifications && <p className="text-sm whitespace-pre-line text-gray-500">{p.specifications}</p>}
                  <p className="font-display text-lg font-semibold text-navy-800">
                    {p.price_on_request || p.price === null ? "Price on request" : `${formatPeso(p.price)}${p.price_unit ? ` / ${p.price_unit}` : ""}`}
                  </p>
                  {p.delivery_info && (
                    <p className="flex gap-2 text-sm text-gray-600">
                      <Truck className="mt-0.5 size-4 shrink-0" aria-hidden /> {p.delivery_info}
                    </p>
                  )}
                  <Link href={`/contact?product=${p.slug}`} className="btn-navy mt-auto">
                    Ask about this product
                  </Link>
                </div>
              </article>
                ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
