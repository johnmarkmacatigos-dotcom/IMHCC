import { notFound } from "next/navigation";
import { AdminForm, CheckField, TextArea, TextField } from "@/components/admin/Form";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ImageField } from "@/components/admin/ImageField";
import { BackLink, Card, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import type { Promotion } from "@/lib/types";
import { deletePromotion, savePromotion } from "../actions";

export const metadata = { title: "Promotion" };

export default async function PromotionEditor({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireAdmin("edit");
  const { id } = await params;
  let x: (Promotion & { is_published: boolean }) | null = null;
  if (id !== "new") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const { data } = await s.db.from("promotions").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    x = data;
  }
  return (
    <>
      <BackLink href="/admin/promotions">All promotions</BackLink>
      <PageHeader title={x ? x.title : "Add a promotion"} />
      <Card>
        <AdminForm action={savePromotion} submitLabel={x ? "Save changes" : "Add promotion"}>
          {x && <input type="hidden" name="id" value={x.id} />}
          <TextField name="title" label="Title" defaultValue={x?.title} placeholder="10% off modular kitchens this December" required />
          <TextArea name="description" label="Details" defaultValue={x?.description} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="starts_on" label="Starts" type="date" defaultValue={x?.starts_on} />
            <TextField name="ends_on" label="Ends" type="date" defaultValue={x?.ends_on} />
            <TextField name="cta_label" label="Button text" defaultValue={x?.cta_label} placeholder="Get a quote" />
            <TextField name="cta_url" label="Button link" defaultValue={x?.cta_url} placeholder="/quote" />
          </div>
          <TextArea name="terms" label="Terms and conditions" defaultValue={x?.terms} />
          <ImageField name="banner_image" label="Banner picture" folder="promotions" defaultValue={x?.banner_image} />
          <CheckField name="is_published" label="Show on website" defaultChecked={x?.is_published} />
        </AdminForm>
      </Card>
      {x && (
        <div className="flex justify-end">
          <DeleteButton action={deletePromotion} id={x.id} confirm={`Delete "${x.title}"?`} />
        </div>
      )}
    </>
  );
}
