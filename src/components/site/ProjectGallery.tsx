"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProjectCard } from "./ProjectCard";

export function ProjectGallery({ projects }: { projects: Project[] }) {
  const categories = useMemo(() => ["All", ...new Set(projects.map((p) => p.category))], [projects]);
  const [active, setActive] = useState("All");
  const shown = active === "All" ? projects : projects.filter((p) => p.category === active);

  return (
    <div className="flex flex-col gap-8">
      <div role="group" aria-label="Filter projects by type" className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={active === c}
            onClick={() => setActive(c)}
            className={cn(
              "min-h-11 rounded-full px-4.5 py-2 text-sm font-medium transition-colors",
              active === c ? "bg-navy-800 text-white" : "border border-[#cbd2dc] bg-white text-navy-800 hover:bg-navy-100",
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        Showing {shown.length} projects
      </p>
      <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p, i) => (
          <ProjectCard key={p.id} project={p} priority={i < 3} />
        ))}
      </div>
    </div>
  );
}
