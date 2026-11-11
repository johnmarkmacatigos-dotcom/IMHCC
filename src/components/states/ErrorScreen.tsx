"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Home, Loader2, Phone, RefreshCw, WifiOff } from "lucide-react";
import { fallbackSettings } from "@/content/fallback";
import { StatePanel } from "./StatePanel";

/**
 * Shown when a page fails to load. Says plainly what happened, whether it's the visitor's
 * connection or our side, and gives a way forward: try again, go back, or reach us directly.
 */
export function ErrorScreen({
  error,
  reset,
  area,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  area: "site" | "admin";
}) {
  const [offline, setOffline] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    console.error("[page error]", error);
    const check = () => setOffline(!navigator.onLine);
    check();
    // Coming back online is the most common fix, so retry by ourselves when it happens.
    const onOnline = () => {
      check();
      reset();
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", check);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", check);
    };
  }, [error, reset]);

  const retry = () => {
    setRetrying(true);
    reset();
    setTimeout(() => setRetrying(false), 1200);
  };

  const tryAgain = (
    <button type="button" onClick={retry} className={area === "site" ? "btn-gold" : "btn-navy"} disabled={retrying}>
      {retrying ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
      {retrying ? "Trying again…" : "Try again"}
    </button>
  );
  const home =
    area === "site" ? (
      <Link href="/" className="btn-outline">
        <Home className="size-4" aria-hidden /> Go to the homepage
      </Link>
    ) : (
      <Link href="/admin" className="btn-outline">
        <Home className="size-4" aria-hidden /> Back to the overview
      </Link>
    );

  if (offline) {
    return (
      <div className={area === "site" ? "container-site py-16" : ""}>
        <StatePanel
          tone="offline"
          icon={WifiOff}
          eyebrow="No internet"
          title="This page couldn't load because you're offline"
          role="alert"
          tips={["Check that Wi-Fi or mobile data is on.", "Move closer to your router, or switch from Wi-Fi to mobile data.", "We'll reload this page by ourselves once you're back online."]}
          actions={tryAgain}
        />
      </div>
    );
  }

  return (
    <div className={area === "site" ? "container-site py-16" : ""}>
      <StatePanel
        tone="error"
        icon={AlertTriangle}
        eyebrow="Something went wrong"
        title={area === "site" ? "Sorry, this page didn't load properly" : "This page hit a problem while loading"}
        role="alert"
        tips={
          area === "site"
            ? ["It's on our side, not yours. Trying again usually fixes it.", "If it keeps happening, call or message us and we'll help right away."]
            : [
                "Nothing you saved was lost. Changes are only kept when you see the Saved message.",
                "Try again in a moment. If the database is busy, it usually recovers within a minute.",
                "If it keeps happening, send the code below to your developer.",
              ]
        }
        actions={
          <>
            {tryAgain}
            {home}
            {area === "site" && (
              <a href={`tel:${(fallbackSettings.phone_primary ?? "").replace(/\s/g, "")}`} className="btn-outline">
                <Phone className="size-4" aria-hidden /> Call us
              </a>
            )}
          </>
        }
      >
        {error.digest && <p className="mt-1 font-mono text-[13px] text-gray-400">Error code: {error.digest}</p>}
      </StatePanel>
    </div>
  );
}
