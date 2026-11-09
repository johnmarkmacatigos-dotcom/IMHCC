"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ProjectPhoto } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Photo grid with an accessible full-screen viewer (keyboard arrows and Escape). */
export function PhotoGallery({ photos, title, compact }: { photos: ProjectPhoto[]; title: string; compact?: boolean }) {
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open = (i: number) => {
    setIndex(i);
    dialogRef.current?.showModal();
  };
  const close = useCallback(() => {
    dialogRef.current?.close();
    setIndex(null);
  }, []);
  const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, step]);

  if (photos.length === 0) return null;
  const current = index !== null ? photos[index] : null;

  return (
    <>
      <div className={cn("grid gap-3.5", compact ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3")}>
        {photos.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => open(i)}
            className={cn(
              "relative overflow-hidden rounded-xl bg-mist",
              compact ? "aspect-square" : i === 0 ? "aspect-[4/5] sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:min-h-[520px]" : "aspect-[4/5]",
            )}
            aria-label={`Open photo ${i + 1} of ${photos.length}${p.caption ? `: ${p.caption}` : ""}`}
          >
            <Image
              src={p.image_url}
              alt={p.caption ?? `${title}, photo ${i + 1}`}
              fill
              priority={!compact && i === 0}
              sizes={compact ? "300px" : i === 0 ? "(min-width: 1024px) 800px, 100vw" : "(min-width: 1024px) 400px, 50vw"}
              className="object-cover transition-transform duration-500 hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>
      <dialog
        ref={dialogRef}
        onClose={() => setIndex(null)}
        aria-label={`${title} photos`}
        className="m-0 h-full max-h-none w-full max-w-none bg-black/95 p-0 backdrop:bg-black/80"
      >
        {current && (
          <div className="relative flex h-full w-full items-center justify-center p-4 sm:p-12">
            <div className="relative h-full w-full">
              <Image src={current.image_url} alt={current.caption ?? title} fill sizes="100vw" className="object-contain" />
            </div>
            {current.caption && <p className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded bg-black/60 px-4 py-2 text-sm text-white">{current.caption}</p>}
            <button type="button" onClick={close} aria-label="Close" className="absolute right-4 top-4 flex size-12 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
              <X className="size-6" aria-hidden />
            </button>
            {photos.length > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="absolute left-4 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
                  <ChevronLeft className="size-6" aria-hidden />
                </button>
                <button type="button" onClick={() => step(1)} aria-label="Next photo" className="absolute right-4 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25">
                  <ChevronRight className="size-6" aria-hidden />
                </button>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
