import type { Metadata } from "next";
import { CtaBand } from "@/components/site/CtaBand";
import { PageHero } from "@/components/site/PageHero";
import { ServiceCard } from "@/components/site/ServiceCard";
import { getServices, getSettings } from "@/lib/data";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Services",
  description: "Construction, renovation, modular kitchens, interior fit-outs, ceilings, bathrooms, electrical, plumbing, roofing, flooring, and painting in Iloilo.",
};

export default async function ServicesPage() {
  const [services, s] = await Promise.all([getServices(), getSettings()]);
  const categories = [...new Set(services.map((x) => x.category))];
  return (
    <>
      <PageHero eyebrow="Services" title="Everything your home or business needs, from one team" intro="From the foundation to the final coat of paint, we handle the whole job or just the part you need." />
      <div className="container-site flex flex-col gap-16 py-16">
        {categories.map((cat) => (
          <section key={cat} className="flex flex-col gap-6" aria-labelledby={`cat-${cat}`}>
            <h2 id={`cat-${cat}`} className="text-2xl sm:text-3xl">
              {cat}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services
                .filter((x) => x.category === cat)
                .map((x) => (
                  <ServiceCard key={x.id} service={x} />
                ))}
            </div>
          </section>
        ))}
      </div>
      <CtaBand tagline={s.tagline} phone={s.phone_primary} />
    </>
  );
}
