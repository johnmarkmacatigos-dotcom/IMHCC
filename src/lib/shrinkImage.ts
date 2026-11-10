/**
 * Shrinks a photo in the browser before it is uploaded, so phone pictures (often 3–6 MB)
 * become ~150–350 KB. Keeps storage well inside the Supabase free plan and pages fast on
 * mobile data. Browser-only (uses canvas).
 *
 * - Longest side is capped at `maxSide` (default 1600px, plenty for full-width galleries).
 * - Saves as WebP; falls back to JPEG where the browser cannot encode WebP (older Safari).
 * - Respects the phone's rotation (EXIF) so photos don't come out sideways.
 * - If the browser can't read the file (e.g. HEIC outside Safari) or the result would be
 *   bigger, the original file is returned unchanged.
 */
export async function shrinkImage(file: File, { maxSide = 1600, quality = 0.82 }: { maxSide?: number; quality?: number } = {}): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);

    const encode = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    let blob = await encode("image/webp");
    if (!blob || blob.type !== "image/webp") blob = await encode("image/jpeg");
    if (!blob || (blob.size >= file.size && scale === 1)) return file;

    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.${ext}`, { type: blob.type, lastModified: file.lastModified });
  } finally {
    bitmap.close();
  }
}
