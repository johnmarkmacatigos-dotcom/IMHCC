"use client";
import { buckets } from "@/lib/supabase/env";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CalendarCheck, Check, CheckCircle2, Copy, History, ImagePlus, Loader2, PhoneCall, Search, WifiOff, X } from "lucide-react";
import { SuccessBadge } from "@/components/states/Celebrate";
import Link from "next/link";
import { getPublicClient } from "@/lib/supabase/public";
import type { InquiryType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { shrinkImage } from "@/lib/shrinkImage";
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
  const [offline, setOffline] = useState(false);
  const [progress, setProgress] = useState<{ label: string; done: number; total: number } | null>(null);
  const [slow, setSlow] = useState(false);
  const [restored, setRestored] = useState(false);
  const [copied, setCopied] = useState(false);
  const draftKey = `imhcc:inquiry-draft:${type}:${productId ?? ""}`;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    // Check each field as soon as the visitor leaves it, then re-check while they fix it.
    mode: "onTouched",
    reValidateMode: "onChange",
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
  const errorCount = Object.keys(errors).length;
  const inv = (name: keyof InquiryInput) => ({ "aria-invalid": errors[name] ? true : undefined, "aria-describedby": errors[name] ? `${name}-error` : undefined });

  // Keep what the visitor types on this device, so a dropped connection or a closed tab
  // doesn't make them start over. Restored on the next visit, cleared once it's sent.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw) as { at: number; values: Partial<InquiryInput> };
        if (Date.now() - d.at < 7 * 86_400_000 && (d.values.full_name || d.values.phone || d.values.message)) {
          reset({ ...getValues(), ...d.values, website: "" } as unknown as InquiryInput);
          setRestored(true);
        }
      }
    } catch {}
    const sub = watch((values) => {
      try {
        const { website: _w, attachments: _a, consent: _c, ...keep } = values;
        void _w;
        void _a;
        void _c;
        if (keep.full_name || keep.phone || keep.message) localStorage.setItem(draftKey, JSON.stringify({ at: Date.now(), values: keep }));
      } catch {}
    });
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Tell the visitor when sending takes long, instead of a spinner that looks frozen.
  useEffect(() => {
    if (!isSubmitting) {
      setSlow(false);
      return;
    }
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, [isSubmitting]);

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
    for (const [i, original] of files.entries()) {
      setProgress({ label: `Uploading photo ${i + 1} of ${files.length}`, done: i, total: files.length + 1 });
      const f = await shrinkImage(original, { maxSide: 2000 });
      const ext = (f.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
      const path = `${folder}/photo-${i + 1}.${ext}`;
      const { error } = await db.storage.from(buckets.inquiryUploads).upload(path, f, { contentType: f.type, upsert: false });
      if (error) throw new Error("A photo could not be uploaded. Please try again with smaller photos.");
      paths.push(path);
    }
    return paths;
  }

  async function onSubmit(values: InquiryInput) {
    setServerError(null);
    if (!navigator.onLine) {
      setOffline(true);
      return;
    }
    setOffline(false);
    try {
      const attachments = await uploadPhotos();
      setProgress({ label: "Sending your request", done: files.length, total: files.length + 1 });
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, attachments, started_at: startedAt.current }),
      });
      const json = (await res.json().catch(() => ({}))) as { reference?: string; error?: string };
      if (!res.ok || !json.reference) throw new Error(json.error ?? "We could not send your request. Please try again or call us.");
      setReference(json.reference);
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      if (!navigator.onLine || (e instanceof TypeError && /fetch|network/i.test(e.message))) {
        setOffline(true);
      } else {
        setServerError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    } finally {
      setProgress(null);
    }
  }

  if (reference) {
    const steps = [
      { icon: Search, title: "We review your request", text: "Usually the same day, within one business day at most." },
      { icon: PhoneCall, title: "We call or message you", text: "To ask about sizes, materials, and your timeline." },
      { icon: CalendarCheck, title: type === "product" ? "We confirm price and delivery" : "Site visit and quotation", text: type === "product" ? "Stock, final price, and when it can reach you." : "Free measuring, then a detailed written quotation." },
    ];
    return (
      <div className="ux-in flex flex-col items-start gap-6 py-2" role="status">
        <div className="flex items-center gap-4">
          <SuccessBadge size={64} />
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e7f3ec] px-3 py-1.5 text-[13px] font-semibold text-[#1e6b3e]">
            <CheckCircle2 className="size-4" aria-hidden /> Request received
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl">Salamat! We got your request.</h2>
          <p className="leading-relaxed text-gray-600">Keep this reference number handy when we call, or when you message us on Messenger.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-navy-800 px-6 py-5 text-white">
          <div className="flex flex-col gap-1">
            <span className="text-[13px] text-[#d1d9e3]">Reference number</span>
            <span className="font-display text-3xl font-semibold tracking-wide text-gold-300">{reference}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(reference).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-white/10 px-3.5 text-sm font-semibold hover:bg-white/20"
          >
            {copied ? <Check className="admin-pop size-4 text-gold-300" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="flex w-full flex-col gap-3">
          <h3 className="text-lg">What happens next</h3>
          <ol className="grid gap-3 sm:grid-cols-3">
            {steps.map((st, i) => (
              <li key={st.title} className="ux-in flex gap-3 rounded-xl bg-mist p-4" style={{ animationDelay: `${200 + i * 120}ms` }}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-500 font-display font-semibold text-navy-900">{i + 1}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 font-semibold text-navy-800">
                    <st.icon className="size-4 text-gold-700" aria-hidden /> {st.title}
                  </span>
                  <span className="text-sm leading-snug text-gray-600">{st.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/projects" className="btn-navy">
            While you wait, browse our projects
          </Link>
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              reset();
              setFiles([]);
              setReference(null);
              setRestored(false);
              startedAt.current = Date.now();
            }}
          >
            Send another request
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {restored && (
        <div role="status" className="ux-in flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-gold-100 px-4 py-3 text-sm text-gold-700">
          <History className="size-4 shrink-0" aria-hidden />
          <span className="flex-1 font-medium">We kept what you typed last time, so you can pick up where you left off.</span>
          <button
            type="button"
            className="font-semibold text-navy-800 underline underline-offset-2"
            onClick={() => {
              try {
                localStorage.removeItem(draftKey);
              } catch {}
              reset();
              setRestored(false);
            }}
          >
            Start fresh
          </button>
        </div>
      )}
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
        <Field label="Full name" name="full_name" required error={errors.full_name?.message}>
          <input className="field-input" autoComplete="name" placeholder="Juan Dela Cruz" {...inv("full_name")} {...register("full_name")} />
        </Field>
        <Field label="Mobile number" name="phone" required error={errors.phone?.message} hint="We'll call or text this number.">
          <input className="field-input" type="tel" autoComplete="tel" inputMode="tel" placeholder="0917 123 4567" {...inv("phone")} {...register("phone")} />
        </Field>
        <Field label="Email (optional)" name="email" error={errors.email?.message}>
          <input className="field-input" type="email" autoComplete="email" placeholder="you@email.com" {...inv("email")} {...register("email")} />
        </Field>
        {type !== "contact" && (
          <Field label={type === "product" ? "Delivery location" : "Project location"} name="location" error={errors.location?.message}>
            <input className="field-input" placeholder="Barangay, Town" {...inv("location")} {...register("location")} />
          </Field>
        )}
        {type === "quotation" && (
          <>
            <Field label="Estimated budget" name="budget" error={errors.budget?.message}>
              <select className="field-input" {...register("budget")}>
                {budgets.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="Preferred start" name="preferred_date" error={errors.preferred_date?.message}>
              <input className="field-input" type="month" {...register("preferred_date")} />
            </Field>
          </>
        )}
        {type === "consultation" && (
          <>
            <Field label="Preferred date" name="preferred_date" error={errors.preferred_date?.message}>
              <input className="field-input" type="date" {...register("preferred_date")} />
            </Field>
            <Field label="How should we reach you?" name="preferred_contact" error={errors.preferred_contact?.message}>
              <select className="field-input" {...register("preferred_contact")}>
                {contactMethods.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
          </>
        )}
      </div>

      <Field
        label={type === "contact" ? "Your message" : type === "product" ? "Quantity and details" : "Describe your project"}
        name="message"
        error={errors.message?.message}
        hint={type === "quotation" ? "Sizes, materials, and anything you have in mind help us quote faster." : undefined}
      >
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
          {...inv("message")}
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
          {fileError && (
            <p className="field-error ux-in flex items-start gap-1.5 text-brick-700" role="alert">
              <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden /> {fileError}
            </p>
          )}
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
          <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-navy-800" {...inv("consent")} {...register("consent")} />
          <span>
            I agree that Iloilo Modern Homes may contact me about this request and store my details as described in the{" "}
            <Link href="/privacy" className="font-semibold underline">
              privacy policy
            </Link>
            .
          </span>
        </label>
        <FieldMessage id="consent-error" error={errors.consent?.message} />
      </div>

      {submitCount > 0 && errorCount > 0 && (
        <p role="alert" className="ux-shake flex items-start gap-2 rounded-lg bg-brick-50 px-4 py-3 text-sm font-medium text-brick-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {errorCount === 1 ? "One field needs a fix" : `${errorCount} fields need a fix`}. Look for the red messages above.
        </p>
      )}

      {offline && (
        <div role="alert" className="ux-shake flex items-start gap-3 rounded-lg bg-navy-100 px-4 py-3 text-sm text-navy-800">
          <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            <strong className="block font-semibold">You&apos;re offline, so it wasn&apos;t sent yet.</strong>
            Don&apos;t worry, what you typed is kept on this device. Press the button again once you&apos;re connected, or call us instead.
          </p>
        </div>
      )}

      {serverError && (
        <div role="alert" className="ux-shake flex items-start gap-3 rounded-lg bg-brick-50 px-4 py-3 text-sm text-brick-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            <strong className="block font-semibold">{serverError}</strong>
            Your details are still here, so you can simply try again. If it keeps failing, message us on Messenger with the same details.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button type="submit" disabled={isSubmitting} className="btn-gold self-start px-8 text-base">
          {isSubmitting && <Loader2 className="size-5 animate-spin" aria-hidden />}
          {isSubmitting ? (slow ? "Still sending…" : "Sending…") : submitLabel}
        </button>
        {isSubmitting && (
          <div className="ux-in flex max-w-md flex-col gap-1.5" role="status" aria-live="polite">
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              {progress && progress.total > 1 ? (
                <div className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300 transition-[width] duration-500" style={{ width: `${Math.max(8, ((progress.done + 0.5) / progress.total) * 100)}%` }} />
              ) : (
                <div className="ux-indeterminate h-full w-2/5 rounded-full bg-gold-500" />
              )}
            </div>
            <span className="text-[13px] text-gray-600">
              {progress?.label ?? "Sending your request"}…{" "}
              {slow && <strong className="font-semibold text-navy-800">Your connection seems slow. Please keep this page open; it will finish.</strong>}
            </span>
          </div>
        )}
      </div>
    </form>
  );
}

function Field({ label, name, error, hint, required, children }: { label: string; name: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="field-label">
      <span>
        {label}
        {required && (
          <span className="ml-0.5 text-brick-600" aria-hidden>
            *
          </span>
        )}
      </span>
      {children}
      {hint && !error && <span className="text-[13px] font-normal text-gray-500">{hint}</span>}
      <FieldMessage id={`${name}-error`} error={error} />
    </label>
  );
}

/** The mistake, right under the field, in plain words. */
function FieldMessage({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <span id={id} key={error} className="field-error ux-in flex items-start gap-1.5 text-brick-700">
      <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
      {error}
    </span>
  );
}
