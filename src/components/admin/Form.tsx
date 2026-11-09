"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; message?: string };
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
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  submitLabel?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message && resetOnSuccess) ref.current?.reset();
    if (state.error) ref.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      // Submitting through a transition (not the form "action" prop) keeps what the user typed
      // on screen after saving, instead of React resetting the fields to their old values.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      className={cn("flex flex-col gap-5", className)}
      noValidate
    >
      <FieldErrors.Provider value={state.fieldErrors ?? {}}>{children}</FieldErrors.Provider>
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-[#e7f3ec] px-4 py-3 text-sm font-medium text-[#1e6b3e]">
          <CheckCircle2 className="size-4" aria-hidden /> {state.message}
        </p>
      )}
      <div>
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

const FieldErrors = createContext<Record<string, string>>({});

export function SubmitButton({ children, className, pending }: { children: React.ReactNode; className?: string; pending: boolean }) {
  return (
    <button type="submit" disabled={pending} className={cn("btn-navy", className)}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? "Saving…" : children}
    </button>
  );
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

function Wrap({ name, label, hint, className, children }: FieldProps & { children: React.ReactNode }) {
  const error = useFieldError(name);
  return (
    <label className={cn("field-label", className)}>
      {label}
      {children}
      {hint && !error && <span className="text-[13px] font-normal text-gray-500">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
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
  const error = useFieldError(p.name);
  return (
    <Wrap {...p}>
      <input
        name={p.name}
        type={type}
        step={step}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        className="field-input"
      />
    </Wrap>
  );
}

export function TextArea({ defaultValue, rows = 4, placeholder, ...p }: FieldProps & { defaultValue?: string | null; rows?: number; placeholder?: string }) {
  const error = useFieldError(p.name);
  return (
    <Wrap {...p}>
      <textarea
        name={p.name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
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
  const error = useFieldError(p.name);
  return (
    <Wrap {...p}>
      <select name={p.name} defaultValue={defaultValue ?? ""} aria-invalid={error ? true : undefined} className="field-input">
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
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
