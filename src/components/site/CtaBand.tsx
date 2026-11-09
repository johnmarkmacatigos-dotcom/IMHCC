import Link from "next/link";
import { telHref } from "@/lib/utils";

export function CtaBand({ tagline, phone }: { tagline: string | null; phone: string | null }) {
  return (
    <section className="bg-navy-800 text-white">
      <div className="container-site flex flex-wrap items-center justify-between gap-7 py-16">
        <div className="flex max-w-2xl flex-col gap-2.5">
          <h2 className="text-3xl text-white sm:text-4xl">{tagline ?? "Ready to build or renovate?"}</h2>
          <p className="text-lg text-[#d1d9e3]">Tell us about your project and get a free quotation.</p>
        </div>
        <div className="flex flex-wrap gap-3.5">
          <Link href="/quote" className="btn-gold">
            Request a quotation
          </Link>
          {phone && (
            <a href={telHref(phone)} className="btn-outline-gold">
              Call {phone}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
