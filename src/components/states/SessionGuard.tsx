"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LogIn, ShieldCheck } from "lucide-react";
import { clearDraft, countDrafts, saveAllDrafts, takeSubmittedFlag } from "@/lib/drafts";

const CHECK_EVERY = 2 * 60_000;
export const LAST_PATH_KEY = "imhcc:last-admin-path";

/**
 * Keeps an eye on the dashboard sign-in. When it runs out (for example after the laptop slept
 * for a long time), it first saves every open form on this device, then explains what happened
 * and offers one button to sign in again and come straight back to the same page.
 */
export function SessionGuard() {
  const pathname = usePathname();
  const [expired, setExpired] = useState(false);
  const [drafts, setDrafts] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const lastPath = useRef(pathname);

  // A form that was sent from the previous page and led here was saved, so drop its copy.
  useEffect(() => {
    if (lastPath.current !== pathname) {
      const key = takeSubmittedFlag();
      if (key && !key.startsWith(pathname)) clearDraft(key);
      lastPath.current = pathname;
    }
    try {
      sessionStorage.setItem(LAST_PATH_KEY, pathname + location.search);
    } catch {}
  }, [pathname]);

  useEffect(() => {
    let stopped = false;
    const check = async () => {
      if (stopped || expired || !navigator.onLine) return;
      try {
        const res = await fetch("/admin/session", { cache: "no-store" });
        const json = (await res.json()) as { active: boolean; reason?: string };
        if (!json.active && json.reason !== "not_connected") {
          saveAllDrafts();
          setTimeout(() => setDrafts(countDrafts()), 50);
          setExpired(true);
        }
      } catch {
        // Network trouble is shown by the connection banner, not as a sign-out.
      }
    };
    const timer = setInterval(check, CHECK_EVERY);
    const onFocus = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("online", check);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("online", check);
    };
  }, [expired]);

  useEffect(() => {
    if (expired && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [expired]);

  if (!expired) return null;
  const next = typeof window === "undefined" ? pathname : pathname + location.search;
  return (
    <dialog
      ref={dialog}
      aria-labelledby="session-title"
      onCancel={(e) => e.preventDefault()}
      className="admin-dialog m-auto w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-2xl p-0 shadow-2xl"
    >
      <div className="relative flex flex-col items-center gap-4 px-6 py-8 text-center sm:px-8">
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-500 via-navy-800 to-gold-500" aria-hidden />
        <span className="ux-float relative flex size-16 items-center justify-center" aria-hidden>
          <span className="ux-ring absolute inset-0 rounded-full bg-gold-100 text-gold-500" />
          <span className="relative flex size-full items-center justify-center rounded-full bg-gold-100 ring-4 ring-white">
            <ShieldCheck className="size-8 text-gold-700" strokeWidth={1.8} />
          </span>
        </span>
        <span className="rounded-full bg-gold-500 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.1em] text-navy-900">Session expired</span>
        <h2 id="session-title" className="text-2xl">
          For your security, please sign in again
        </h2>
        <p className="text-[15px] leading-relaxed text-gray-600">
          You were signed out after a long time away.{" "}
          {drafts > 0 ? (
            <strong className="text-navy-800">
              We kept {drafts === 1 ? "what you typed" : `your unsaved work from ${drafts} forms`} on this device
            </strong>
          ) : (
            <strong className="text-navy-800">Anything you were typing is kept on this device</strong>
          )}
          , and it comes back as soon as you return to this page.
        </p>
        <a href={`/admin/login?expired=1&next=${encodeURIComponent(next)}`} className="btn-navy w-full">
          <LogIn className="size-4" aria-hidden /> Sign in and continue
        </a>
      </div>
    </dialog>
  );
}
