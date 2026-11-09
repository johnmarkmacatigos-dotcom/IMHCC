import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { ProjectCard } from "@/components/site/ProjectCard";
import { getProjects, getService, getServices } from "@/lib/data";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getServices()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = await getService((await params).slug);
  return service ? { title: service.name, description: service.summary ?? undefined } : {};
}

export default async function ServicePage({ params }: Props) {
  const service = await getService((await params).slug);
  if (!service) notFound();
  const related = (await getProjects()).filter((p) => service.scope.some((s) => p.scope.includes(s)) || p.category.toLowerCase().includes(service.name.split(" ")[0].toLowerCase())).slice(0, 3);

  return (
    <>
      <section className="bg-navy-800 text-white">
        <div className="container-site flex flex-wrap items-center gap-10 py-14">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
            <nav aria-label="Breadcrumb" className="text-sm text-[#d1d9e3]">
              <Link href="/services" className="hover:text-white">
                Services
              </Link>{" "}
              / <span className="text-white">{service.name}</span>
            </nav>
            <h1 className="text-4xl text-white sm:text-5xl">{service.name}</h1>
            {service.summary && <p className="text-lg text-[#d1d9e3]">{service.summary}</p>}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={`/quote?service=${encodeURIComponent(service.name)}`} className="btn-gold">
                Get a quote for this service
              </Link>
            </div>
          </div>
          {service.cover_image && (
            <div className="relative h-80 min-w-0 flex-[1_1_380px] overflow-hidden rounded-xl">
              <Image src={service.cover_image} alt={service.name} fill priority sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
            </div>
          )}
        </div>
      </section>
      <section className="container-site flex flex-wrap gap-12 py-16">
        <div className="min-w-0 flex-[999_1_480px] text-lg leading-relaxed whitespace-pre-line text-gray-700">{service.description}</div>
        {service.scope.length > 0 && (
          <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 self-start rounded-xl bg-mist p-7">
            <h2 className="text-xl">What&apos;s included</h2>
            <ul className="flex flex-col gap-3">
              {service.scope.map((item) => (
                <li key={item} className="flex gap-2.5 text-[15px]">
                  <Check className="mt-0.5 size-5 shrink-0 text-gold-700" aria-hidden /> {item}
                </li>
              ))}
            </ul>
          </aside>
        )}
      </section>
      {related.length > 0 && (
        <section className="container-site flex flex-col gap-6 pb-20">
          <h2 className="text-2xl sm:text-3xl">Related projects</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
