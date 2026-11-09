"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Photo = { id: string; title: string; cover_image: string | null };

/**
 * Homepage hero photos. Tablets and computers: a fixed three-photo collage.
 * Phones: one short row the visitor swipes through (no auto-play), with dots.
 */
export function HeroPhotos({ photos }: { photos: Photo[] }) {
  const strip = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const items = photos.filter((p) => p.cover_image);

  function onScroll() {
    const el = strip.current;
    if (!el || !el.firstElementChild) return;
    const step = (el.firstElementChild as HTMLElement).offsetWidth + 12;
    setActive(Math.min(items.length - 1, Math.round(el.scrollLeft / step)));
  }

  function goTo(i: number) {
    const el = strip.current;
    const child = el?.children[i] as HTMLElement | undefined;
    if (el && child) el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: "smooth" });
  }

  return (
    <div className="min-w-0 flex-[1_1_440px]">
      <div
        ref={strip}
        onScroll={onScroll}
        aria-label="Recent projects"
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-3.5 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              "relative h-56 w-[82%] shrink-0 snap-start overflow-hidden rounded-lg sm:w-auto",
              i === 0 ? "sm:row-span-2 sm:h-[420px]" : "sm:h-[203px]",
            )}
          >
            <Image src={p.cover_image!} alt={p.title} fill priority={i === 0} sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 82vw" className="object-cover" />
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex justify-center gap-1 sm:hidden">
          {items.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1} of ${items.length}`}
              aria-current={active === i ? "true" : undefined}
              className="flex size-6 items-center justify-center"
            >
              <span className={cn("block h-2 rounded-full transition-all", active === i ? "w-5 bg-gold-500" : "w-2 bg-white/40")} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
