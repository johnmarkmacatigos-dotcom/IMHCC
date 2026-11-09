import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: string; children?: ReactNode }) {
  return (
    <section className="bg-navy-800 text-white">
      <div className="container-site flex flex-col gap-4 py-14 sm:py-20">
        <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-gold-300">{eyebrow}</span>
        <h1 className="max-w-3xl text-4xl leading-tight text-white sm:text-5xl">{title}</h1>
        {intro && <p className="max-w-2xl text-lg leading-relaxed text-[#d1d9e3]">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
