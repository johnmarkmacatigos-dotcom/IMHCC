import { AdminForm, ListField, TextArea, TextField } from "@/components/admin/Form";
import { OFFICE_LOCATION } from "@/content/office";
import { Card, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import type { SiteSettings } from "@/lib/types";
import { saveSettings } from "./actions";

export const metadata = { title: "Website settings" };

export default async function SettingsPage() {
  const s = await requireAdmin("manage");
  const { data: x } = await s.db.from("site_settings").select("*").eq("id", 1).maybeSingle<SiteSettings>();
  return (
    <>
      <PageHeader title="Website settings" intro="Contact details, homepage text, and the shop's map pin." />
      <AdminForm action={saveSettings} submitLabel="Save settings">
        <Card title="Contact details">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="company_name" label="Business name" defaultValue={x?.company_name} required />
            <TextField name="phone_primary" label="Main phone" type="tel" defaultValue={x?.phone_primary} />
            <TextField name="phone_secondary" label="Second phone" type="tel" defaultValue={x?.phone_secondary} />
            <TextField name="email" label="Email" type="email" defaultValue={x?.email} />
            <TextField name="address" label="Address" defaultValue={x?.address} className="sm:col-span-2" />
            <TextField name="business_hours" label="Business hours" defaultValue={x?.business_hours} className="sm:col-span-2" />
            <TextField name="facebook_url" label="Facebook Page link" defaultValue={x?.facebook_url} />
            <TextField name="messenger_url" label="Messenger link" defaultValue={x?.messenger_url} hint="Usually https://m.me/your-page-name" />
          </div>
        </Card>
        <Card title="Office map pin">
          <p className="text-sm text-gray-600">
            The contact page map always gives directions to the office at {OFFICE_LOCATION.plusCode} ({OFFICE_LOCATION.lat},{" "}
            {OFFICE_LOCATION.lng}). It is set in the website code, so ask your developer if the office moves.
          </p>
        </Card>
        <Card title="Homepage">
          <div className="flex flex-col gap-5">
            <TextField name="hero_title" label="Headline" defaultValue={x?.hero_title} />
            <TextArea name="hero_subtitle" label="Text under the headline" rows={3} defaultValue={x?.hero_subtitle} />
            <TextField name="tagline" label="Tagline" defaultValue={x?.tagline} />
            <ListField
              name="stats"
              label="Number highlights"
              defaultValue={(x?.stats ?? []).map((st) => `${st.value} | ${st.label}`)}
              hint="One per line, as number | label. For example: 150+ | Projects completed"
            />
          </div>
        </Card>
        <Card title="About page">
          <div className="flex flex-col gap-5">
            <TextArea name="about_intro" label="About the business" rows={5} defaultValue={x?.about_intro} />
            <TextArea name="mission" label="Mission" rows={3} defaultValue={x?.mission} />
            <TextArea name="vision" label="Vision" rows={3} defaultValue={x?.vision} />
          </div>
        </Card>
      </AdminForm>
    </>
  );
}
