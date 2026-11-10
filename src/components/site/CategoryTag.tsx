import { cn } from "@/lib/utils";

/** Logo colors: gold roof, navy roof, brick-red outline. */
const styles = {
  gold: "bg-gold-500 text-navy-900",
  navy: "bg-navy-800 text-white",
  brick: "bg-brick-600 text-white",
} as const;

type Tone = keyof typeof styles;

/** Related kinds of work share a color, so visitors can tell them apart at a glance. */
const tones: Record<string, Tone> = {
  kitchen: "gold",
  bathroom: "gold",
  "modular kitchens": "gold",
  interior: "navy",
  bedroom: "navy",
  "condo fit-out": "navy",
  commercial: "navy",
  construction: "navy",
  renovation: "navy",
  "feature wall": "brick",
  "wall panels": "brick",
  ceiling: "brick",
  finishing: "brick",
  technical: "brick",
};

export function categoryTone(category: string): Tone {
  const key = category.trim().toLowerCase();
  if (tones[key]) return tones[key];
  // New categories added in the dashboard still get a steady color.
  const all: Tone[] = ["gold", "navy", "brick"];
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return all[h % all.length];
}

export function CategoryTag({ category, className }: { category: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em]",
        styles[categoryTone(category)],
        className,
      )}
    >
      {category}
    </span>
  );
}
