"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ───────────── Count-up numbers ───────────── */

/** Counts from 0 up to `value` when it first appears, and from the old value when it changes. */
export function CountUp({ value, duration = 900, className }: { value: number; duration?: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion() || value === from.current) {
      setShown(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(a + (value - a) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <span className={cn("tabular-nums", className)} aria-label={String(value)}>
      <span aria-hidden>{shown.toLocaleString("en-PH")}</span>
    </span>
  );
}

/* ───────────── Toasts ───────────── */

type Tone = "success" | "error" | "info";
type ToastItem = { id: number; message: string; tone: Tone; leaving?: boolean };

const listeners = new Set<(t: ToastItem) => void>();
let nextId = 1;
const PENDING_KEY = "imhcc:pending-toast";

/** Show a toast from any client component. */
export function toast(message: string, tone: Tone = "success") {
  const item = { id: nextId++, message, tone };
  listeners.forEach((l) => l(item));
}

/**
 * Remember a toast to show after the next page change. Server actions that save and then
 * redirect (create, delete) unmount the form, so the toast has to survive the navigation.
 */
export function toastAfterNavigation(message: string, tone: Tone = "success") {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ message, tone, at: Date.now() }));
  } catch {}
}

export function clearPendingToast() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {}
}

function takePendingToast() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PENDING_KEY);
    const p = JSON.parse(raw) as { message: string; tone: Tone; at: number };
    if (Date.now() - p.at < 20_000) toast(p.message, p.tone);
  } catch {}
}

const TOAST_MS = 3800;
const toneStyle = {
  success: { icon: CheckCircle2, box: "bg-navy-800 text-white", icon_: "text-gold-500", bar: "bg-gold-500" },
  error: { icon: AlertCircle, box: "bg-brick-600 text-white", icon_: "text-white", bar: "bg-white/70" },
  info: { icon: Info, box: "bg-white text-navy-800 ring-1 ring-gray-200", icon_: "text-navy-800", bar: "bg-navy-800" },
} as const;

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const add = (t: ToastItem) => setItems((xs) => [...xs.slice(-3), t]);
    listeners.add(add);
    return () => {
      listeners.delete(add);
    };
  }, []);

  useEffect(() => {
    takePendingToast();
  }, [pathname]);

  const dismiss = (id: number) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), prefersReducedMotion() ? 0 : 200);
  };

  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
      {items.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const s = toneStyle[item.tone];
  const Icon = s.icon;
  const [paused, setPaused] = useState(false);
  const remaining = useRef(TOAST_MS);
  const startedAt = useRef(0);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    if (paused || item.leaving) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => dismissRef.current(), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, item.leaving]);

  return (
    <div
      className={cn("admin-toast pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl px-4 py-3.5 shadow-lg", s.box)}
      data-leaving={item.leaving || undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Icon className={cn("admin-pop mt-0.5 size-5 shrink-0", s.icon_)} aria-hidden />
      <p className="flex-1 text-[15px] font-medium leading-snug">{item.message}</p>
      <button type="button" onClick={onDismiss} className="-m-1 flex size-8 shrink-0 items-center justify-center rounded-md opacity-70 hover:opacity-100" aria-label="Dismiss">
        <X className="size-4" aria-hidden />
      </button>
      <span className={cn("admin-toast-timer absolute inset-x-0 bottom-0 h-[3px] motion-reduce:hidden", s.bar)} style={{ animationDuration: `${TOAST_MS}ms` }} aria-hidden />
    </div>
  );
}

/* ───────────── Navigation progress bar ───────────── */

/** A thin gold bar along the top while the next dashboard page loads. */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !url.pathname.startsWith("/admin")) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setState("loading");
    };
    const onSubmit = (e: SubmitEvent) => {
      const f = e.target as HTMLFormElement;
      if ((f.method || "get").toLowerCase() === "get" && f.action.includes("/admin")) setState("loading");
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit);
    };
  }, []);

  useEffect(() => {
    setState((s) => (s === "loading" ? "done" : s));
  }, [pathname, search]);

  useEffect(() => {
    if (state === "done") {
      const t = setTimeout(() => setState("idle"), 600);
      return () => clearTimeout(t);
    }
    if (state === "loading") {
      const t = setTimeout(() => setState("done"), 12_000);
      return () => clearTimeout(t);
    }
  }, [state]);

  if (state === "idle") return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]" aria-hidden>
      <div data-state={state} className="admin-progress h-full origin-left bg-gradient-to-r from-gold-500 via-gold-300 to-gold-500 shadow-[0_0_8px_rgba(201,154,53,0.7)]" />
    </div>
  );
}

/* ───────────── Page transition ───────────── */

/** Each dashboard page glides in. Keyed by path so opening an inquiry from the list animates too. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="admin-page-in mx-auto flex max-w-6xl flex-col gap-6">
      {children}
    </div>
  );
}
