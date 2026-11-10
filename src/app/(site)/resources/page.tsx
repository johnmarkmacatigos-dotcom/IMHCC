import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/site/CtaBand";
import { PageHero } from "@/components/site/PageHero";
import { PERMIT_STEPS } from "@/content/business";
import { getSettings } from "@/lib/data";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Building permit guide",
  description: "Step-by-step checklist before building a house in the Philippines, from land title to building permit, by Iloilo Modern Homes.",
};

export default async function ResourcesPage() {
  const s = await getSettings();
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Before you build: the building permit checklist"
        intro="Under the National Building Code of the Philippines, every new house needs a building permit. Here are the six steps, in order, so you won't miss any when building your home."
      />
      <section className="container-site flex flex-col gap-10 py-16">
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PERMIT_STEPS.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-6">
              <span className="flex size-10 items-center justify-center rounded-full bg-gold-500 font-display text-lg font-bold text-navy-900">{i + 1}</span>
              <h2 className="text-xl">{step.title}</h2>
              <p className="text-[15px] leading-relaxed text-gray-600">{step.detail}</p>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-3 rounded-xl border-l-4 border-gold-500 bg-mist p-6">
          <p className="font-display text-xl text-navy-800">Negotiate with us so you won&apos;t miss any step when building your home!</p>
          <p className="text-[15px] leading-relaxed text-gray-600">
            We prepare the signed plans your application needs and guide you through the barangay and building official requirements.{" "}
            <Link href="/services/building-permit-assistance" className="font-semibold text-navy-800 underline underline-offset-4">
              See our permit assistance service
            </Link>
            .
          </p>
          <p className="text-[13px] text-gray-500">Requirements and fees vary by city and municipality. Check with your local Office of the Building Official.</p>
        </div>
      </section>
      <CtaBand tagline="Planning to build? Start with a free consultation." phone={s.phone_primary} />
    </>
  );
}
