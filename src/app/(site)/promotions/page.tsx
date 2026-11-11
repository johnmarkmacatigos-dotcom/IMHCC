import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { StatePanel } from "@/components/states/StatePanel";
import { getPromotions } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;
export const metadata: Metadata = { title: "Promotions", description: "Current promos and announcements from Iloilo Modern Homes." };

export default async function PromotionsPage() {
  const promos = await getPromotions();
  return (
    <>
      <PageHero eyebrow="Promotions" title="Current promos and announcements" />
      <div className="container-site py-14">
        {promos.length === 0 ? (
          <StatePanel
            tone="empty"
            icon={Megaphone}
            eyebrow="No promos this week"
            title="No active promos right now, but quotes are always free"
            actions={
              <>
                <Link href="/quote" className="btn-gold">
                  Request a free quotation
                </Link>
                <a href="https://www.facebook.com/modernhomesrose" target="_blank" rel="noopener noreferrer" className="btn-outline">
                  Follow us on Facebook
                </a>
              </>
            }
          >
            New promos are posted here and on our Facebook page first. Follow us so you don&apos;t miss the next one.
          </StatePanel>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {promos.map((p) => (
              <article key={p.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-200">
                {p.banner_image && (
                  <div className="relative aspect-[16/9]">
                    <Image src={p.banner_image} alt="" fill sizes="(min-width: 768px) 600px, 100vw" className="object-cover" />
                  </div>
                )}
                <div className="flex flex-col gap-3 p-6">
                  <h2 className="text-2xl">{p.title}</h2>
                  {(p.starts_on || p.ends_on) && (
                    <p className="self-start rounded-full bg-brick-600 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-white">
                      {p.ends_on ? `Until ${formatDate(p.ends_on)}` : `Starting ${formatDate(p.starts_on!)}`}
                    </p>
                  )}
                  {p.description && <p className="leading-relaxed whitespace-pre-line text-gray-700">{p.description}</p>}
                  {p.terms && <p className="text-sm text-gray-500">{p.terms}</p>}
                  {p.cta_url && (
                    <Link href={p.cta_url} className="btn-gold self-start">
                      {p.cta_label ?? "Learn more"}
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
