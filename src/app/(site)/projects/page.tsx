import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { ProjectGallery } from "@/components/site/ProjectGallery";
import { getProjects } from "@/lib/data";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Projects",
  description: "Completed and ongoing construction and renovation projects by Iloilo Modern Homes in Iloilo.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();
  return (
    <>
      <PageHero
        eyebrow="Project portfolio"
        title="Our completed and ongoing work"
        intro="Kitchens, bathrooms, bedrooms, feature walls, and full builds across Iloilo. Every photo is our own work."
      />
      <div className="container-site py-14">
        <ProjectGallery projects={projects} />
      </div>
    </>
  );
}
