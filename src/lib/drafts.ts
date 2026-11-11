"use client";

import { useEffect } from "react";

/**
 * Unsaved-work safety net for forms. While someone types, the form's text fields are copied to
 * this device (localStorage). If the connection drops or the sign-in expires before they press
 * Save, the copy is still there and is put back the next time the form opens. A copy is removed
 * once the save goes through. Passwords and files are never stored.
 */

const PREFIX = "imhcc:draft:";
const SUBMITTED = "imhcc:draft-submitted";
const MAX_AGE = 7 * 86_400_000;

export type Draft = { at: number; names: string[]; values: Record<string, string | boolean> };

type FieldEl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function fields(form: HTMLFormElement): FieldEl[] {
  return Array.from(form.elements).filter((el): el is FieldEl => {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return false;
    if (!el.name || el.name.startsWith("$ACTION") || el.disabled) return false;
    if (el instanceof HTMLInputElement && ["hidden", "password", "file", "submit", "button"].includes(el.type)) return false;
    return true;
  });
}

function snapshot(form: HTMLFormElement): Draft {
  const values: Record<string, string | boolean> = {};
  const list = fields(form);
  for (const el of list) {
    const key = el instanceof HTMLInputElement && el.type === "radio" ? `${el.name}=${el.value}` : el.name;
    values[key] = el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio") ? el.checked : el.value;
  }
  return { at: Date.now(), names: [...new Set(list.map((el) => el.name))].sort(), values };
}

function isDirty(form: HTMLFormElement) {
  return fields(form).some((el) => {
    if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) return el.checked !== el.defaultChecked;
    if (el instanceof HTMLSelectElement) return Array.from(el.options).some((o) => o.selected !== o.defaultSelected);
    return el.value !== el.defaultValue;
  });
}

export function readDraft(key: string): Draft | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    if (Date.now() - d.at > MAX_AGE) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return d;
  } catch {
    return null;
  }
}

export function clearDraft(key: string) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {}
}

/** Puts a saved copy back into the form. Returns false (and does nothing) if the form changed shape. */
export function applyDraft(form: HTMLFormElement, d: Draft) {
  const now = snapshot(form);
  if (now.names.join("|") !== d.names.join("|")) return false;
  let changed = false;
  for (const el of fields(form)) {
    const isToggle = el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio");
    const key = el instanceof HTMLInputElement && el.type === "radio" ? `${el.name}=${el.value}` : el.name;
    const v = d.values[key];
    if (v === undefined) continue;
    if (isToggle) {
      if ((el as HTMLInputElement).checked !== v) {
        (el as HTMLInputElement).checked = Boolean(v);
        changed = true;
      }
    } else if (el.value !== v) {
      el.value = String(v);
      changed = true;
    }
  }
  return changed;
}

/** Copies the form to this device as the user types (only once they actually change something). */
export function useDraftAutosave(ref: React.RefObject<HTMLFormElement | null>, key: string, enabled: boolean) {
  useEffect(() => {
    const form = ref.current;
    if (!enabled || !form) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      try {
        if (isDirty(form)) localStorage.setItem(PREFIX + key, JSON.stringify(snapshot(form)));
      } catch {}
    };
    const onChange = () => {
      clearTimeout(timer);
      timer = setTimeout(save, 400);
    };
    form.addEventListener("input", onChange);
    form.addEventListener("change", onChange);
    // Also save right away when the tab is hidden or closed.
    const onHide = () => document.visibilityState === "hidden" && save();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", save);
    window.addEventListener("imhcc:save-drafts", save);
    return () => {
      clearTimeout(timer);
      form.removeEventListener("input", onChange);
      form.removeEventListener("change", onChange);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", save);
      window.removeEventListener("imhcc:save-drafts", save);
    };
  }, [ref, key, enabled]);
}

/** Saves every open form's draft right now (used just before an expired session signs out). */
export function saveAllDrafts() {
  window.dispatchEvent(new Event("imhcc:save-drafts"));
}

/** Remembers that this form was sent, so the next page can drop its draft if the save went through. */
export function markDraftSubmitted(key: string) {
  try {
    sessionStorage.setItem(SUBMITTED, key);
  } catch {}
}

/** Reads and forgets the "just sent" marker. With a key, only takes it if it belongs to that form. */
export function takeSubmittedFlag(key?: string): string | null {
  try {
    const v = sessionStorage.getItem(SUBMITTED);
    if (!v || (key && v !== key)) return null;
    sessionStorage.removeItem(SUBMITTED);
    return v;
  } catch {
    return null;
  }
}

/** The sign-in page calls this: a send that ended on the sign-in page did not save. */
export function forgetSubmittedFlag() {
  try {
    sessionStorage.removeItem(SUBMITTED);
  } catch {}
}

/** Number of unsaved drafts on this device (shown in the "session expired" message). */
export function countDrafts() {
  try {
    let n = 0;
    for (let i = 0; i < localStorage.length; i++) if (localStorage.key(i)?.startsWith(PREFIX)) n++;
    return n;
  } catch {
    return 0;
  }
}
