import type { Metadata } from "next";
import { HardwareCatalog } from "@/components/site/HardwareCatalog";
import { PageHero } from "@/components/site/PageHero";
import { getProducts } from "@/lib/data";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Hardware and products",
  description: "Wall panels, ceiling materials, and construction supplies with delivery in Iloilo.",
};

export default async function HardwarePage() {
  const products = await getProducts();
  return (
    <>
      <PageHero eyebrow="Hardware and products" title="Materials for your next project" intro="Quality construction and finishing materials, available for pickup or delivery around Iloilo." />
      <div className="container-site py-14">
        <HardwareCatalog products={products} />
      </div>
    </>
  );
}
