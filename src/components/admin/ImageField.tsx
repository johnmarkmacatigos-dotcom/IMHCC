"use client";
import { buckets } from "@/lib/supabase/env";

import { useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { shrinkImage } from "@/lib/shrinkImage";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
/** Largest picture accepted from the device; it is shrunk to a few hundred KB before upload. */
const MAX_INPUT_BYTES = 30 * 1024 * 1024;
/** Largest file actually stored (the bucket limit is 10 MB). */
const MAX_STORED_BYTES = 8 * 1024 * 1024;

/** Shrinks a picture (max 1600px, WebP), uploads it to the public media bucket, and returns its web address. */
export async function uploadMedia(original: File, folder: string): Promise<string> {
  if (!ACCEPT.includes(original.type)) throw new Error(`${original.name}: use a JPG, PNG, or WebP picture.`);
  if (original.size > MAX_INPUT_BYTES) throw new Error(`${original.name} is larger than 30 MB. Please use a smaller picture.`);
  const file = await shrinkImage(original);
  if (file.size > MAX_STORED_BYTES) throw new Error(`${original.name} is too large even after shrinking. Please use a smaller picture.`);
  const db = getBrowserClient();
  if (!db) throw new Error("The database is not connected yet.");
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from(buckets.media).upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error("The picture could not be uploaded. Check your connection and try again.");
  return db.storage.from(buckets.media).getPublicUrl(path).data.publicUrl;
}

/** Picture picker for forms: uploads right away, then saves the address with the form. */
export function ImageField({ name, label, folder, defaultValue, hint }: { name: string; label: string; folder: string; defaultValue?: string | null; hint?: string }) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setUrl(await uploadMedia(file, folder));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className="flex flex-wrap items-center gap-4">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-28 w-40 rounded-lg border border-gray-200 object-cover" />
        ) : (
          <div className="flex h-28 w-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-[13px] text-gray-500">No picture</div>
        )}
        <div className="flex flex-col gap-2">
          <label className="btn-outline cursor-pointer px-4 py-2 focus-within:ring-2 focus-within:ring-navy-800/30">
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
            {busy ? "Uploading…" : url ? "Change picture" : "Upload picture"}
            <input type="file" accept={ACCEPT.join(",")} className="sr-only" disabled={busy} onChange={(e) => onPick(e.target.files?.[0])} />
          </label>
          {url && (
            <button type="button" onClick={() => setUrl("")} className="inline-flex items-center gap-1.5 text-sm font-medium text-brick-600 hover:underline">
              <Trash2 className="size-4" aria-hidden /> Remove
            </button>
          )}
        </div>
      </div>
      {hint && !error && <span className="text-[13px] text-gray-500">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
