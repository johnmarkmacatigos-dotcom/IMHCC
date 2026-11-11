"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Camera, FolderSearch, Search, X } from "lucide-react";
import { StatePanel } from "@/components/states/StatePanel";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { categoryTone } from "./CategoryTag";
import { ProjectCard } from "./ProjectCard";

const dot = { gold: "bg-gold-500", navy: "bg-navy-800", brick: "bg-brick-600" } as const;

export function ProjectGallery({ projects }: { projects: Project[] }) {
  const categories = useMemo(() => ["All", ...new Set(projects.map((p) => p.category))], [projects]);
  const [active, setActive] = useState("All");
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const inCategory = active === "All" ? projects : projects.filter((p) => p.category === active);
  const shown = term ? inCategory.filter((p) => [p.title, p.category, p.location, p.summary, ...(p.scope ?? [])].some((v) => v?.toLowerCase().includes(term))) : inCategory;
  const matchesElsewhere = term && active !== "All" ? projects.filter((p) => [p.title, p.category, p.location, p.summary].some((v) => v?.toLowerCase().includes(term))).length : 0;

  if (projects.length === 0) {
    return (
      <StatePanel
        tone="empty"
        icon={Camera}
        eyebrow="Portfolio coming soon"
        title="We're adding photos of our latest work"
        actions={
          <>
            <Link href="/quote" className="btn-gold">
              Request a free quotation
            </Link>
            <Link href="/services" className="btn-outline">
              See what we build
            </Link>
          </>
        }
      >
        Our team is uploading before, during, and after photos of finished kitchens, bathrooms, and homes. Check back soon, or ask us for photos of a job like yours.
      </StatePanel>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter projects by type" className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={active === c}
              onClick={() => setActive(c)}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full px-4.5 py-2 text-sm font-medium transition-colors",
                active === c ? "bg-navy-800 text-white" : "border border-[#cbd2dc] bg-white text-navy-800 hover:bg-navy-100",
              )}
            >
              {c !== "All" && <span aria-hidden className={cn("size-2.5 rounded-full ring-1 ring-white/60", dot[categoryTone(c)])} />}
              {c}
            </button>
          ))}
        </div>
        <label className="flex min-h-11 w-full items-center gap-2.5 rounded-full border border-[#cbd2dc] bg-white px-4 focus-within:border-navy-800 focus-within:ring-2 focus-within:ring-navy-800/20 lg:max-w-xs">
          <Search className="size-4 shrink-0 text-gray-500" aria-hidden />
          <span className="sr-only">Search projects</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search kitchen, Jaro, cabinets…"
            className="w-full bg-transparent py-2 text-sm outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="-mr-2 flex size-8 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
              <X className="size-4" aria-hidden />
            </button>
          )}
        </label>
      </div>
      <p className="sr-only" aria-live="polite">
        Showing {shown.length} projects
      </p>
      {shown.length === 0 ? (
        <StatePanel
          tone="search"
          icon={FolderSearch}
          title={term ? `No projects match “${q.trim()}”${active !== "All" ? ` in ${active}` : ""}` : `No ${active} projects yet`}
          role="status"
          tips={[
            matchesElsewhere > 0 ? `${matchesElsewhere} other project${matchesElsewhere === 1 ? "" : "s"} match in other categories.` : "Try a shorter word, a room (kitchen, bathroom), or a town.",
            "Not shown yet doesn't mean we haven't done it. Ask us for photos of similar jobs.",
          ]}
          actions={
            <>
              {matchesElsewhere > 0 ? (
                <button type="button" onClick={() => setActive("All")} className="btn-navy">
                  Search all categories
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setActive("All");
                  }}
                  className="btn-navy"
                >
                  Show all projects
                </button>
              )}
              <Link href="/quote" className="btn-gold">
                Ask about a project like this
              </Link>
            </>
          }
        />
      ) : (
        <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p, i) => (
            <ProjectCard key={p.id} project={p} priority={i < 3} />
          ))}
        </div>
      )}
    </div>
  );
}
