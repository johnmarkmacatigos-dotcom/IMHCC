import Link from "next/link";
import { Megaphone } from "lucide-react";
import { JOB_OPENINGS, STANDING_ANNOUNCEMENTS, type Announcement } from "@/content/business";
import type { Promotion } from "@/lib/types";

/** Promotions whose dates include today (no dates = always on). */
function isCurrent(p: Promotion, today: string) {
  return (!p.starts_on || p.starts_on <= today) && (!p.ends_on || p.ends_on >= today);
}

export function buildAnnouncements(promotions: Promotion[]): Announcement[] {
  const today = new Date().toISOString().slice(0, 10);
  return [
    ...JOB_OPENINGS.map((j) => ({ label: "We're hiring", text: `${j.title} wanted. Message us to apply`, href: "/careers" })),
    ...promotions.filter((p) => isCurrent(p, today)).map((p) => ({ label: "Promo", text: p.title, href: "/promotions" })),
    ...STANDING_ANNOUNCEMENTS,
  ];
}

/**
 * Gold strip above the header whose messages glide right to left in a loop.
 * Pauses on hover or keyboard focus; with reduced motion it stays still and scrolls by hand.
 */
export function AnnouncementBar({ items }: { items: Announcement[] }) {
  if (items.length === 0) return null;
  const list = (copy: boolean) => (
    <ul className={copy ? "ticker-copy flex shrink-0" : "flex shrink-0"} aria-hidden={copy || undefined}>
      {items.map((a, i) => (
        <li key={`${copy}-${i}`} className="flex shrink-0 items-center">
          <Link href={a.href} tabIndex={copy ? -1 : undefined} className="group flex items-center gap-2.5 whitespace-nowrap px-6 py-2 hover:text-navy-950">
            <span className="rounded-full bg-brick-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white">{a.label}</span>
            <span className="font-semibold group-hover:underline group-hover:underline-offset-4">{a.text}</span>
            <span aria-hidden className="text-navy-800/60">→</span>
          </Link>
          <span aria-hidden className="text-navy-800/40">◆</span>
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="Announcements" className="ticker relative flex items-stretch bg-gold-500 text-[13px] text-navy-900">
      <span className="z-10 flex shrink-0 items-center gap-1.5 bg-navy-800 px-3 font-bold uppercase tracking-[0.08em] text-gold-300 sm:px-4">
        <Megaphone className="size-4" aria-hidden />
        <span className="hidden sm:inline">News</span>
      </span>
      <div className="ticker-viewport min-w-0 flex-1 overflow-hidden">
        <div className="ticker-track flex w-max" style={{ ["--ticker-duration" as string]: `${Math.max(20, items.length * 12)}s` }}>
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}
