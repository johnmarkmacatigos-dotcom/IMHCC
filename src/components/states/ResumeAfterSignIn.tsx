"use client";

import { useEffect } from "react";
import { countDrafts, forgetSubmittedFlag } from "@/lib/drafts";
import { LAST_PATH_KEY } from "./SessionGuard";

/**
 * On the sign-in page: a form send that ended up here did not save, so its draft must be kept.
 * Also fills in "where to go after signing in" with the page the user was on, when the link
 * didn't say, and shows how many unsaved forms are waiting.
 */
export function ResumeAfterSignIn() {
  useEffect(() => {
    forgetSubmittedFlag();
    try {
      const next = document.querySelector<HTMLInputElement>('input[name="next"]');
      const last = sessionStorage.getItem(LAST_PATH_KEY);
      if (next && !next.value && last?.startsWith("/admin")) next.value = last;
    } catch {}
    const n = countDrafts();
    const el = document.getElementById("draft-count");
    if (el && n > 0) {
      el.textContent = n === 1 ? "One unsaved form is waiting for you." : `${n} unsaved forms are waiting for you.`;
      el.hidden = false;
    }
  }, []);
  return null;
}
