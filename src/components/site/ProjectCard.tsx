import { CategoryTag } from "./CategoryTag";
import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/types";

export function ProjectCard({ project, priority }: { project: Project; priority?: boolean }) {
  return (
    <Link href={`/projects/${project.slug}`} className="group flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-mist">
        {project.cover_image && (
          <Image
            src={project.cover_image}
            alt={project.title}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        {project.status !== "completed" && (
          <span className="absolute left-3 top-3 rounded-full bg-gold-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-navy-800">
            {project.status === "ongoing" ? "Ongoing" : "Planning"}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <CategoryTag category={project.category} />
        <span className="font-display text-lg font-semibold text-navy-800 group-hover:underline">{project.title}</span>
        {project.location && <span className="text-sm text-gray-500">{project.location}</span>}
      </div>
    </Link>
  );
}
