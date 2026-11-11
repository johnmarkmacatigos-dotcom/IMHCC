import Link from "next/link";
import { Inbox } from "lucide-react";
import { StatusBadge, EmptyState, LoadError, NoResults, PageHeader, Table, Td, inquiryStatus, inquiryType, timeAgo } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import { cn } from "@/lib/utils";

export const metadata = { title: "Inquiries" };

type Row = {
  id: string;
  reference_no: string;
  type: keyof typeof inquiryType;
  status: keyof typeof inquiryStatus;
  full_name: string;
  phone: string;
  location: string | null;
  service: string | null;
  created_at: string;
};

const PAGE = 25;
const openStatuses = ["new", "contacted", "site_visit", "quoted"];

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string; type?: string; q?: string; page?: string }> }) {
  const s = await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  let q = s.db
    .from("inquiries")
    .select("id, reference_no, type, status, full_name, phone, location, service, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (sp.status === "open") q = q.in("status", openStatuses);
  else if (sp.status && sp.status in inquiryStatus) q = q.eq("status", sp.status);
  if (sp.type && sp.type in inquiryType) q = q.eq("type", sp.type);
  const term = sp.q?.trim().replace(/[%,()]/g, " ").slice(0, 60);
  if (term) q = q.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,reference_no.ilike.%${term}%,location.ilike.%${term}%`);

  const { data, count, error } = await q.returns<Row[]>();
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status: sp.status, type: sp.type, q: sp.q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const str = p.toString();
    return `/admin/inquiries${str ? `?${str}` : ""}`;
  };

  const statusTabs = [
    { key: undefined, label: "All" },
    { key: "new", label: "New" },
    { key: "open", label: "In progress" },
    { key: "won", label: "Won" },
    { key: "lost", label: "Lost" },
    { key: "closed", label: "Closed" },
  ];

  return (
    <>
      <PageHeader title="Inquiries" intro="Quotation requests, product questions, consultation bookings, and messages from the website." />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
          {statusTabs.map((t) => (
            <Link
              key={t.label}
              href={link({ status: t.key, page: undefined })}
              aria-current={sp.status === t.key ? "page" : undefined}
              className={cn(
                "min-h-10 rounded-full px-4 py-2 text-sm font-medium",
                sp.status === t.key ? "bg-navy-800 text-white" : "bg-white text-navy-800 ring-1 ring-gray-200 hover:bg-navy-100",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <form className="flex flex-wrap gap-2" action="/admin/inquiries">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <select name="type" defaultValue={sp.type ?? ""} className="field-input w-auto" aria-label="Type">
            <option value="">All types</option>
            {Object.entries(inquiryType).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Name, phone, or reference" className="field-input w-56" aria-label="Search" />
          <button className="btn-outline px-4">Search</button>
        </form>
      </div>

      {error ? (
        <LoadError retryHref={link({})} what="inquiries" />
      ) : data && data.length > 0 ? (
        <Table head={["Reference", "Customer", "Request", "Status", "Received"]}>
          {data.map((i) => (
            <tr key={i.id} className={cn("hover:bg-mist", i.status === "new" && "bg-gold-100/40")}>
              <Td>
                <Link href={`/admin/inquiries/${i.id}`} className="font-mono text-[13px] font-semibold text-navy-800 underline-offset-2 hover:underline">
                  {i.reference_no}
                </Link>
              </Td>
              <Td>
                <Link href={`/admin/inquiries/${i.id}`} className="block font-semibold text-navy-800">
                  {i.full_name}
                </Link>
                <span className="text-[13px] text-gray-500">
                  {i.phone}
                  {i.location ? ` · ${i.location}` : ""}
                </span>
              </Td>
              <Td>
                <span className="block">{i.service ?? "—"}</span>
                <span className="text-[13px] text-gray-500">{inquiryType[i.type]}</span>
              </Td>
              <Td>
                <StatusBadge status={i.status} />
              </Td>
              <Td className="whitespace-nowrap text-gray-600">{timeAgo(i.created_at)}</Td>
            </tr>
          ))}
        </Table>
      ) : term || sp.status || sp.type ? (
        <NoResults
          term={term}
          clearHref={term ? link({ q: undefined, page: undefined }) : "/admin/inquiries"}
          tips={[
            term ? "Search part of a name, the last 4 digits of a phone number, or a reference like QR-2026-0012." : "Try the All tab, or another type.",
            sp.status || sp.type ? "Filters are on. Clear them to search every inquiry." : "Older inquiries are on later pages; searching looks through all of them.",
          ]}
          extra={
            (sp.status || sp.type) && term ? (
              <Link href={`/admin/inquiries?q=${encodeURIComponent(term)}`} className="btn-outline">
                Search all inquiries instead
              </Link>
            ) : undefined
          }
        />
      ) : (
        <EmptyState icon={Inbox} title="No inquiries yet">
          When customers send the quote, contact, consultation, or product forms on the website, each request lands here with a reference number. Share the
          website link on Facebook to get the first one.
        </EmptyState>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Page {page} of {pages} · {total} inquiries
          </span>
          <span className="flex gap-2">
            {page > 1 && (
              <Link className="btn-outline px-4 py-2" href={link({ page: String(page - 1) })}>
                Previous
              </Link>
            )}
            {page < pages && (
              <Link className="btn-outline px-4 py-2" href={link({ page: String(page + 1) })}>
                Next
              </Link>
            )}
          </span>
        </nav>
      )}
    </>
  );
}
