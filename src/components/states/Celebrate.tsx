"use client";

import { cn } from "@/lib/utils";

const colors = ["#c99a35", "#e9c46a", "#142b46", "#b83227", "#cf4436", "#ffffff"];

/** A short burst of brand-colored confetti behind a success icon. Hidden for reduced motion. */
export function Confetti({ pieces = 26, className }: { pieces?: number; className?: string }) {
  return (
    <span className={cn("ux-confetti pointer-events-none absolute inset-0", className)} aria-hidden>
      {Array.from({ length: pieces }, (_, i) => {
        const angle = (i / pieces) * Math.PI * 2 + (i % 3) * 0.2;
        const dist = 70 + ((i * 37) % 60);
        return (
          <i
            key={i}
            style={
              {
                background: colors[i % colors.length],
                boxShadow: colors[i % colors.length] === "#ffffff" ? "0 0 0 1px #e5e7eb" : undefined,
                "--x": `${Math.cos(angle) * dist}px`,
                "--y": `${Math.sin(angle) * dist - 20}px`,
                "--r": `${(i * 47) % 360}deg`,
                "--d": `${(i % 5) * 40}ms`,
                width: i % 2 ? 6 : 9,
                height: i % 3 ? 10 : 6,
              } as React.CSSProperties
            }
          />
        );
      })}
    </span>
  );
}

/** Big animated check mark in a green disc, with confetti around it. */
export function SuccessBadge({ size = 72 }: { size?: number }) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <Confetti />
      <span className="ux-ring absolute inset-0 rounded-full text-[#3f9b66]/30" aria-hidden />
      <span className="admin-pop relative flex size-full items-center justify-center rounded-full bg-[#1e6b3e] shadow-[0_8px_24px_-8px_rgba(30,107,62,0.6)] ring-4 ring-[#e7f3ec]">
        <svg viewBox="0 0 24 24" className="ux-check size-1/2" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    </span>
  );
}
