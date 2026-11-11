import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One look for every "something other than normal content" screen: empty lists, errors,
 * offline, no search results, permission denied, session expired, and success. Used on both
 * the public website and the owner dashboard so customers and the team see the same voice.
 */
export type StateTone = "empty" | "search" | "error" | "offline" | "denied" | "expired" | "success";

const toneStyle: Record<StateTone, { ring: string; icon: string; eyebrow: string; stripe: string }> = {
  empty: { ring: "bg-gold-100 text-gold-500", icon: "text-gold-700", eyebrow: "bg-gold-100 text-gold-700", stripe: "from-gold-500 via-gold-300 to-gold-500" },
  search: { ring: "bg-navy-100 text-navy-700", icon: "text-navy-800", eyebrow: "bg-navy-100 text-navy-800", stripe: "from-navy-800 via-navy-700 to-navy-800" },
  error: { ring: "bg-brick-50 text-brick-500", icon: "text-brick-600", eyebrow: "bg-brick-600 text-white", stripe: "from-brick-600 via-brick-500 to-brick-600" },
  offline: { ring: "bg-navy-100 text-navy-700", icon: "text-navy-800", eyebrow: "bg-navy-800 text-white", stripe: "from-navy-800 via-gold-500 to-navy-800" },
  denied: { ring: "bg-brick-50 text-brick-500", icon: "text-brick-600", eyebrow: "bg-brick-50 text-brick-700", stripe: "from-brick-600 via-gold-500 to-brick-600" },
  expired: { ring: "bg-gold-100 text-gold-500", icon: "text-gold-700", eyebrow: "bg-gold-500 text-navy-900", stripe: "from-gold-500 via-navy-800 to-gold-500" },
  success: { ring: "bg-[#e7f3ec] text-[#3f9b66]", icon: "text-[#1e6b3e]", eyebrow: "bg-[#e7f3ec] text-[#1e6b3e]", stripe: "from-gold-500 via-[#3f9b66] to-gold-500" },
};

export function StatePanel({
  tone,
  icon: Icon,
  eyebrow,
  title,
  children,
  actions,
  tips,
  size = "md",
  className,
  role,
}: {
  tone: StateTone;
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  /** Buttons or links: the way forward. Always give at least one. */
  actions?: React.ReactNode;
  /** Short suggestions shown as a list (for example, search tips). */
  tips?: React.ReactNode[];
  size?: "sm" | "md" | "lg";
  className?: string;
  role?: "alert" | "status";
}) {
  const s = toneStyle[tone];
  return (
    <section
      role={role}
      className={cn(
        "ux-in relative flex flex-col items-center overflow-hidden rounded-2xl bg-white text-center shadow-sm ring-1 ring-gray-200",
        size === "sm" ? "gap-3 px-5 py-8" : size === "lg" ? "gap-5 px-6 py-14 sm:px-12 sm:py-20" : "gap-4 px-6 py-10 sm:px-10 sm:py-12",
        className,
      )}
    >
      <span className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", s.stripe)} aria-hidden />
      <span className={cn("ux-float relative flex items-center justify-center", size === "sm" ? "size-12" : "size-16")} aria-hidden>
        <span className={cn("ux-ring absolute inset-0 rounded-full", s.ring)} />
        <span className={cn("relative flex size-full items-center justify-center rounded-full ring-4 ring-white", s.ring)}>
          <Icon className={cn(size === "sm" ? "size-6" : "size-8", s.icon)} strokeWidth={1.8} />
        </span>
      </span>
      {eyebrow && <span className={cn("rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-[0.1em]", s.eyebrow)}>{eyebrow}</span>}
      <h2 className={cn("max-w-xl text-balance", size === "sm" ? "text-lg" : size === "lg" ? "text-3xl sm:text-4xl" : "text-2xl")}>{title}</h2>
      {children && <div className="max-w-xl text-[15px] leading-relaxed text-gray-600">{children}</div>}
      {tips && tips.length > 0 && (
        <ul className="flex max-w-md flex-col gap-1.5 text-left text-sm text-gray-600">
          {tips.map((t, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      )}
      {actions && <div className="mt-1 flex flex-wrap items-center justify-center gap-2.5">{actions}</div>}
    </section>
  );
}
