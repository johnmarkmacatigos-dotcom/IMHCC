import Link from "next/link";
import { inquiryStatus } from "./ui";

type Day = { key: string; date: string; count: number };
type Slice = { status: keyof typeof inquiryStatus; count: number };

const statusColor: Record<keyof typeof inquiryStatus, string> = {
  new: "#b83227",
  contacted: "#142b46",
  site_visit: "#4a6a92",
  quoted: "#c99a35",
  won: "#2f8f57",
  lost: "#e3a199",
  closed: "#c4cad3",
};

const dayLabel = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
const weekday = new Intl.DateTimeFormat("en-PH", { weekday: "narrow", timeZone: "Asia/Manila" });

/**
 * Two small charts for the overview: inquiries per day (bars grow up one after another) and
 * where every inquiry stands (the segments sweep in from the left). Pure CSS, no chart library.
 */
export function InquiryCharts({ days, pipeline }: { days: Day[]; pipeline: Slice[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const total14 = days.reduce((n, d) => n + d.count, 0);
  const totalAll = pipeline.reduce((n, s) => n + s.count, 0);

  return (
    <div className="admin-stagger grid gap-6 lg:grid-cols-[3fr_2fr]">
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6">
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 className="text-lg">Inquiries, last 14 days</h2>
          <span className="text-sm text-gray-600">
            <span className="font-display text-xl font-semibold text-navy-800">{total14}</span> total
          </span>
        </div>
        <ul className="flex h-40 items-end gap-1 sm:gap-1.5" aria-label="Inquiries per day">
          {days.map((d, i) => {
            const today = i === days.length - 1;
            return (
              <li key={d.key} className="group relative flex h-full flex-1 flex-col justify-end" aria-label={`${dayLabel.format(new Date(d.date))}: ${d.count}`}>
                <span className="pointer-events-none absolute inset-x-0 -top-1 z-10 mx-auto w-max -translate-y-full rounded-md bg-navy-900 px-2 py-1 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow transition group-hover:-translate-y-[calc(100%+4px)] group-hover:opacity-100">
                  {dayLabel.format(new Date(d.date))} · {d.count}
                </span>
                <span
                  className={`admin-bar-y block rounded-t-md transition-colors ${today ? "bg-gold-500 group-hover:bg-gold-300" : "bg-navy-800 group-hover:bg-navy-700"}`}
                  style={{ "--i": i, height: d.count ? `${Math.max(6, (d.count / max) * 100)}%` : "3px", opacity: d.count ? 1 : 0.18 } as React.CSSProperties}
                  aria-hidden
                />
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex gap-1 text-center text-[11px] text-gray-500 sm:gap-1.5" aria-hidden>
          {days.map((d, i) => (
            <span key={d.key} className={`flex-1 ${i === days.length - 1 ? "font-bold text-gold-700" : ""}`}>
              {i === days.length - 1 ? "Today" : weekday.format(new Date(d.date))}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6">
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 className="text-lg">Where inquiries stand</h2>
          <span className="text-sm text-gray-600">
            <span className="font-display text-xl font-semibold text-navy-800">{totalAll}</span> all time
          </span>
        </div>
        <div className="flex h-4 overflow-hidden rounded-full bg-mist" aria-hidden>
          {totalAll > 0 &&
            pipeline
              .filter((s) => s.count > 0)
              .map((s, i) => (
                <span
                  key={s.status}
                  className="admin-bar-x h-full border-r-2 border-white last:border-r-0"
                  style={{ "--i": i, width: `${(s.count / totalAll) * 100}%`, background: statusColor[s.status] } as React.CSSProperties}
                />
              ))}
        </div>
        <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-1">
          {pipeline.map((s) => (
            <li key={s.status}>
              <Link href={`/admin/inquiries?status=${s.status}`} className="group flex items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-mist">
                <span className="size-2.5 shrink-0 rounded-full transition-transform group-hover:scale-125" style={{ background: statusColor[s.status] }} aria-hidden />
                <span className="flex-1 text-gray-700">{inquiryStatus[s.status].label}</span>
                <span className="font-semibold tabular-nums text-navy-800">{s.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
