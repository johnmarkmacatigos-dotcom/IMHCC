"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";
import { toastAfterNavigation } from "./motion";

/** Delete button that asks first, in a dialog that eases in, then confirms with a toast. */
export function DeleteButton({ action, id, label = "Delete", confirm }: { action: (fd: FormData) => Promise<void>; id: string; label?: string; confirm: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="admin-press inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold text-brick-600 hover:bg-brick-50"
      >
        <Trash2 className="size-4" aria-hidden /> {label}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={`del-${id}`}
        className="admin-dialog m-auto w-[min(92vw,420px)] rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <div className="flex gap-4">
          <span className="admin-pop flex size-11 shrink-0 items-center justify-center rounded-full bg-brick-50 text-brick-600">
            <Trash2 className="size-5" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <h2 id={`del-${id}`} className="text-lg">
              Are you sure?
            </h2>
            <p className="text-[15px] text-gray-600">{confirm}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" autoFocus onClick={() => dialog.current?.close()} className="btn-outline px-5">
            Keep it
          </button>
          <ConfirmDelete label={label} />
        </div>
      </dialog>
    </form>
  );
}

function ConfirmDelete({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={() => toastAfterNavigation("Deleted.")}
      className="admin-press btn bg-brick-600 px-5 text-white hover:bg-brick-700"
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
      {pending ? "Deleting…" : label}
    </button>
  );
}
