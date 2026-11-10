import type { Metadata } from "next";
import { Briefcase, Check } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { JOB_OPENINGS, WHATSAPP_NUMBER, whatsappHref } from "@/content/business";
import { getSettings } from "@/lib/data";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Careers",
  description: "Job openings at Iloilo Modern Homes Construction Co. in Iloilo. Message us to apply.",
};

export default async function CareersPage() {
  const s = await getSettings();
  return (
    <>
      <PageHero eyebrow="We are hiring" title="Build with our team" intro="We are always looking for skilled, reliable workers who take pride in a clean finish. Message us to apply." />
      <section className="container-site flex flex-col gap-6 py-16">
        {JOB_OPENINGS.length === 0 && <p className="text-lg text-gray-600">No openings right now. Follow our Facebook page for new postings.</p>}
        {JOB_OPENINGS.map((job) => (
          <article key={job.title} className="flex flex-wrap items-start justify-between gap-6 rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
            <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-lg bg-navy-800 text-gold-300">
                  <Briefcase className="size-5" aria-hidden />
                </span>
                <div className="flex flex-col">
                  <h2 className="text-2xl">{job.title}</h2>
                  <span className="text-[13px] text-gray-500">{job.type}</span>
                </div>
              </div>
              <p className="text-[16px] leading-relaxed text-gray-700">{job.summary}</p>
              <ul className="flex flex-col gap-2">
                {job.requirements.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-[15px] text-gray-700">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold-500" aria-hidden />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-2.5">
              {s.messenger_url && (
                <a href={s.messenger_url} target="_blank" rel="noopener noreferrer" className="btn-gold">
                  Apply on Messenger
                </a>
              )}
              <a href={whatsappHref(WHATSAPP_NUMBER, `Hi! I'd like to apply as ${job.title}.`)} target="_blank" rel="noopener noreferrer" className="btn-outline">
                Apply on WhatsApp
              </a>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
