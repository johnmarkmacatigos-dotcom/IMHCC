import "server-only";
import { cache } from "react";
import {
  fallbackProducts,
  fallbackProjects,
  fallbackPromotions,
  fallbackServices,
  fallbackSettings,
  fallbackTestimonials,
} from "@/content/fallback";
import { getPublicClient } from "@/lib/supabase/public";
import type { Product, Project, Promotion, Service, SiteSettings, Testimonial } from "@/lib/types";

/**
 * Read helpers for the public website. Each one reads published rows from Supabase
 * (RLS hides drafts) and falls back to the starter content when the database
 * is not connected, so the site always renders.
 */

async function query<T>(run: (db: NonNullable<ReturnType<typeof getPublicClient>>) => PromiseLike<{ data: T | null; error: unknown }>, fallback: T): Promise<T> {
  const db = getPublicClient();
  if (!db) return fallback;
  const { data, error } = await run(db);
  if (error) {
    console.error("[data] Supabase query failed", error);
    return fallback;
  }
  return data ?? fallback;
}

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const row = await query<SiteSettings | null>((db) => db.from("site_settings").select("*").eq("id", 1).maybeSingle(), null);
  return row ? { ...fallbackSettings, ...stripNulls(row) } : fallbackSettings;
});

export const getServices = cache(async (): Promise<Service[]> =>
  query<Service[]>((db) => db.from("services").select("*").order("sort_order"), fallbackServices),
);

export async function getService(slug: string): Promise<Service | null> {
  const all = await getServices();
  return all.find((s) => s.slug === slug) ?? null;
}

export const getProjects = cache(async (): Promise<Project[]> =>
  query<Project[]>(
    (db) =>
      db
        .from("projects")
        .select("*, photos:project_photos(id, image_url, caption, phase, sort_order)")
        .order("is_featured", { ascending: false })
        .order("sort_order")
        .order("completed_on", { ascending: false, nullsFirst: false }),
    fallbackProjects,
  ),
);

export async function getProject(slug: string): Promise<Project | null> {
  const all = await getProjects();
  const project = all.find((p) => p.slug === slug);
  if (!project) return null;
  return { ...project, photos: [...(project.photos ?? [])].sort((a, b) => a.sort_order - b.sort_order) };
}

export const getTestimonials = cache(async (): Promise<Testimonial[]> =>
  query<Testimonial[]>(
    (db) => db.from("testimonials").select("id, customer_name, customer_town, service_label, quote, rating, photo_url, project_id").order("is_featured", { ascending: false }).order("created_at", { ascending: false }),
    fallbackTestimonials,
  ),
);

export const getProducts = cache(async (): Promise<Product[]> =>
  query<Product[]>((db) => db.from("products").select("*").order("is_featured", { ascending: false }).order("name"), fallbackProducts),
);

export const getPromotions = cache(async (): Promise<Promotion[]> =>
  query<Promotion[]>((db) => db.from("promotions").select("*").order("starts_on", { ascending: false, nullsFirst: false }), fallbackPromotions),
);

function stripNulls<T extends object>(row: T): Partial<T> {
  return Object.fromEntries(Object.entries(row).filter(([, v]) => v !== null && v !== "")) as Partial<T>;
}
