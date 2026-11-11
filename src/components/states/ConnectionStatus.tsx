"use client";

import { useEffect, useRef, useState } from "react";
import { Gauge, RefreshCw, Wifi, WifiOff, X } from "lucide-react";
import { cn } from "@/lib/utils";

type NetInfo = { effectiveType?: string; saveData?: boolean; addEventListener?: (t: string, f: () => void) => void; removeEventListener?: (t: string, f: () => void) => void };

/** True when the browser says the connection is 2G-like or the visitor turned on data saver. */
export function isSlowConnection() {
  if (typeof navigator === "undefined") return false;
  const c = (navigator as Navigator & { connection?: NetInfo }).connection;
  return Boolean(c && (c.saveData || c.effectiveType === "slow-2g" || c.effectiveType === "2g"));
}

/**
 * Watches the connection for every page:
 *  - offline: a navy bar slides down saying what still works and that we retry by ourselves
 *  - back online: a short gold "You're back online" confirmation
 *  - slow (2G or data saver): a small dismissible note so a long wait is not mistaken for a freeze
 * On the public site it also installs a tiny service worker that shows a branded offline page
 * (with the phone number) instead of the browser's dinosaur when a page can't load.
 */
export function ConnectionStatus({ registerOfflinePage = false, phone }: { registerOfflinePage?: boolean; phone?: string }) {
  const [online, setOnline] = useState(true);
  const [backOnline, setBackOnline] = useState(false);
  const [slow, setSlow] = useState(false);
  const [slowDismissed, setSlowDismissed] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    const update = () => {
      const now = navigator.onLine;
      setOnline(now);
      if (!now) wasOffline.current = true;
      else if (wasOffline.current) {
        wasOffline.current = false;
        setBackOnline(true);
      }
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    const c = (navigator as Navigator & { connection?: NetInfo }).connection;
    const checkSlow = () => setSlow(isSlowConnection());
    checkSlow();
    c?.addEventListener?.("change", checkSlow);

    try {
      setSlowDismissed(sessionStorage.getItem("imhcc:slow-dismissed") === "1");
    } catch {}

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      c?.removeEventListener?.("change", checkSlow);
    };
  }, []);

  useEffect(() => {
    if (!backOnline) return;
    const t = setTimeout(() => setBackOnline(false), 3500);
    return () => clearTimeout(t);
  }, [backOnline]);

  useEffect(() => {
    if (!registerOfflinePage || process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/offline-sw.js", { scope: "/" }).catch(() => {});
  }, [registerOfflinePage]);

  return (
    <>
      {!online && (
        <div role="alert" className="ux-slide-down fixed inset-x-0 top-0 z-[80] bg-navy-900 text-white shadow-lg">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm">
            <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10">
              <WifiOff className="size-4 text-gold-300" aria-hidden />
            </span>
            <p className="min-w-0 flex-1 leading-snug">
              <strong className="font-semibold text-gold-300">You&apos;re offline.</strong> Pages you already opened still work, and anything you type is kept on
              this device. We&apos;ll reconnect by ourselves.
              {phone && (
                <>
                  {" "}
                  Urgent? Call{" "}
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="font-semibold underline">
                    {phone}
                  </a>
                  .
                </>
              )}
            </p>
            <button type="button" onClick={() => location.reload()} className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-white/10 px-3 font-semibold hover:bg-white/20">
              <RefreshCw className="size-4" aria-hidden /> Try again
            </button>
          </div>
        </div>
      )}

      {online && backOnline && (
        <div role="status" className="ux-slide-down fixed inset-x-0 top-0 z-[80] flex justify-center p-3">
          <span className="admin-pop flex items-center gap-2 rounded-full bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-900 shadow-lg">
            <Wifi className="size-4" aria-hidden /> You&apos;re back online
          </span>
        </div>
      )}

      {online && slow && !slowDismissed && (
        <div role="status" className="ux-in fixed bottom-24 left-3 z-[55] max-w-[19rem] sm:bottom-6 sm:left-6">
          <div className="flex items-start gap-3 rounded-xl bg-white p-3.5 pr-2 text-sm shadow-lg ring-1 ring-gray-200">
            <Gauge className="mt-0.5 size-5 shrink-0 text-gold-500" aria-hidden />
            <p className="leading-snug text-gray-700">
              <strong className="block text-navy-800">Slow connection</strong>
              Pages may take a little longer. Text loads first and photos follow, so keep going.
            </p>
            <button
              type="button"
              aria-label="Dismiss"
              className={cn("-mt-1 flex size-8 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100")}
              onClick={() => {
                setSlowDismissed(true);
                try {
                  sessionStorage.setItem("imhcc:slow-dismissed", "1");
                } catch {}
              }}
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
