import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Testimonial } from "@/lib/types";

export function TestimonialList({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-gray-300 p-8">
        <p className="text-gray-600">Customer stories are coming soon. In the meantime, see our completed work for yourself.</p>
        <Link href="/projects" className="btn-outline">
          View our projects
        </Link>
      </div>
    );
  }
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {testimonials.map((t) => (
        <figure key={t.id} className="flex flex-col gap-5 rounded-xl border border-gray-200 p-7">
          {t.rating && (
            <div className="flex gap-0.5 text-gold-500" role="img" aria-label={`${t.rating} out of 5 stars`}>
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="size-4 fill-current" aria-hidden />
              ))}
            </div>
          )}
          <blockquote className="flex-1 leading-relaxed text-ink">“{t.quote}”</blockquote>
          <figcaption className="flex items-center gap-3">
            {t.photo_url && <Image src={t.photo_url} alt="" width={52} height={52} className="size-13 rounded-lg object-cover" />}
            <span className="flex flex-col">
              <strong className="text-[15px] text-navy-800">{t.customer_name}</strong>
              <span className="text-[13px] text-gray-500">{[t.service_label, t.customer_town].filter(Boolean).join(" · ")}</span>
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
