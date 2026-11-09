"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/admin/Form";
import { dbError, fieldErrors, formObject, list, optional, optionalDate, optionalUrl, required, slug, slugify } from "@/lib/admin/forms";
import { refreshSite } from "@/lib/admin/revalidate";
import { logActivity, requireAdmin } from "@/lib/admin/session";

const schema = z.object({
  title: required(160, "Title"),
  slug,
  category: required(60, "Category"),
  status: z.enum(["planning", "ongoing", "completed"]),
  location: optional(160, "Location"),
  summary: optional(400, "Summary"),
  story: optional(6000, "Story"),
  scope: list,
  duration: optional(80, "Duration"),
  completed_on: optionalDate,
  cover_image: optionalUrl,
  sort_order: z.coerce.number().int().min(-1000).max(1000).default(0),
  is_featured: z.boolean(),
  is_published: z.boolean(),
});

export async function saveProject(_: FormState, fd: FormData): Promise<FormState> {
  const s = await requireAdmin("edit");
  const id = String(fd.get("id") ?? "");
  const parsed = schema.safeParse(formObject(fd, { booleans: ["is_featured", "is_published"], lists: ["scope"] }));
  if (!parsed.success) return fieldErrors(parsed.error);
  const values = { ...parsed.data, slug: parsed.data.slug || slugify(parsed.data.title) };

  if (id) {
    const { error } = await s.db.from("projects").update(values).eq("id", id);
    if (error) return dbError(error, "project");
    await logActivity(s, "updated", "project", id, { title: values.title, published: values.is_published });
    refreshSite();
    return { message: values.is_published ? "Saved. The project is on the website." : "Saved as a draft (not on the website yet)." };
  }

  const { data, error } = await s.db.from("projects").insert(values).select("id").single();
  if (error) return dbError(error, "project");
  await logActivity(s, "created", "project", data.id, { title: values.title });
  refreshSite();
  redirect(`/admin/projects/${data.id}?created=1`);
}

export async function deleteProject(fd: FormData) {
  const s = await requireAdmin("edit");
  const id = z.string().uuid().parse(fd.get("id"));
  const { data } = await s.db.from("projects").select("title").eq("id", id).single();
  const { error } = await s.db.from("projects").delete().eq("id", id);
  if (error) throw new Error("Could not delete the project.");
  await logActivity(s, "deleted", "project", id, { title: data?.title });
  refreshSite();
  redirect("/admin/projects");
}

const photoSchema = z.object({
  project_id: z.string().uuid(),
  photos: z
    .array(
      z.object({
        image_url: z.string().url().max(600),
        phase: z.enum(["before", "during", "after"]),
      }),
    )
    .min(1)
    .max(30),
});

/** Called by the photo uploader after pictures are stored. */
export async function addProjectPhotos(input: z.input<typeof photoSchema>): Promise<{ error?: string }> {
  const s = await requireAdmin("edit");
  const parsed = photoSchema.safeParse(input);
  if (!parsed.success) return { error: "Some photos could not be added." };
  const { project_id, photos } = parsed.data;

  const { data: last } = await s.db.from("project_photos").select("sort_order").eq("project_id", project_id).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const start = (last?.sort_order ?? 0) + 1;
  const { error } = await s.db.from("project_photos").insert(photos.map((p, i) => ({ ...p, project_id, sort_order: start + i })));
  if (error) return { error: "Some photos could not be added." };

  // First photos for a project without a cover: use the first "after" photo as the cover.
  const { data: project } = await s.db.from("projects").select("cover_image").eq("id", project_id).single();
  if (!project?.cover_image) {
    const cover = photos.find((p) => p.phase === "after") ?? photos[0];
    await s.db.from("projects").update({ cover_image: cover.image_url }).eq("id", project_id);
  }
  await logActivity(s, `added ${photos.length} photo${photos.length === 1 ? "" : "s"}`, "project", project_id);
  refreshSite();
  return {};
}

const photoUpdate = z.object({
  id: z.string().uuid(),
  caption: z
    .string()
    .trim()
    .max(200)
    .transform((v) => (v === "" ? null : v)),
  phase: z.enum(["before", "during", "after"]),
  sort_order: z.coerce.number().int().min(-1000).max(1000),
});

export async function updateProjectPhoto(input: z.input<typeof photoUpdate>): Promise<{ error?: string }> {
  const s = await requireAdmin("edit");
  const parsed = photoUpdate.safeParse(input);
  if (!parsed.success) return { error: "Check the caption (max 200 characters)." };
  const { id, ...values } = parsed.data;
  const { error } = await s.db.from("project_photos").update(values).eq("id", id);
  if (error) return { error: "Could not save the photo." };
  refreshSite();
  return {};
}

export async function deleteProjectPhoto(id: string): Promise<{ error?: string }> {
  const s = await requireAdmin("edit");
  if (!z.string().uuid().safeParse(id).success) return { error: "Unknown photo." };
  const { data: photo } = await s.db.from("project_photos").select("image_url, project_id").eq("id", id).single();
  const { error } = await s.db.from("project_photos").delete().eq("id", id);
  if (error) return { error: "Could not delete the photo." };
  // Remove the file too when it lives in our media bucket.
  const marker = "/storage/v1/object/public/media/";
  if (photo?.image_url.includes(marker)) {
    await s.db.storage.from("media").remove([decodeURIComponent(photo.image_url.split(marker)[1])]);
  }
  await logActivity(s, "deleted a photo", "project", photo?.project_id);
  refreshSite();
  return {};
}

export async function setProjectCover(projectId: string, imageUrl: string): Promise<{ error?: string }> {
  const s = await requireAdmin("edit");
  const ok = z.object({ projectId: z.string().uuid(), imageUrl: z.string().max(600) }).safeParse({ projectId, imageUrl });
  if (!ok.success) return { error: "Could not set the cover." };
  const { error } = await s.db.from("projects").update({ cover_image: imageUrl }).eq("id", projectId);
  if (error) return { error: "Could not set the cover." };
  refreshSite();
  return {};
}
