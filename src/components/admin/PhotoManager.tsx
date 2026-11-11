"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { addProjectPhotos, deleteProjectPhoto, setProjectCover, updateProjectPhoto } from "@/app/admin/(dashboard)/projects/actions";
import { cn } from "@/lib/utils";
import { uploadMedia } from "./ImageField";
import { toast } from "./motion";

type Phase = "before" | "during" | "after";
type Photo = { id: string; image_url: string; caption: string | null; phase: Phase; sort_order: number };

const phases: { value: Phase; label: string }[] = [
  { value: "before", label: "Before" },
  { value: "during", label: "During" },
  { value: "after", label: "After" },
];

/** Upload, label (before/during/after), caption, reorder, and delete a project's photos. */
export function PhotoManager({ projectId, photos, cover }: { projectId: string; photos: Photo[]; cover: string | null }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("after");
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const uploaded: { image_url: string; phase: Phase }[] = [];
    const list = Array.from(files).slice(0, 30);
    for (const [i, f] of list.entries()) {
      setProgress(`Uploading ${i + 1} of ${list.length}…`);
      try {
        uploaded.push({ image_url: await uploadMedia(f, `projects/${projectId}`), phase });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed.");
      }
    }
    if (uploaded.length) {
      setProgress("Saving…");
      const res = await addProjectPhotos({ project_id: projectId, photos: uploaded });
      if (res.error) setError(res.error);
      else toast(uploaded.length === 1 ? "Photo added." : `${uploaded.length} photos added.`);
    }
    setProgress(null);
    router.refresh();
  }

  const run = (fn: () => Promise<{ error?: string }>, done: string) =>
    start(async () => {
      const res = await fn();
      if (res.error) {
        setError(res.error);
        toast(res.error, "error");
      } else toast(done);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-lg bg-mist p-4 sm:flex-row sm:items-center">
        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="sr-only">These photos are from</legend>
          <span className="mr-1 text-sm font-semibold text-gray-700">New photos are:</span>
          {phases.map((p) => (
            <button
              key={p.value}
              type="button"
              aria-pressed={phase === p.value}
              onClick={() => setPhase(p.value)}
              className={cn(
                "min-h-10 rounded-full px-4 text-sm font-medium",
                phase === p.value ? "bg-navy-800 text-white" : "bg-white text-navy-800 ring-1 ring-gray-300",
              )}
            >
              {p.label}
            </button>
          ))}
        </fieldset>
        <label className={cn("btn-gold cursor-pointer sm:ml-auto", progress && "pointer-events-none opacity-70")}>
          {progress ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
          {progress ?? "Add photos"}
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={!!progress}
            onChange={(e) => {
              onFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}

      {photos.length === 0 ? (
        <p className="text-[15px] text-gray-600">No photos yet. Pick &quot;Before&quot;, &quot;During&quot;, or &quot;After&quot;, then add photos from your phone or computer.</p>
      ) : (
        <ul className={cn("admin-stagger grid gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3", pending && "opacity-70")}>
          {photos.map((p) => (
            <li key={p.id} className="flex flex-col gap-2 rounded-lg bg-white p-3 ring-1 ring-gray-200">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image_url} alt={p.caption ?? ""} className="aspect-[4/3] w-full rounded-md object-cover" />
                {cover === p.image_url && (
                  <span className="admin-pop absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gold-500 px-2 py-0.5 text-xs font-bold text-navy-900">
                    <Star className="size-3" aria-hidden /> Cover
                  </span>
                )}
              </div>
              <PhotoRow photo={p} onSave={(v) => run(() => updateProjectPhoto({ id: p.id, ...v }), "Photo updated.")} />
              <div className="flex flex-wrap justify-between gap-2">
                {cover !== p.image_url ? (
                  <button type="button" onClick={() => run(() => setProjectCover(projectId, p.image_url), "Cover photo changed.")} className="text-sm font-semibold text-navy-800 hover:underline">
                    Use as cover
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => window.confirm("Delete this photo?") && run(() => deleteProjectPhoto(p.id), "Photo deleted.")}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-brick-600 hover:underline"
                >
                  <Trash2 className="size-4" aria-hidden /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PhotoRow({ photo, onSave }: { photo: Photo; onSave: (v: { caption: string; phase: Phase; sort_order: number }) => void }) {
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [phase, setPhase] = useState<Phase>(photo.phase);
  const [order, setOrder] = useState(String(photo.sort_order));
  const dirty = caption !== (photo.caption ?? "") || phase !== photo.phase || order !== String(photo.sort_order);
  return (
    <div className="flex flex-col gap-2">
      <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)" aria-label="Caption" className="field-input min-h-10 py-2 text-sm" />
      <div className="flex gap-2">
        <select value={phase} onChange={(e) => setPhase(e.target.value as Phase)} aria-label="Stage" className="field-input min-h-10 flex-1 py-2 text-sm">
          {phases.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <input value={order} onChange={(e) => setOrder(e.target.value)} inputMode="numeric" aria-label="Order" title="Order (lower shows first)" className="field-input min-h-10 w-20 py-2 text-sm" />
        {dirty && (
          <button type="button" onClick={() => onSave({ caption, phase, sort_order: Number(order) || 0 })} className="btn-navy min-h-10 px-3 py-2 text-sm">
            Save
          </button>
        )}
      </div>
    </div>
  );
}
