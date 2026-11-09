"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LocateFixed, Navigation } from "lucide-react";

type Status = "idle" | "locating" | "route" | "denied" | "unavailable";

type Props = { lat: number; lng: number; label: string };

/**
 * Shows the shop's exact pin. When the map scrolls into view it asks the browser for the
 * visitor's location (the browser shows a permission prompt) and, if allowed, draws the
 * route from where they are to the shop. "Open in Google Maps" hands off turn-by-turn
 * navigation to the Google Maps app on phones.
 */
export function DirectionsMap({ lat, lng, label }: Props) {
  const dest = `${lat},${lng}`;
  const [origin, setOrigin] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const boxRef = useRef<HTMLDivElement>(null);
  const asked = useRef(false);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }
    asked.current = true;
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin(`${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`);
        setStatus("route");
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, []);

  // Ask for the location once, when the visitor actually reaches the map.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !asked.current) {
          io.disconnect();
          locate();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [locate]);

  const src = origin
    ? `https://www.google.com/maps?saddr=${origin}&daddr=${dest}&dirflg=d&output=embed`
    : `https://www.google.com/maps?q=${dest}&z=16&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest}${origin ? `&origin=${origin}` : ""}&travelmode=driving`;

  const note: Record<Status, string> = {
    idle: "",
    locating: "Finding your location…",
    route: "Showing the route from your current location.",
    denied: "Location access is off, so we're showing our pin only. Allow location to see the route.",
    unavailable: "We couldn't get your location. Use the button to open directions in Google Maps.",
  };

  return (
    <div ref={boxRef} className="flex flex-col gap-3">
      <iframe
        key={src}
        title={origin ? `Route from your location to ${label}` : `Map showing ${label}`}
        src={src}
        className="h-80 w-full rounded-xl border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex flex-wrap items-center gap-2.5">
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="btn-navy">
          <Navigation className="size-4" aria-hidden /> Get directions in Google Maps
        </a>
        {status !== "route" && status !== "locating" && (
          <button type="button" onClick={locate} className="btn-outline">
            <LocateFixed className="size-4" aria-hidden /> Use my location
          </button>
        )}
      </div>
      <p className="text-sm text-gray-600" aria-live="polite">
        {note[status]}
        {status !== "locating" && (
          <span className="block text-gray-500">
            Our location: {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        )}
      </p>
    </div>
  );
}
