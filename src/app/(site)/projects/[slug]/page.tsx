import { CategoryTag } from "@/components/site/CategoryTag";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhotoGallery } from "@/components/site/PhotoGallery";
import { ProjectCard } from "@/components/site/ProjectCard";
import { getProject, getProjects, getTestimonials } from "@/lib/data";
import type { PhotoPhase } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProject((await params).slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary ?? undefined,
    openGraph: project.cover_image ? { images: [project.cover_image] } : undefined,
  };
}

const phaseLabels: Record<PhotoPhase, { title: string; note: string }> = {
  before: { title: "Before", note: "The space before work started" },
  during: { title: "During", note: "Construction in progress" },
  after: { title: "After", note: "Completed and handed over" },
};

export default async function ProjectPage({ params }: Props) {
  const project = await getProject((await params).slug);
  if (!project) notFound();
  const [all, testimonials] = await Promise.all([getProjects(), getTestimonials()]);
  const photos = project.photos ?? [];
  const phases = (["before", "during", "after"] as PhotoPhase[]).filter((ph) => photos.some((x) => x.phase === ph));
  const hasProgress = phases.length > 1;
  const more = all.filter((p) => p.id !== project.id && p.category === project.category).concat(all.filter((p) => p.id !== project.id && p.category !== project.category)).slice(0, 3);
  const testimonial = testimonials.find((t) => t.project_id === project.id);

  const facts = [
    { label: "Location", value: project.location },
    { label: "Project type", value: project.category },
    { label: "Status", value: project.status === "completed" ? "Completed" : project.status === "ongoing" ? "Ongoing" : "Planning" },
    { label: "Duration", value: project.duration },
    { label: "Completed", value: project.completed_on ? formatDate(project.completed_on) : null },
  ].filter((f) => f.value);

  return (
    <>
      <section className="container-site flex flex-col gap-4 pb-6 pt-10">
        <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-navy-800">
            Home
          </Link>
          <span aria-hidden>/</span>
          <Link href="/projects" className="hover:text-navy-800">
            Projects
          </Link>
          <span aria-hidden>/</span>
          <span className="text-navy-800">{project.title}</span>
        </nav>
        <div className="flex flex-wrap gap-2.5">
          <span className="rounded-full border-[1.5px] border-navy-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-navy-800">{project.status}</span>
          <CategoryTag category={project.category} />
        </div>
        <h1 className="text-4xl leading-tight sm:text-5xl">{project.title}</h1>
        {project.summary && <p className="max-w-3xl text-lg text-gray-600">{project.summary}</p>}
      </section>

      <section className="container-site">
        <PhotoGallery photos={photos.filter((p) => p.phase === "after").length ? photos.filter((p) => p.phase === "after") : photos} title={project.title} />
      </section>

      <section className="container-site flex flex-wrap gap-12 py-14">
        <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-5">
          <h2 className="text-2xl sm:text-3xl">About this project</h2>
          {project.story ? (
            <div className="text-lg leading-relaxed whitespace-pre-line text-gray-700">{project.story}</div>
          ) : (
            <p className="text-lg leading-relaxed text-gray-700">{project.summary}</p>
          )}
          {project.scope.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-lg">Scope of work</h3>
              <ul className="flex flex-wrap gap-2">
                {project.scope.map((s) => (
                  <li key={s} className="rounded-full bg-mist px-3.5 py-1.5 text-sm text-navy-800">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <aside aria-label="Project details" className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 self-start rounded-xl bg-mist p-7">
          {facts.map((f) => (
            <div key={f.label} className="flex justify-between gap-3 text-[15px]">
              <span className="text-gray-600">{f.label}</span>
              <strong className="text-right text-navy-800">{f.value}</strong>
            </div>
          ))}
          <Link href={`/quote?project=${encodeURIComponent(project.title)}`} className="btn-gold mt-2">
            Get a quote for a similar project
          </Link>
        </aside>
      </section>

      {hasProgress && (
        <section className="bg-mist">
          <div className="container-site flex flex-col gap-8 py-16">
            <div className="flex flex-col gap-2.5">
              <span className="eyebrow">Construction progress</span>
              <h2 className="text-3xl">Before, during, and after</h2>
            </div>
            {phases.map((ph) => (
              <div key={ph} className="flex flex-col gap-4">
                <div className="flex flex-col">
                  <h3 className="text-xl">{phaseLabels[ph].title}</h3>
                  <span className="text-sm text-gray-600">{phaseLabels[ph].note}</span>
                </div>
                <PhotoGallery photos={photos.filter((x) => x.phase === ph)} title={`${project.title}, ${ph}`} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      {testimonial && (
        <section className="container-site py-16">
          <figure className="flex flex-col gap-5 rounded-2xl bg-navy-800 p-8 text-white sm:p-12">
            <blockquote className="font-display text-2xl leading-snug font-medium">“{testimonial.quote}”</blockquote>
            <figcaption className="flex flex-wrap gap-x-4 text-[15px]">
              <strong className="text-gold-300">{testimonial.customer_name}</strong>
              {testimonial.customer_town && <span className="text-[#d1d9e3]">{testimonial.customer_town}</span>}
            </figcaption>
          </figure>
        </section>
      )}

      {more.length > 0 && (
        <section className="container-site flex flex-col gap-6 py-16">
          <h2 className="text-2xl sm:text-3xl">More projects</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
