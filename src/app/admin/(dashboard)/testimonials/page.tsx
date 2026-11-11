import { MessageSquareQuote, Plus, Star } from "lucide-react";
import Link from "next/link";
import { Badge, EmptyState, PageHeader, Table, Td } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Testimonials" };

type Row = { id: string; customer_name: string; customer_town: string | null; quote: string; rating: number | null; status: "pending" | "approved" | "hidden"; consent_given: boolean; is_featured: boolean };
const statusBadge = { pending: { label: "To review", tone: "brick" }, approved: { label: "Shown", tone: "green" }, hidden: { label: "Hidden", tone: "gray" } } as const;

export default async function TestimonialsPage() {
  const s = await requireAdmin("edit");
  const { data } = await s.db.from("testimonials").select("id, customer_name, customer_town, quote, rating, status, consent_given, is_featured").order("created_at", { ascending: false }).returns<Row[]>();
  return (
    <>
      <PageHeader
        title="Testimonials"
        intro="Customer feedback. A testimonial is shown on the website only when it is approved and the customer agreed to it being shared."
        action={
          <Link href="/admin/testimonials/new" className="btn-gold">
            <Plus className="size-4" aria-hidden /> Add testimonial
          </Link>
        }
      />
      {data && data.length > 0 ? (
        <Table head={["Customer", "Testimonial", "Rating", "Status"]}>
          {data.map((t) => (
            <tr key={t.id} className="hover:bg-mist">
              <Td>
                <Link href={`/admin/testimonials/${t.id}`} className="block font-semibold text-navy-800">
                  {t.customer_name}
                </Link>
                <span className="text-[13px] text-gray-500">{t.customer_town ?? ""}</span>
              </Td>
              <Td className="max-w-md">
                <span className="line-clamp-2 text-gray-700">“{t.quote}”</span>
              </Td>
              <Td>
                {t.rating ? (
                  <span className="inline-flex items-center gap-1" aria-label={`${t.rating} out of 5`}>
                    <Star className="size-4 fill-gold-500 text-gold-500" aria-hidden /> {t.rating}
                  </span>
                ) : (
                  "—"
                )}
              </Td>
              <Td>
                <span className="flex flex-wrap gap-1.5">
                  <Badge tone={statusBadge[t.status].tone}>{statusBadge[t.status].label}</Badge>
                  {!t.consent_given && <Badge tone="red">No consent</Badge>}
                  {t.is_featured && <Badge tone="goldSolid">Featured</Badge>}
                </span>
              </Td>
            </tr>
          ))}
        </Table>
      ) : (
        <EmptyState
          icon={MessageSquareQuote}
          title="No customer reviews yet"
          action={
            <Link href="/admin/testimonials/new" className="btn-gold">
              Add a testimonial
            </Link>
          }
        >
          After a job, ask the customer for a few words and their permission to share them. Approved reviews show on the homepage.
        </EmptyState>
      )}
    </>
  );
}
