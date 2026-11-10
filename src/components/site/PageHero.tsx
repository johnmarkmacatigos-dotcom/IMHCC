import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: string; children?: ReactNode }) {
  return (
    <section className="border-b-4 border-gold-500 bg-navy-800 text-white">
      <div className="container-site flex flex-col gap-4 py-14 sm:py-20">
        <span className="self-start rounded-full bg-brick-600 px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_0_0_4px_rgba(207,68,54,0.25)]">{eyebrow}</span>
        <h1 className="max-w-3xl text-4xl leading-tight text-white sm:text-5xl">{title}</h1>
        {intro && <p className="max-w-2xl text-lg leading-relaxed text-[#d1d9e3]">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
