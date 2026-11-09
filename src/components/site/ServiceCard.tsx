import Image from "next/image";
import Link from "next/link";
import type { Service } from "@/lib/types";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link href={`/services/${service.slug}`} className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-lg">
      <div className="relative h-52 bg-mist">
        {service.cover_image && (
          <Image src={service.cover_image} alt="" fill sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        )}
      </div>
      <div className="flex flex-col gap-2 p-5">
        <h3 className="text-xl group-hover:underline">{service.name}</h3>
        {service.summary && <p className="text-[15px] leading-relaxed text-gray-600">{service.summary}</p>}
      </div>
    </Link>
  );
}
