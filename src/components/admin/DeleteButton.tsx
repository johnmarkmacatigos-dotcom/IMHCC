"use client";

import { Trash2 } from "lucide-react";

/** Small form that asks before deleting. */
export function DeleteButton({ action, id, label = "Delete", confirm }: { action: (fd: FormData) => Promise<void>; id: string; label?: string; confirm: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold text-red-700 hover:bg-red-50">
        <Trash2 className="size-4" aria-hidden /> {label}
      </button>
    </form>
  );
}
