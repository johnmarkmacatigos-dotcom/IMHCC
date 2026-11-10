import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Truck } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { getProducts } from "@/lib/data";
import type { StockStatus } from "@/lib/types";
import { cn, formatPeso } from "@/lib/utils";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Hardware and products",
  description: "Wall panels, ceiling materials, and construction supplies with delivery in Iloilo.",
};

const stockLabel: Record<StockStatus, { text: string; cls: string }> = {
  in_stock: { text: "In stock", cls: "bg-[#e7f3ec] text-[#1e6b3e]" },
  low_stock: { text: "Low stock", cls: "bg-gold-500 text-navy-900" },
  out_of_stock: { text: "Out of stock", cls: "bg-brick-600 text-white" },
  made_to_order: { text: "Made to order", cls: "bg-navy-800 text-white" },
};

export default async function HardwarePage() {
  const products = await getProducts();
  const categories = [...new Set(products.map((p) => p.category))];
  return (
    <>
      <PageHero eyebrow="Hardware and products" title="Materials for your next project" intro="Quality construction and finishing materials, available for pickup or delivery around Iloilo." />
      <div className="container-site flex flex-col gap-14 py-14">
        {products.length === 0 && <p className="text-gray-600">Our product catalog is being updated. Message us for available materials and prices.</p>}
        {categories.map((cat) => (
          <section key={cat} className="flex flex-col gap-6" aria-labelledby={`pc-${cat}`}>
            <h2 id={`pc-${cat}`} className="text-2xl sm:text-3xl">
              {cat}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products
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
        ))}
      </div>
    </>
  );
}
