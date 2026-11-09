import { notFound } from "next/navigation";
import { AdminForm, CheckField, SelectField, TextArea, TextField } from "@/components/admin/Form";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ImageField } from "@/components/admin/ImageField";
import { BackLink, Card, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import { deleteTestimonial, saveTestimonial } from "../actions";

export const metadata = { title: "Testimonial" };

type T = {
  id: string;
  customer_name: string;
  customer_town: string | null;
  service_label: string | null;
  quote: string;
  rating: number | null;
  photo_url: string | null;
  project_id: string | null;
  consent_given: boolean;
  consent_date: string | null;
  status: "pending" | "approved" | "hidden";
  is_featured: boolean;
};

export default async function TestimonialEditor({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireAdmin("edit");
  const { id } = await params;
  let t: T | null = null;
  if (id !== "new") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const { data } = await s.db.from("testimonials").select("*").eq("id", id).maybeSingle<T>();
    if (!data) notFound();
    t = data;
  }
  const { data: projects } = await s.db.from("projects").select("id, title").order("title");

  return (
    <>
      <BackLink href="/admin/testimonials">All testimonials</BackLink>
      <PageHeader title={t ? t.customer_name : "Add a testimonial"} />
      <Card>
        <AdminForm action={saveTestimonial} submitLabel={t ? "Save changes" : "Add testimonial"}>
          {t && <input type="hidden" name="id" value={t.id} />}
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="customer_name" label="Customer name" defaultValue={t?.customer_name} hint="First name and last initial is fine, for example Maria S." required />
            <TextField name="customer_town" label="Town" defaultValue={t?.customer_town} placeholder="Santa Barbara" />
            <TextField name="service_label" label="Service" defaultValue={t?.service_label} placeholder="Kitchen renovation" />
            <SelectField
              name="rating"
              label="Rating"
              defaultValue={t?.rating ? String(t.rating) : ""}
              options={[{ value: "", label: "No rating" }, ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} star${n === 1 ? "" : "s"}` }))]}
            />
          </div>
          <TextArea name="quote" label="What the customer said" rows={5} defaultValue={t?.quote} />
          <SelectField
            name="project_id"
            label="Related project (optional)"
            defaultValue={t?.project_id ?? ""}
            options={[{ value: "", label: "None" }, ...(projects ?? []).map((p) => ({ value: p.id, label: p.title }))]}
          />
          <ImageField name="photo_url" label="Customer photo (optional)" folder="testimonials" defaultValue={t?.photo_url} />
          <div className="flex flex-col gap-4 rounded-lg bg-mist p-4">
            <CheckField name="consent_given" label="The customer agreed to have this shared on the website" defaultChecked={t?.consent_given} hint="Required before it can be shown." />
            <TextField name="consent_date" label="Date they agreed" type="date" defaultValue={t?.consent_date} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              name="status"
              label="Show on website?"
              defaultValue={t?.status ?? "pending"}
              options={[
                { value: "pending", label: "Not yet (to review)" },
                { value: "approved", label: "Yes, show it" },
                { value: "hidden", label: "No, keep it hidden" },
              ]}
            />
            <CheckField name="is_featured" label="Feature on homepage" defaultChecked={t?.is_featured} />
          </div>
        </AdminForm>
      </Card>
      {t && (
        <div className="flex justify-end">
          <DeleteButton action={deleteTestimonial} id={t.id} confirm="Delete this testimonial? This cannot be undone." />
        </div>
      )}
    </>
  );
}
