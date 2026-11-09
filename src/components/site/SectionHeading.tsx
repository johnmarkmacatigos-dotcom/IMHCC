import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = { eyebrow: string; title: string; intro?: ReactNode; action?: ReactNode; className?: string; as?: "h1" | "h2" };

export function SectionHeading({ eyebrow, title, intro, action, className, as: Tag = "h2" }: Props) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="flex max-w-2xl flex-col gap-2.5">
        <span className="eyebrow">{eyebrow}</span>
        <Tag className={Tag === "h1" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-[40px] sm:leading-tight"}>{title}</Tag>
        {intro && <p className="text-base leading-relaxed text-gray-600">{intro}</p>}
      </div>
      {action}
    </div>
  );
}
