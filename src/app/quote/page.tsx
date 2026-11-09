import type { Metadata } from "next";
import Image from "next/image";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { getServices, getSettings } from "@/lib/data";
import { telHref } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Request a free quotation",
  description: "Tell us about your construction or renovation project in Iloilo and get a free quotation.",
};

type Props = { searchParams: Promise<{ service?: string; project?: string }> };

export default async function QuotePage({ searchParams }: Props) {
  const [{ service, project }, services, settings] = await Promise.all([searchParams, getServices(), getSettings()]);
  const names = services.map((s) => s.name);
  const options = [...names, "Other"];
  const preset = service && options.includes(service) ? service : undefined;

  return (
    <div className="bg-mist">
      <div className="container-site flex flex-wrap items-start gap-10 py-12 sm:py-16">
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          <span className="eyebrow">Free quotation</span>
          <h1 className="text-4xl leading-tight sm:text-[42px]">Tell us about your project</h1>
          <p className="text-lg leading-relaxed text-gray-600">
            Share a few details and photos of your space. Our team will review it and contact you to schedule a free site visit.
          </p>
          {project && (
            <p className="rounded-lg bg-white px-4 py-3 text-[15px]">
              You were looking at: <strong className="text-navy-800">{project}</strong>
            </p>
          )}
          <div className="relative h-72 overflow-hidden rounded-xl">
            <Image src="/images/projects/condo-wood-desk-kitchenette.jpg" alt="Condo unit with wood desk and kitchenette by Iloilo Modern Homes" fill sizes="(min-width: 1024px) 420px, 100vw" className="object-cover" />
          </div>
          <ol className="flex list-decimal flex-col gap-2.5 pl-5 text-[15px] leading-relaxed text-gray-700">
            <li>You send your request and get a reference number.</li>
            <li>We call you to discuss and schedule a free site visit.</li>
            <li>You receive a detailed quotation.</li>
          </ol>
          {settings.phone_primary && (
            <p className="text-[15px] text-gray-700">
              Prefer to talk?{" "}
              <a href={telHref(settings.phone_primary)} className="font-semibold text-navy-800 underline">
                Call {settings.phone_primary}
              </a>
            </p>
          )}
        </div>
        <div className="min-w-0 flex-[999_1_560px] rounded-2xl border border-gray-200 bg-white p-6 sm:p-9">
          <InquiryForm
            type="quotation"
            services={options}
            defaultService={preset}
            key={preset ?? "none"}
          />
        </div>
      </div>
    </div>
  );
}
