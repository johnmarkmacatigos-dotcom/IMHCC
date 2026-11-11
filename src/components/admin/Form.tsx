"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertCircle, Check, CheckCircle2, History, Loader2, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { clearDraft, markDraftSubmitted, readDraft, takeSubmittedFlag, useDraftAutosave, applyDraft } from "@/lib/drafts";
import { clearPendingToast, toast, toastAfterNavigation } from "./motion";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
  /** A milestone worth celebrating (for example a job won): confetti toast plus the next step. */
  celebrate?: { title: string; next?: { href: string; label: string } };
};
type Action = (state: FormState, fd: FormData) => Promise<FormState>;

/**
 * Wraps a server action: shows the error or success message, and passes field errors
 * down to <Field> through a data attribute lookup.
 */
export function AdminForm({
  action,
  children,
  className,
  submitLabel = "Save",
  resetOnSuccess = false,
  redirectToast = "Saved.",
  keepDraft,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  submitLabel?: string;
  resetOnSuccess?: boolean;
  /** Toast to show if the action moves to another page instead of answering. false for sign-in forms. */
  redirectToast?: string | false;
  /**
   * Keep what the user types on this device until it is saved, so a lost connection or an
   * expired sign-in never loses their work. On by default except for sign-in forms.
   */
  keepDraft?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [offlineError, setOfflineError] = useState(false);
  const [restored, setRestored] = useState<number | null>(null);
  const initial = useRef(state);
  const pathname = usePathname();
  const id = useId();
  const draftsOn = keepDraft ?? redirectToast !== false;
  const draftKey = `${pathname}${id}`;

  useDraftAutosave(ref, draftKey, draftsOn);

  // Bring back unsaved work from an earlier visit (for example, after signing in again).
  useEffect(() => {
    if (!draftsOn || !ref.current) return;
    if (takeSubmittedFlag(draftKey)) {
      clearDraft(draftKey);
      return;
    }
    const d = readDraft(draftKey);
    if (d && applyDraft(ref.current, d)) setRestored(d.at);
  }, [draftsOn, draftKey]);

  useEffect(() => {
    if (state === initial.current) return;
    // The action answered here (no redirect), so any toast queued for a page change is not needed.
    clearPendingToast();
    takeSubmittedFlag(draftKey);
    if (state.message && resetOnSuccess) ref.current?.reset();
    if (state.message) {
      clearDraft(draftKey);
      setRestored(null);
      if (state.celebrate) toast(state.celebrate.title, "celebrate", state.celebrate.next);
      else toast(state.message);
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 1800);
      return () => clearTimeout(t);
    }
    if (state.error) {
      ref.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
    }
  }, [state, resetOnSuccess, draftKey]);

  return (
    <form
      ref={ref}
      // Submitting through a transition (not the form "action" prop) keeps what the user typed
      // on screen after saving, instead of React resetting the fields to their old values.
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        // Check the fields in the browser first, so mistakes are flagged right where they are.
        const invalid = Array.from(form.elements).filter(
          (el): el is HTMLInputElement => "checkValidity" in el && !(el as HTMLInputElement).checkValidity(),
        );
        if (invalid.length > 0) {
          invalid.forEach((el) => el.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));
          invalid[0].focus();
          return;
        }
        if (!navigator.onLine) {
          setOfflineError(true);
          return;
        }
        setOfflineError(false);
        if (draftsOn) markDraftSubmitted(draftKey);
        const fd = new FormData(form);
        // Actions that create or save and then open another page never answer the form, so the
        // confirmation is handed over to the next page.
        if (redirectToast) toastAfterNavigation(redirectToast);
        startTransition(() => formAction(fd));
      }}
      className={cn("flex flex-col gap-5", className)}
      noValidate
    >
      {restored && (
        <div role="status" className="ux-in flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-gold-100 px-4 py-3 text-sm text-gold-700">
          <History className="size-4 shrink-0" aria-hidden />
          <span className="flex-1 font-medium">
            We brought back what you typed before ({new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(restored)}). It isn&apos;t
            saved yet, so press {submitLabel} to keep it.
          </span>
          <button
            type="button"
            className="font-semibold text-navy-800 underline underline-offset-2"
            onClick={() => {
              clearDraft(draftKey);
              setRestored(null);
              ref.current?.reset();
            }}
          >
            Discard
          </button>
        </div>
      )}
      <FieldErrors.Provider value={state.fieldErrors ?? {}}>{children}</FieldErrors.Provider>
      {offlineError && (
        <p role="alert" className="admin-shake flex items-start gap-2 rounded-lg bg-navy-100 px-4 py-3 text-sm font-medium text-navy-800">
          <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden />
          You&apos;re offline, so this wasn&apos;t saved yet. What you typed is kept on this device. Press {submitLabel} again once you&apos;re back online.
        </p>
      )}
      {state.error && (
        <p key={JSON.stringify(state)} role="alert" className="admin-shake flex items-start gap-2 rounded-lg bg-brick-50 px-4 py-3 text-sm font-medium text-brick-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="admin-page-in flex items-center gap-2 rounded-lg bg-[#e7f3ec] px-4 py-3 text-sm font-medium text-[#1e6b3e]">
          <CheckCircle2 className="admin-pop size-4" aria-hidden /> {state.message}
        </p>
      )}
      <div>
        <SubmitButton pending={pending} saved={justSaved && !pending}>
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}

const FieldErrors = createContext<Record<string, string>>({});

