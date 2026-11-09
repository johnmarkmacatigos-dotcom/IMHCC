import { notFound } from "next/navigation";
import { AdminForm, CheckField, ListField, TextArea, TextField } from "@/components/admin/Form";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ImageField } from "@/components/admin/ImageField";
import { BackLink, Card, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import type { Service } from "@/lib/types";
import { deleteService, saveService } from "../actions";

export const metadata = { title: "Service" };

export default async function ServiceEditor({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireAdmin("edit");
  const { id } = await params;
  let x: (Service & { is_published: boolean }) | null = null;
  if (id !== "new") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const { data } = await s.db.from("services").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    x = data;
  }
  return (
    <>
      <BackLink href="/admin/services">All services</BackLink>
      <PageHeader title={x ? x.name : "Add a service"} />
      <Card>
        <AdminForm action={saveService} submitLabel={x ? "Save changes" : "Add service"}>
          {x && <input type="hidden" name="id" value={x.id} />}
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="name" label="Name" defaultValue={x?.name} required />
            <TextField name="category" label="Category" defaultValue={x?.category ?? "Residential"} hint="For example Residential, Commercial, Interiors." />
          </div>
          <TextArea name="summary" label="Short summary" rows={2} defaultValue={x?.summary} />
          <TextArea name="description" label="Full description" rows={6} defaultValue={x?.description} />
          <ListField name="scope" label="What is included" defaultValue={x?.scope} />
          <ImageField name="cover_image" label="Picture" folder="services" defaultValue={x?.cover_image} />
          <div className="grid gap-4 sm:grid-cols-3">
            <CheckField name="is_published" label="Show on website" defaultChecked={x?.is_published ?? true} />
            <CheckField name="is_featured" label="Feature on homepage" defaultChecked={x?.is_featured} />
            <TextField name="sort_order" label="Order" type="number" defaultValue={x?.sort_order ?? 0} />
          </div>
          <TextField name="slug" label="Web address" defaultValue={x?.slug} hint="Leave blank to make one from the name." />
        </AdminForm>
      </Card>
      {x && (
        <div className="flex justify-end">
          <DeleteButton action={deleteService} id={x.id} confirm={`Delete "${x.name}"? This cannot be undone.`} />
        </div>
      )}
    </>
  );
}
