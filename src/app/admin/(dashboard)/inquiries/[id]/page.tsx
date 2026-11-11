import { buckets } from "@/lib/supabase/env";
import { notFound } from "next/navigation";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { AdminForm, SelectField, TextArea } from "@/components/admin/Form";
import { BackLink, StatusBadge, Card, PageHeader, dateTime, inquiryStatus, inquiryType } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import { telHref } from "@/lib/utils";
import { updateInquiry } from "../actions";

export const metadata = { title: "Inquiry" };

type Inquiry = {
  id: string;
  reference_no: string;
  type: keyof typeof inquiryType;
  status: keyof typeof inquiryStatus;
  full_name: string;
  phone: string;
  email: string | null;
  location: string | null;
  service: string | null;
  budget: string | null;
  preferred_date: string | null;
  preferred_contact: string | null;
  message: string | null;
  attachments: string[];
  assigned_to: string | null;
  internal_notes: string | null;
  consent: boolean;
  created_at: string;
  updated_at: string;
  product: { name: string } | null;
};

export default async function InquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: inq } = await s.db.from("inquiries").select("*, product:products(name)").eq("id", id).maybeSingle<Inquiry>();
  if (!inq) notFound();

  const [{ data: team }, photos] = await Promise.all([
    s.db.from("profiles").select("id, full_name, email").eq("is_active", true).order("full_name"),
    inq.attachments.length
      ? s.db.storage.from(buckets.inquiryUploads).createSignedUrls(inq.attachments, 60 * 60)
      : Promise.resolve({ data: [] as { signedUrl: string; path: string | null }[] }),
  ]);

  const details: [string, string | null | undefined][] = [
    ["Request", inq.service],
    ["Product", inq.product?.name],
    ["Location", inq.location],
    ["Budget", inq.budget],
    [inq.type === "consultation" ? "Preferred date" : "Preferred start", inq.preferred_date],
    ["Best way to reach", inq.preferred_contact],
  ];
  const digits = inq.phone.replace(/\D/g, "");
  const smsPhone = digits.startsWith("0") ? `+63${digits.slice(1)}` : `+${digits}`;

  return (
    <>
      <BackLink href="/admin/inquiries">All inquiries</BackLink>
      <PageHeader
        title={inq.full_name}
        intro={`${inquiryType[inq.type]} · ${inq.reference_no} · received ${dateTime(inq.created_at)}`}
        action={<StatusBadge status={inq.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex flex-wrap gap-2">
              <a href={telHref(inq.phone)} className="btn-navy px-4 py-2">
                <Phone className="size-4" aria-hidden /> Call {inq.phone}
              </a>
              <a href={`sms:${smsPhone}`} className="btn-outline px-4 py-2">
                <MessageCircle className="size-4" aria-hidden /> Text
              </a>
              {inq.email && (
                <a href={`mailto:${inq.email}?subject=${encodeURIComponent(`Your request ${inq.reference_no}`)}`} className="btn-outline px-4 py-2">
                  <Mail className="size-4" aria-hidden /> Email
                </a>
              )}
            </div>
            <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {details
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[13px] text-gray-500">{k}</dt>
                    <dd className="font-medium text-gray-900">{v}</dd>
                  </div>
                ))}
              {inq.email && (
                <div>
                  <dt className="text-[13px] text-gray-500">Email</dt>
                  <dd className="break-all font-medium text-gray-900">{inq.email}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card title="Message">
            <p className="whitespace-pre-wrap leading-relaxed text-gray-800">{inq.message || "No message."}</p>
          </Card>

          {photos.data && photos.data.length > 0 && (
            <Card title={`Photos from the customer (${photos.data.length})`}>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.data.filter((p) => p.signedUrl).map((p, i) => (
                  <li key={p.path ?? i}>
                    <a href={p.signedUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg ring-1 ring-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.signedUrl ?? undefined} alt={`Customer photo ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13px] text-gray-500">Photo links expire after one hour. Reload the page for fresh links.</p>
            </Card>
          )}
        </div>

        <Card title="Follow-up" className="self-start">
          <AdminForm action={updateInquiry}>
            <input type="hidden" name="id" value={inq.id} />
            <SelectField name="status" label="Status" defaultValue={inq.status} options={Object.entries(inquiryStatus).map(([value, v]) => ({ value, label: v.label }))} />
            <SelectField
              name="assigned_to"
              label="Handled by"
              defaultValue={inq.assigned_to ?? ""}
              options={[{ value: "", label: "Nobody yet" }, ...(team ?? []).map((t) => ({ value: t.id, label: t.full_name ?? t.email ?? "Team member" }))]}
            />
            <TextArea name="internal_notes" label="Team notes" rows={6} defaultValue={inq.internal_notes} hint="Only the team sees these notes." />
          </AdminForm>
          <p className="mt-4 text-[13px] text-gray-500">Last updated {dateTime(inq.updated_at)}</p>
        </Card>
      </div>
    </>
  );
}
