import type { Metadata } from "next";
import Image from "next/image";
import { CtaBand } from "@/components/site/CtaBand";
import { PageHero } from "@/components/site/PageHero";
import { getSettings } from "@/lib/data";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "About us",
  description: "Learn about Iloilo Modern Homes Construction Co., a construction and renovation company in Santa Barbara, Iloilo.",
};

const values = [
  { title: "Honest pricing", body: "Clear, itemized quotations before any work starts, with no surprise charges." },
  { title: "Quality workmanship", body: "Skilled workers, proper materials, and careful finishing on every job." },
  { title: "Clear communication", body: "Progress photos and updates so you always know where your project stands." },
  { title: "Real results", body: "Every project we show is our own work, shared with our clients' permission." },
];

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <>
      <PageHero eyebrow="About us" title="Building modern homes for Ilonggo families" intro={s.about_intro ?? undefined} />
      <section className="container-site flex flex-wrap items-center gap-12 py-20">
        <div className="relative h-[460px] min-w-0 flex-[1_1_380px] overflow-hidden rounded-xl">
          <Image src="/images/projects/kitchen-island-pendants.jpg" alt="Modular kitchen with breakfast island by Iloilo Modern Homes" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
        </div>
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-8">
          {s.mission && (
            <div className="flex flex-col gap-2">
              <span className="eyebrow">Our mission</span>
              <p className="text-lg leading-relaxed text-gray-700">{s.mission}</p>
            </div>
          )}
          {s.vision && (
            <div className="flex flex-col gap-2">
              <span className="eyebrow">Our vision</span>
              <p className="text-lg leading-relaxed text-gray-700">{s.vision}</p>
            </div>
          )}
          {s.tagline && <p className="border-l-4 border-gold-500 pl-4 font-display text-xl text-navy-800">{s.tagline}</p>}
        </div>
      </section>
      <section className="bg-mist">
        <div className="container-site flex flex-col gap-8 py-20">
          <div className="flex flex-col gap-2.5">
            <span className="eyebrow">Why clients choose us</span>
            <h2 className="text-3xl sm:text-4xl">What you can expect</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="flex flex-col gap-2 rounded-xl bg-white p-6">
                <h3 className="text-lg">{v.title}</h3>
                <p className="text-[15px] leading-relaxed text-gray-600">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand tagline={s.tagline} phone={s.phone_primary} />
    </>
  );
}
