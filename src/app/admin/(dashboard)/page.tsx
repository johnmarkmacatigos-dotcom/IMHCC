import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusBadge, Card, EmptyState, PageHeader, inquiryStatus, inquiryType, timeAgo } from "@/components/admin/ui";
import { InquiryCharts } from "@/components/admin/Charts";
import { CountUp } from "@/components/admin/motion";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Overview" };

type Recent = { id: string; reference_no: string; type: keyof typeof inquiryType; status: keyof typeof inquiryStatus; full_name: string; service: string | null; created_at: string };

export default async function Overview({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const s = await requireAdmin();
  const { denied } = await searchParams;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const count = (table: string, filter: (q: ReturnType<typeof base>) => ReturnType<typeof base>) => filter(base(table)).then((r) => r.count ?? 0);
  function base(table: string) {
    return s.db.from(table).select("id", { count: "exact", head: true });
  }

  const DAY = 86_400_000;
  const now = Date.now();
  const since = new Date(now - 14 * DAY);
  const statusKeys = Object.keys(inquiryStatus) as (keyof typeof inquiryStatus)[];

  const [newCount, monthCount, openQuotes, wonMonth, published, pendingReviews, toReorder, recent, lastTwoWeeks, ...byStatus] = await Promise.all([
    count("inquiries", (q) => q.eq("status", "new")),
    count("inquiries", (q) => q.gte("created_at", monthStart.toISOString())),
    count("inquiries", (q) => q.eq("type", "quotation").in("status", ["new", "contacted", "site_visit", "quoted"])),
    count("inquiries", (q) => q.eq("status", "won").gte("updated_at", monthStart.toISOString())),
    count("projects", (q) => q.eq("is_published", true)),
    count("testimonials", (q) => q.eq("status", "pending")),
    count("inventory_levels", (q) => q.eq("is_active", true).in("stock_state", ["low", "out"])),
    s.db.from("inquiries").select("id, reference_no, type, status, full_name, service, created_at").order("created_at", { ascending: false }).limit(8).returns<Recent[]>(),
    s.db.from("inquiries").select("created_at").gte("created_at", since.toISOString()).limit(5000).returns<{ created_at: string }[]>(),
    ...statusKeys.map((k) => count("inquiries", (q) => q.eq("status", k))),
  ]);

  // Inquiries per day for the last 14 days, counted in Philippine time.
  const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" });
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * DAY);
    return { key: dayKey.format(d), date: d.toISOString(), count: 0 };
  });
  const byDay = new Map(days.map((d) => [d.key, d]));
  for (const r of lastTwoWeeks.data ?? []) {
    const d = byDay.get(dayKey.format(new Date(r.created_at)));
    if (d) d.count++;
  }
  const pipeline = statusKeys.map((k, i) => ({ status: k, count: byStatus[i] as number }));

  const stats = [
    { label: "New inquiries", value: newCount, href: "/admin/inquiries?status=new", highlight: newCount > 0, accent: "border-brick-600" },
    { label: "Inquiries this month", value: monthCount, href: "/admin/inquiries", accent: "border-navy-800" },
    { label: "Open quotations", value: openQuotes, href: "/admin/inquiries?type=quotation&status=open", accent: "border-gold-500" },
    { label: "Jobs won this month", value: wonMonth, href: "/admin/inquiries?status=won", accent: "border-gold-500" },
    { label: "Projects on the website", value: published, href: "/admin/projects", hide: !s.can.edit, accent: "border-navy-800" },
    { label: "Testimonials to review", value: pendingReviews, href: "/admin/testimonials", hide: !s.can.edit, highlight: pendingReviews > 0, accent: "border-brick-600" },
    { label: "Inventory to reorder", value: toReorder, href: "/admin/inventory?state=reorder", highlight: toReorder > 0, accent: "border-brick-600" },
  ].filter((x) => !x.hide);

  const firstName = (s.profile.full_name ?? "").split(" ")[0];

  return (
    <>
      <PageHeader title={firstName ? `Hello, ${firstName}` : "Overview"} intro="Here is what is happening with the business today." />
      {denied && (
        <p role="alert" className="rounded-lg bg-brick-50 px-4 py-3 text-sm font-medium text-brick-700">
          Your role does not include that page. Ask the owner if you need access.
        </p>
      )}

      <div className="admin-stagger grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {stats.map((st) => (
          <Link
            key={st.label}
            href={st.href}
            className={`admin-lift group relative flex flex-col gap-1 overflow-hidden rounded-xl border-t-4 bg-white p-5 shadow-sm ring-1 hover:ring-navy-800 ${st.accent} ${st.highlight ? "ring-brick-500" : "ring-gray-200"}`}
          >
            <span className={`font-display text-3xl font-semibold ${st.highlight ? "text-brick-600" : "text-navy-800"}`}>
              <CountUp value={st.value} />
            </span>
            <span className="text-sm text-gray-600">{st.label}</span>
            <ArrowRight
              className="absolute right-4 top-5 size-4 -translate-x-1 text-gray-400 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100"
              aria-hidden
            />
            {st.highlight && <span className="absolute right-4 bottom-5 size-2 animate-pulse rounded-full bg-brick-500" aria-hidden />}
          </Link>
        ))}
      </div>

      <InquiryCharts days={days} pipeline={pipeline} />

      <Card title="Latest inquiries">
        {recent.data && recent.data.length > 0 ? (
          <ul className="admin-stagger -mx-2 flex flex-col divide-y divide-gray-100">
            {recent.data.map((i) => (
              <li key={i.id}>
                <Link href={`/admin/inquiries/${i.id}`} className="group flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg px-2 py-3 transition-colors hover:bg-mist">
                  <span className="w-28 font-mono text-[13px] text-gray-500">{i.reference_no}</span>
                  <span className="min-w-40 flex-1 font-semibold text-navy-800 transition-transform duration-200 group-hover:translate-x-1">{i.full_name}</span>
                  <span className="text-sm text-gray-600">{i.service ?? inquiryType[i.type]}</span>
                  <StatusBadge status={i.status} />
                  <span className="w-24 text-right text-[13px] text-gray-500">{timeAgo(i.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No inquiries yet. Requests from the website&apos;s quote, contact, and product forms will show up here.</EmptyState>
        )}
        <Link href="/admin/inquiries" className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-800 hover:underline">
          All inquiries <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </Card>
    </>
  );
}
