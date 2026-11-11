"use client";

import { useId, useState } from "react";

const DEVELOPER_PHONE = "+639454768066";
const DEVELOPER_EMAIL = "johnmarkmacatigos@gmail.com";

/** Small developer-credit strip shown under the public site footer. */
export function DeveloperCredit() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="border-t border-[#1e3352] bg-navy-950 pt-4 pb-28 text-center text-[12px] text-[#8fa0b5]">
      <p className="font-semibold tracking-[0.2em] text-gold-300">
        <span aria-hidden="true">🌶️</span> SPYCE PROJECT
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="mt-2 inline-flex items-center gap-1 rounded-full border border-brick-600/70 px-3 py-1 text-[11px] font-medium text-[#e3e8ee] transition-colors hover:border-brick-500 hover:bg-brick-600/20"
      >
        Contact Developer
        <span aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      <div id={panelId} hidden={!open} className="mt-2">
        <div className="inline-flex flex-col items-center gap-1 rounded-lg bg-navy-900 px-4 py-2 sm:flex-row sm:gap-4">
          <a href={`tel:${DEVELOPER_PHONE}`} className="hover:text-white">
            <span className="text-gold-300">Phone:</span> {DEVELOPER_PHONE}
          </a>
          <a href={`mailto:${DEVELOPER_EMAIL}`} className="break-all hover:text-white">
            <span className="text-gold-300">Email:</span> {DEVELOPER_EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}
