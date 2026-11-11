import Link from "next/link";
import { CreatedPanel } from "@/components/states/CreatedPanel";
import { notFound } from "next/navigation";
import { AdminForm, CheckField, ListField, SelectField, TextArea, TextField } from "@/components/admin/Form";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ImageField } from "@/components/admin/ImageField";
import { PhotoManager } from "@/components/admin/PhotoManager";
import { BackLink, Card, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import { deleteProject, saveProject } from "../actions";

export const metadata = { title: "Project" };

type Project = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: "planning" | "ongoing" | "completed";
  location: string | null;
  summary: string | null;
  story: string | null;
  scope: string[];
  duration: string | null;
  completed_on: string | null;
  cover_image: string | null;
  sort_order: number;
  is_featured: boolean;
  is_published: boolean;
  photos: { id: string; image_url: string; caption: string | null; phase: "before" | "during" | "after"; sort_order: number }[];
};

const categories = ["Kitchen", "Bathroom", "Bedroom", "Interior", "Condo fit-out", "Construction", "Renovation", "Ceiling", "Feature wall", "Wall panels", "Finishing", "Technical", "Commercial"];

export default async function ProjectEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const s = await requireAdmin("edit");
  const { id } = await params;
  const { created } = await searchParams;
  const isNew = id === "new";
  let p: Project | null = null;
  if (!isNew) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const { data } = await s.db
      .from("projects")
      .select("*, photos:project_photos(id, image_url, caption, phase, sort_order)")
      .eq("id", id)
      .order("sort_order", { referencedTable: "project_photos" })
      .maybeSingle<Project>();
    if (!data) notFound();
    p = data;
  }

  return (
    <>
      <BackLink href="/admin/projects">All projects</BackLink>
      <PageHeader
        title={p ? p.title : "Add a project"}
        intro={p ? undefined : "Fill in the details first. You can add photos right after saving."}
        action={
          p?.is_published ? (
            <Link href={`/projects/${p.slug}`} target="_blank" className="btn-outline px-4 py-2">
              View on website
            </Link>
          ) : undefined
        }
      />
      {created && p && <CreatedPanel published={p.is_published} />}

      {p && (
        <Card title="Photos">
          <PhotoManager projectId={p.id} photos={p.photos} cover={p.cover_image} />
        </Card>
      )}

      <Card title="Details">
        <AdminForm action={saveProject} submitLabel={isNew ? "Create project" : "Save changes"}>
          {p && <input type="hidden" name="id" value={p.id} />}
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="title" label="Title" defaultValue={p?.title} placeholder="Modern kitchen with island" required className="sm:col-span-2" />
            <label className="field-label">
              Category
              <input name="category" list="project-categories" defaultValue={p?.category ?? ""} className="field-input" required />
              <datalist id="project-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <SelectField
              name="status"
              label="Status"
              defaultValue={p?.status ?? "completed"}
              options={[
                { value: "completed", label: "Completed" },
                { value: "ongoing", label: "Ongoing" },
                { value: "planning", label: "Planning" },
              ]}
            />
            <TextField name="location" label="Location" defaultValue={p?.location} placeholder="Jaro, Iloilo City" />
            <TextField name="duration" label="Duration" defaultValue={p?.duration} placeholder="6 weeks" />
            <TextField name="completed_on" label="Completed on" type="date" defaultValue={p?.completed_on} />
            <TextField name="slug" label="Web address" defaultValue={p?.slug} hint="Leave blank to make one from the title." />
          </div>
          <TextArea name="summary" label="Short summary" rows={2} defaultValue={p?.summary} hint="One or two sentences for project cards." />
          <TextArea name="story" label="Project story" rows={6} defaultValue={p?.story} hint="What the client wanted, what we did, and the result." />
          <ListField name="scope" label="Scope of work" defaultValue={p?.scope} />
          <ImageField name="cover_image" label="Cover picture" folder="projects/covers" defaultValue={p?.cover_image} hint="Shown on project cards. Tip: use the best 'after' photo." />
          <div className="grid gap-4 sm:grid-cols-3">
            <CheckField name="is_published" label="Show on website" defaultChecked={p?.is_published ?? false} />
            <CheckField name="is_featured" label="Feature on homepage" defaultChecked={p?.is_featured ?? false} />
            <TextField name="sort_order" label="Order" type="number" defaultValue={p?.sort_order ?? 0} hint="Lower numbers show first." />
          </div>
        </AdminForm>
      </Card>

      {p && (
        <div className="flex justify-end">
          <DeleteButton action={deleteProject} id={p.id} label="Delete project" confirm={`Delete "${p.title}" and all its photos? This cannot be undone.`} />
        </div>
      )}
    </>
  );
}
