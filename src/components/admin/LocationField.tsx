"use client";

import { useState } from "react";
import { Crosshair, Loader2 } from "lucide-react";

/** Pulls coordinates out of a pasted Google Maps link or "lat, lng" text. */
function parseCoords(text: string): [number, number] | null {
  const patterns = [/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, /@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&](?:q|query|ll|destination)=(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i, /^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return [lat, lng];
    }
  }
  return null;
}

/** Shop map pin: type it, paste a Google Maps link, or use this phone's location while at the shop. */
export function LocationField({ lat, lng }: { lat: number | null; lng: number | null }) {
  const [la, setLa] = useState(lat?.toString() ?? "");
  const [ln, setLn] = useState(lng?.toString() ?? "");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function useDevice() {
    if (!navigator.geolocation) return setNote("This device cannot share its location.");
    setBusy(true);
    setNote(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLa(pos.coords.latitude.toFixed(6));
        setLn(pos.coords.longitude.toFixed(6));
        setNote(`Location found (accurate to about ${Math.round(pos.coords.accuracy)} meters). Press Save to use it.`);
        setBusy(false);
      },
      () => {
        setNote("Location was blocked. Allow location for this site in your browser settings, or paste a Google Maps link.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-mist p-4">
      <div>
        <span className="text-sm font-semibold text-gray-700">Shop location on the map</span>
        <p className="text-[13px] text-gray-600">Visitors get driving directions to this exact spot. Easiest: stand at the shop and press the button, or paste the shop&apos;s Google Maps link.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={useDevice} disabled={busy} className="btn-navy px-4 py-2">
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Crosshair className="size-4" aria-hidden />} Use this device&apos;s location
        </button>
        {la && ln && (
          <a href={`https://www.google.com/maps?q=${la},${ln}`} target="_blank" rel="noopener noreferrer" className="btn-outline px-4 py-2">
            Check on Google Maps
          </a>
        )}
      </div>
      <label className="field-label">
        Or paste a Google Maps link
        <input
          className="field-input"
          placeholder="https://www.google.com/maps/place/..."
          onChange={(e) => {
            const c = parseCoords(e.target.value);
            if (c) {
              setLa(c[0].toFixed(6));
              setLn(c[1].toFixed(6));
              setNote("Coordinates taken from the link. Press Save to use them.");
            } else if (e.target.value.trim()) {
              setNote("No coordinates in that link. In Google Maps, long-press the shop, then copy the numbers shown (for example 10.8231, 122.5337) and paste them here.");
            }
          }}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label">
          Latitude
          <input name="latitude" value={la} onChange={(e) => setLa(e.target.value)} inputMode="decimal" className="field-input" />
        </label>
        <label className="field-label">
          Longitude
          <input name="longitude" value={ln} onChange={(e) => setLn(e.target.value)} inputMode="decimal" className="field-input" />
        </label>
      </div>
      {note && (
        <p role="status" className="text-[13px] font-medium text-navy-800">
          {note}
        </p>
      )}
    </div>
  );
}