export function SubmitButton({ children, className, pending, saved }: { children: React.ReactNode; className?: string; pending: boolean; saved?: boolean }) {
  const slow = useSlowFlag(pending, 5000);
  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className={cn("btn-navy relative min-w-32 overflow-hidden", saved && "bg-gold-500 text-navy-900 hover:bg-gold-500", className)}
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {saved && <Check key="saved" className="admin-pop size-4" strokeWidth={3} aria-hidden />}
        {pending ? (slow ? "Still saving…" : "Saving…") : saved ? "Saved" : children}
        {pending && (
          <span className="absolute inset-x-0 bottom-0 h-[3px] overflow-hidden bg-white/15" aria-hidden>
            <span className="ux-indeterminate absolute inset-y-0 left-0 w-2/5 bg-gold-300" />
          </span>
        )}
      </button>
      {slow && (
        <span role="status" className="ux-in text-[13px] text-gray-600">
          Slow connection. Keep this page open; it will finish by itself.
        </span>
      )}
    </span>
  );
}

/** Turns true once `active` has stayed true for `ms`, so we only mention slowness when it's real. */
export function useSlowFlag(active: boolean, ms: number) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) {
      setSlow(false);
      return;
    }
    const t = setTimeout(() => setSlow(true), ms);
    return () => clearTimeout(t);
  }, [active, ms]);
  return slow;
}

type FieldProps = {
  name: string;
  label: string;
  hint?: string;
  className?: string;
};

function useFieldError(name: string) {
  return useContext(FieldErrors)[name];
}

/** Plain-words message for what the browser found wrong with a field. */
function browserMessage(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, label: string) {
  const v = el.validity;
  if (v.valueMissing) return `${label} is required.`;
  if (v.typeMismatch && el.type === "email") return "Enter a valid email, like name@email.com.";
  if (v.typeMismatch && el.type === "url") return "Enter a full link starting with https://";
  if (v.badInput || v.stepMismatch) return "Enter a number.";
  if (v.rangeUnderflow) return `Use ${(el as HTMLInputElement).min} or more.`;
  if (v.rangeOverflow) return `Use ${(el as HTMLInputElement).max} or less.`;
  if (v.tooLong) return `Keep this under ${(el as HTMLInputElement).maxLength} characters.`;
  if (v.patternMismatch) return el.title || "Check the format.";
  return el.validationMessage || null;
}

/**
 * The error shown under a field: the server's message after saving, or the browser's own
 * check as soon as the user leaves the field. Typing a fix clears it straight away.
 */
function useLiveError(name: string, label: string) {
  const server = useFieldError(name);
  const [local, setLocal] = useState<string | null>(null);
  const [fixedServer, setFixedServer] = useState<string | undefined>(undefined);
  useEffect(() => setFixedServer(undefined), [server]);
  const error = local ?? (server && fixedServer !== server ? server : undefined);
  return {
    error,
    props: {
      onBlur: (e: { currentTarget: EventTarget }) => setLocal(browserMessage(e.currentTarget as HTMLInputElement, label)),
      onInput: (e: { currentTarget: EventTarget }) => {
        if (server) setFixedServer(server);
        if (local) setLocal(browserMessage(e.currentTarget as HTMLInputElement, label));
      },
      "aria-invalid": error ? true : undefined,
    },
  };
}

export function FieldMessage({ error, id }: { error?: string | null; id?: string }) {
  if (!error) return null;
  return (
    <span id={id} key={error} className="field-error ux-in flex items-start gap-1.5 text-brick-700">
      <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
      {error}
    </span>
  );
}

function Wrap({ label, hint, className, children, error, required }: FieldProps & { children: React.ReactNode; error?: string; required?: boolean }) {
  return (
    <label className={cn("field-label", className)}>
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
      <FieldMessage error={error} />
    </label>
  );
}

export function TextField({
  defaultValue,
  type = "text",
  required,
  placeholder,
  inputMode,
  step,
  ...p
}: FieldProps & {
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  step?: string;
}) {
  const live = useLiveError(p.name, p.label);
  return (
    <Wrap {...p} error={live.error} required={required}>
      <input
        name={p.name}
        type={type}
        step={step}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        {...live.props}
        className="field-input"
      />
    </Wrap>
  );
}

export function TextArea({
  defaultValue,
  rows = 4,
  placeholder,
  required,
  ...p
}: FieldProps & { defaultValue?: string | null; rows?: number; placeholder?: string; required?: boolean }) {
  const live = useLiveError(p.name, p.label);
  return (
    <Wrap {...p} error={live.error} required={required}>
      <textarea
        name={p.name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        {...live.props}
        className="field-input resize-y"
      />
    </Wrap>
  );
}

/** One item per line; saved as a list (for example, scope of work). */
export function ListField({ defaultValue, ...p }: FieldProps & { defaultValue?: string[] | null }) {
  return <TextArea {...p} rows={5} defaultValue={(defaultValue ?? []).join("\n")} hint={p.hint ?? "One item per line."} />;
}

export function SelectField({
  defaultValue,
  options,
  ...p
}: FieldProps & { defaultValue?: string | null; options: { value: string; label: string }[] }) {
  const live = useLiveError(p.name, p.label);
  return (
    <Wrap {...p} error={live.error}>
      <select name={p.name} defaultValue={defaultValue ?? ""} {...live.props} className="field-input">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrap>
  );
}

export function CheckField({ name, label, hint, defaultChecked }: { name: string; label: string; hint?: string; defaultChecked?: boolean }) {
  const error = useFieldError(name);
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-start gap-3 text-[15px] text-gray-800">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-5 shrink-0 accent-navy-800" />
        <span>
          <span className="font-semibold">{label}</span>
          {hint && <span className="block text-[13px] text-gray-500">{hint}</span>}
        </span>
      </label>
      <FieldMessage error={error} />
    </div>
  );
}
