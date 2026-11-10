import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageHeader({ title, intro, action }: { title: string; intro?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-tight">{title}</h1>
        {intro && <p className="max-w-2xl text-[15px] text-gray-600">{intro}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <section className={cn("rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6", className)}>
      {title && <h2 className="mb-4 text-lg">{title}</h2>}
      {children}
    </section>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="self-start text-sm font-semibold text-navy-800 hover:underline">
      ← {children}
    </Link>
  );
}

const tones = {
  gray: "bg-gray-100 text-gray-700",
  navy: "bg-navy-100 text-navy-800",
  gold: "bg-gold-100 text-gold-700",
  green: "bg-[#e7f3ec] text-[#1e6b3e]",
  red: "bg-brick-50 text-brick-700",
  /** Solid logo colors, for things that need attention at a glance. */
  brick: "bg-brick-600 text-white",
  goldSolid: "bg-gold-500 text-navy-900",
} as const;

export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: keyof typeof tones }) {
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone])}>{children}</span>;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-[15px] text-gray-600">{children}</p>;
}

/** Responsive table: scrolls sideways on phones instead of squashing columns. */
export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-[13px] text-gray-600">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}

export const inquiryStatus = {
  new: { label: "New", tone: "brick" },
  contacted: { label: "Contacted", tone: "navy" },
  site_visit: { label: "Site visit", tone: "navy" },
  quoted: { label: "Quoted", tone: "goldSolid" },
  won: { label: "Won", tone: "green" },
  lost: { label: "Lost", tone: "red" },
  closed: { label: "Closed", tone: "gray" },
} as const;

export const inquiryType = {
  quotation: "Quotation",
  product: "Product",
  consultation: "Consultation",
  contact: "Message",
} as const;

export function timeAgo(iso: string) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export function dateTime(iso: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(iso));
}
