import Image from "next/image";
import { HeroPhotos } from "@/components/site/HeroPhotos";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CtaBand } from "@/components/site/CtaBand";
import { ProjectCard } from "@/components/site/ProjectCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ServiceCard } from "@/components/site/ServiceCard";
import { TestimonialList } from "@/components/site/TestimonialList";
import { getProducts, getProjects, getServices, getSettings, getTestimonials } from "@/lib/data";

export const revalidate = 300;

export default async function HomePage() {
  const [settings, services, projects, testimonials, products] = await Promise.all([
    getSettings(),
    getServices(),
    getProjects(),
    getTestimonials(),
    getProducts(),
  ]);
  const featuredServices = services.filter((s) => s.is_featured).slice(0, 4);
  const otherServices = services.filter((s) => !s.is_featured);
  const featuredProjects = projects.filter((p) => p.is_featured).slice(0, 6);
  const heroPhotos = featuredProjects.slice(0, 3);
  const showcase = projects.find((p) => p.photos?.some((ph) => ph.phase === "before") && p.photos?.some((ph) => ph.phase === "after"));
  const beforePhoto = showcase?.photos?.find((ph) => ph.phase === "before");
  const afterPhoto = showcase?.photos?.find((ph) => ph.phase === "after");

  return (
    <>
      {/* Hero */}
      <section className="bg-navy-800 text-white">
        <div className="container-site flex flex-wrap items-center gap-8 py-10 sm:gap-12 sm:py-16 lg:py-20">
          <div className="animate-fade-up flex min-w-0 flex-[1_1_440px] flex-col gap-6">
            <span className="inline-flex items-center gap-2 self-start whitespace-nowrap rounded-full bg-brick-600 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white sm:px-4 sm:tracking-[0.14em] shadow-[0_0_0_4px_rgba(207,68,54,0.25)] sm:text-[13px]">
              Construction <span className="text-gold-300" aria-hidden>·</span> Renovation <span className="text-gold-300" aria-hidden>·</span> Fit-outs
            </span>
            <h1 className="text-4xl leading-[1.08] text-white sm:text-[56px]">{settings.hero_title}</h1>
            <p className="max-w-xl text-lg leading-relaxed text-[#d1d9e3]">{settings.hero_subtitle}</p>
            <div className="flex flex-wrap gap-3.5 pt-2">
              <Link href="/quote" className="btn-gold">
                Request a free quotation
              </Link>
              <Link href="/projects" className="btn-outline-gold">
                Explore our projects
              </Link>
            </div>
          </div>
          <HeroPhotos photos={heroPhotos} />
        </div>
      </section>

      {/* Highlights */}
      <section className="border-b border-gray-200 bg-mist">
        <div className="container-site grid grid-cols-2 gap-5 py-7 lg:grid-cols-4">
          {settings.stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1">
              <span className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">{s.value}</span>
              <span className="text-sm text-gray-600">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="container-site flex flex-col gap-9 pb-10 pt-20">
        <SectionHeading
          eyebrow="What we do"
          title="Complete construction services under one roof"
          action={
            <Link href="/services" className="inline-flex items-center gap-1 font-semibold text-navy-800 hover:underline">
              View all services <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredServices.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
        {otherServices.length > 0 && (
          <div className="rounded-xl border border-gold-500/40 bg-gold-100/60 p-3 sm:p-4">
            <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-navy-800">
              <span aria-hidden className="size-2 rounded-full bg-brick-600 shadow-[0_0_0_3px_rgba(207,68,54,0.25)]" />
              More services
            </p>
            <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 lg:grid-cols-4" aria-label="More services">
              {otherServices.map((s, i) => (
                <li key={s.id}>
                  <Link
                    href={`/services/${s.slug}`}
                    className={cn(
                      "group flex h-full min-h-9 items-center justify-between gap-1 rounded-md border-l-[3px] bg-white px-2 py-1.5 text-[11.5px] font-semibold leading-tight sm:px-2.5 sm:text-[12.5px] text-navy-800 shadow-sm transition-colors hover:bg-navy-800 hover:text-white",
                      ["border-gold-500", "border-navy-800", "border-brick-600"][i % 3],
                    )}
                  >
                    <span>{s.name}</span>
                    <ChevronRight className="hidden size-3 shrink-0 text-gold-700 sm:block group-hover:text-gold-300" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Projects */}
      <section className="container-site flex flex-col gap-8 py-14">
        <SectionHeading
          eyebrow="Our work"
          title="Real projects, completed by our team"
          intro="Every photo here is from an actual job in Iloilo, published with our clients' permission."
          action={
            <Link href="/projects" className="inline-flex items-center gap-1 font-semibold text-navy-800 hover:underline">
              See all projects <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />
        <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProjects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </section>

      {/* Before and after */}
      <section className="bg-mist">
        <div className="container-site flex flex-wrap items-center gap-12 py-20">
          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
            <span className="eyebrow">Before and after</span>
            <h2 className="text-3xl sm:text-4xl">See the transformation, step by step</h2>
            <p className="leading-relaxed text-gray-600">
              Each project page documents the space before work started, progress during construction, and the finished result, so you know exactly
              what to expect from us.
            </p>
            <Link href={showcase ? `/projects/${showcase.slug}` : "/projects"} className="inline-flex items-center gap-1 font-semibold text-navy-800 hover:underline">
              See a full project story <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="grid min-w-0 flex-[1_1_520px] grid-cols-2 gap-3.5">
            <figure className="flex flex-col gap-2">
              <div className="relative flex h-80 items-center justify-center overflow-hidden rounded-xl bg-gray-300 p-4 text-center text-sm text-gray-700">
                {beforePhoto ? (
                  <Image src={beforePhoto.image_url} alt={beforePhoto.caption ?? "Before renovation"} fill sizes="300px" className="object-cover" />
                ) : (
                  "Before photos appear here once the owner uploads them."
                )}
              </div>
              <figcaption className="text-[13px] font-semibold uppercase tracking-[0.08em] text-gray-700">Before</figcaption>
            </figure>
            <figure className="flex flex-col gap-2">
              <div className="relative h-80 overflow-hidden rounded-xl">
                <Image
                  src={afterPhoto?.image_url ?? "/images/projects/kitchen-teal-cove.jpg"}
                  alt={afterPhoto?.caption ?? "Finished kitchen with wood ceiling and cove lighting"}
                  fill
                  sizes="300px"
                  className="object-cover"
                />
              </div>
              <figcaption className="text-[13px] font-semibold uppercase tracking-[0.08em] text-navy-800">After</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container-site flex flex-col gap-8 py-20">
        <SectionHeading eyebrow="Satisfied customers" title="What our clients say" />
        <TestimonialList testimonials={testimonials.slice(0, 3)} />
      </section>

      {/* Hardware teaser */}
      {products.length > 0 && (
        <section className="border-t border-gray-200">
          <div className="container-site flex flex-col gap-8 py-16">
            <SectionHeading
              eyebrow="Hardware and materials"
              title="Quality materials, ready for your project"
              intro="Wall panels, ceiling materials, and finishing supplies, with delivery around Iloilo."
              action={
                <Link href="/hardware" className="inline-flex items-center gap-1 font-semibold text-navy-800 hover:underline">
                  Browse the catalog <ArrowRight className="size-4" aria-hidden />
                </Link>
              }
            />
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {products.slice(0, 4).map((pr) => (
                <Link key={pr.id} href={`/hardware#${pr.slug}`} className="group flex flex-col gap-2.5">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-mist">
                    {pr.image_url && <Image src={pr.image_url} alt="" fill sizes="(min-width: 1024px) 280px, 50vw" className="object-cover" />}
                  </div>
                  <span className="font-display font-semibold text-navy-800 group-hover:underline">{pr.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBand tagline={settings.tagline} phone={settings.phone_primary} />
    </>
  );
}
