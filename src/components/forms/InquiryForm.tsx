"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ImagePlus, Loader2, X } from "lucide-react";
import Link from "next/link";
import { getPublicClient } from "@/lib/supabase/public";
import type { InquiryType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES, MAX_PHOTOS, inquirySchema, type InquiryInput } from "@/lib/validation";

type Props = {
  type: InquiryType;
  services?: string[];
  defaultService?: string;
  productId?: string;
  productName?: string;
  submitLabel?: string;
};

const budgets = ["Not sure yet", "Below ₱100,000", "₱100,000 to ₱500,000", "₱500,000 to ₱1,000,000", "Above ₱1,000,000"];
const contactMethods = ["Phone call", "Messenger", "Text message", "Email"];

export function InquiryForm({ type, services = [], defaultService, productId, productName, submitLabel = "Send my request" }: Props) {
  const startedAt = useRef(Date.now());
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      type,
      service: defaultService ?? (type === "quotation" ? services[0] : productName ? `Product: ${productName}` : ""),
      product_id: productId ?? "",
      attachments: [],
      website: "",
    },
  });
  const selectedService = watch("service");
  const allowPhotos = type === "quotation" || type === "consultation";

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFileError(null);
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!ALLOWED_PHOTO_TYPES.includes(f.type)) {
        setFileError(`${f.name} is not a supported photo. Use JPG, PNG, or WebP.`);
        continue;
      }
      if (f.size > MAX_PHOTO_BYTES) {
        setFileError(`${f.name} is larger than 10 MB.`);
        continue;
      }
      if (next.length >= MAX_PHOTOS) {
        setFileError(`You can attach up to ${MAX_PHOTOS} photos.`);
        break;
      }
      next.push(f);
    }
    setFiles(next);
  }

  async function uploadPhotos(): Promise<string[]> {
    if (files.length === 0) return [];
    const db = getPublicClient();
    if (!db) throw new Error("Photo uploads are not connected yet. Please send your request without photos, or message us on Messenger.");
    const folder = crypto.randomUUID();
    const paths: string[] = [];
    for (const [i, f] of files.entries()) {
      const ext = (f.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
      const path = `${folder}/photo-${i + 1}.${ext}`;
      const { error } = await db.storage.from("inquiry-uploads").upload(path, f, { contentType: f.type, upsert: false });
      if (error) throw new Error("A photo could not be uploaded. Please try again with smaller photos.");
      paths.push(path);
    }
    return paths;
  }

  async function onSubmit(values: InquiryInput) {
    setServerError(null);
    try {
      const attachments = await uploadPhotos();
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, attachments, started_at: startedAt.current }),
      });
      const json = (await res.json().catch(() => ({}))) as { reference?: string; error?: string };
      if (!res.ok || !json.reference) throw new Error(json.error ?? "We could not send your request. Please try again or call us.");
      setReference(json.reference);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
  }

  if (reference) {
    return (
      <div className="flex flex-col items-start gap-5 py-4" role="status">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#e7f3ec] px-3 py-1.5 text-[13px] font-semibold text-[#1e6b3e]">
          <CheckCircle2 className="size-4" aria-hidden /> Request received
        </span>
        <h2 className="text-3xl">Salamat! We got your request.</h2>
        <p className="leading-relaxed text-gray-600">Keep this reference number handy when we call, or when you message us on Messenger.</p>
        <div className="flex flex-col gap-1 rounded-xl bg-navy-800 px-7 py-5 text-white">
          <span className="text-[13px] text-[#d1d9e3]">Reference number</span>
          <span className="font-display text-3xl font-semibold tracking-wide text-gold-300">{reference}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              reset();
              setFiles([]);
              setReference(null);
              startedAt.current = Date.now();
            }}
          >
            Send another request
          </button>
          <Link href="/projects" className="btn-navy">
            Browse our projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <input type="hidden" {...register("type")} />
      <input type="hidden" {...register("product_id")} />
      {/* Honeypot: hidden from people, tempting to bots */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      {type === "quotation" && services.length > 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-[15px] font-semibold text-navy-800">What do you need?</legend>
          <div className="flex flex-wrap gap-2.5">
            {services.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={selectedService === s}
                onClick={() => setValue("service", s)}
                className={cn(
                  "min-h-11 rounded-full border-[1.5px] px-4 py-2 text-sm transition-colors",
                  selectedService === s ? "border-navy-800 bg-navy-800 font-semibold text-white" : "border-[#cbd2dc] bg-white text-navy-800 hover:bg-navy-100",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {productName && (
        <p className="rounded-lg bg-mist px-4 py-3 text-[15px]">
          Asking about: <strong className="text-navy-800">{productName}</strong>
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" error={errors.full_name?.message}>
          <input className="field-input" autoComplete="name" placeholder="Juan Dela Cruz" {...register("full_name")} />
        </Field>
        <Field label="Mobile number" error={errors.phone?.message}>
          <input className="field-input" type="tel" autoComplete="tel" inputMode="tel" placeholder="0917 123 4567" {...register("phone")} />
        </Field>
        <Field label="Email (optional)" error={errors.email?.message}>
          <input className="field-input" type="email" autoComplete="email" placeholder="you@email.com" {...register("email")} />
        </Field>
        {type !== "contact" && (
          <Field label={type === "product" ? "Delivery location" : "Project location"} error={errors.location?.message}>
            <input className="field-input" placeholder="Barangay, Town" {...register("location")} />
          </Field>
        )}
        {type === "quotation" && (
          <>
            <Field label="Estimated budget" error={errors.budget?.message}>
              <select className="field-input" {...register("budget")}>
                {budgets.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="Preferred start" error={errors.preferred_date?.message}>
              <input className="field-input" type="month" {...register("preferred_date")} />
            </Field>
          </>
        )}
        {type === "consultation" && (
          <>
            <Field label="Preferred date" error={errors.preferred_date?.message}>
              <input className="field-input" type="date" {...register("preferred_date")} />
            </Field>
            <Field label="How should we reach you?" error={errors.preferred_contact?.message}>
              <select className="field-input" {...register("preferred_contact")}>
                {contactMethods.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
          </>
        )}
      </div>

      <Field label={type === "contact" ? "Your message" : type === "product" ? "Quantity and details" : "Describe your project"} error={errors.message?.message}>
        <textarea
          className="field-input resize-y"
          rows={5}
          placeholder={
            type === "product"
              ? "Example: 20 pieces, color white, needed by next week."
              : type === "contact"
                ? "How can we help?"
                : "Example: Full kitchen renovation with modular cabinets and an island, about 3 by 4 meters."
          }
          {...register("message")}
        />
      </Field>

      {allowPhotos && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-gray-700">Photos of your space (optional)</span>
          <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-[#9aa6b5] bg-gray-50 p-6 text-center hover:bg-navy-100/40 focus-within:ring-2 focus-within:ring-navy-800/30">
            <ImagePlus className="size-7 text-navy-800" aria-hidden />
            <span className="text-[15px] font-semibold text-navy-800">Upload photos</span>
            <span className="text-[13px] text-gray-600">JPG, PNG, or WebP, up to {MAX_PHOTOS} photos, 10 MB each</span>
            <input
              type="file"
              accept={ALLOWED_PHOTO_TYPES.join(",")}
              multiple
              className="sr-only"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          {fileError && <p className="field-error">{fileError}</p>}
          {files.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-full bg-mist py-1 pl-3 pr-1 text-sm">
                  <span className="max-w-48 truncate">{f.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    className="flex size-8 items-center justify-center rounded-full hover:bg-gray-200"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-3 text-sm leading-relaxed text-gray-700">
          <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-navy-800" {...register("consent")} />
          <span>
            I agree that Iloilo Modern Homes may contact me about this request and store my details as described in the{" "}
            <Link href="/privacy" className="font-semibold underline">
              privacy policy
            </Link>
            .
          </span>
        </label>
        {errors.consent && <p className="field-error">{errors.consent.message}</p>}
      </div>

      {serverError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {serverError}
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className="btn-gold self-start px-8 text-base">
        {isSubmitting && <Loader2 className="size-5 animate-spin" aria-hidden />}
        {isSubmitting ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="field-label">
      {label}
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
