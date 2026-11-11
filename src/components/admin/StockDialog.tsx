"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, Loader2, Minus, Plus } from "lucide-react";
import { recordMovement } from "@/app/admin/(dashboard)/inventory/actions";
import { cn } from "@/lib/utils";
import { formatQty, moveReasons, moveTypes, type MoveType } from "@/lib/inventory";
import type { FormState } from "./Form";
import { toast } from "./motion";

type Item = { id: string; name: string; unit: string; quantity: number };
type Project = { id: string; title: string };

const typeIcon = { in: ArrowDownToLine, out: ArrowUpFromLine, adjust: ClipboardCheck } as const;
const shortLabel = { in: "Stock in", out: "Stock out", adjust: "Recount" } as const;

/**
 * Stock in / stock out / count correction, in a dialog that eases in. Shows what the stock
 * will be after saving while you type, then confirms with a toast.
 */
export function StockDialog({
  item,
  initialType = "in",
  canAdjust,
  projects = [],
  trigger = "button",
}: {
  item: Item;
  initialType?: MoveType;
  canAdjust: boolean;
  projects?: Project[];
  trigger?: "button" | "plus" | "minus";
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const [type, setType] = useState<MoveType>(initialType);
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [state, action, pending] = useActionState<FormState, FormData>(recordMovement, {});
  const first = useRef(state);

  useEffect(() => {
    if (state === first.current) return;
    if (state.message) {
      toast(state.message);
      dialog.current?.close();
    }
  }, [state]);

  const open = () => {
    setType(initialType);
    setQty("");
    setReason("");
    first.current = state;
    dialog.current?.showModal();
  };

  const n = Number(qty.replace(/,/g, ""));
  const valid = qty.trim() !== "" && Number.isFinite(n) && n >= 0 && (type === "adjust" || n > 0);
  const after = !valid ? null : type === "in" ? item.quantity + n : type === "out" ? item.quantity - n : n;
  const tooMany = after !== null && after < 0;
  const step = (d: number) => setQty(String(Math.max(0, (Number.isFinite(n) ? n : 0) + d)));
  const types = (Object.keys(moveTypes) as MoveType[]).filter((t) => t !== "adjust" || canAdjust);

  return (
    <>
      {trigger === "button" ? (
        <button type="button" onClick={open} className="btn-gold">
          <ArrowDownToLine className="size-4" aria-hidden /> Record stock
        </button>
      ) : (
        <button
          type="button"
          onClick={open}
          aria-label={`${trigger === "plus" ? "Stock in" : "Stock out"}: ${item.name}`}
          title={trigger === "plus" ? "Stock in" : "Stock out"}
          className={cn(
            "admin-press flex size-10 items-center justify-center rounded-lg",
            trigger === "plus" ? "bg-navy-800 text-white hover:bg-navy-700" : "text-brick-600 ring-1 ring-gray-300 hover:bg-brick-50",
          )}
        >
          {trigger === "plus" ? <Plus className="size-4" strokeWidth={2.5} aria-hidden /> : <Minus className="size-4" strokeWidth={2.5} aria-hidden />}
        </button>
      )}

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="admin-dialog m-auto w-[min(94vw,480px)] rounded-2xl bg-white p-0 text-left shadow-2xl"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <form
          ref={form}
          noValidate
          className="flex flex-col gap-5 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(() => action(fd));
          }}
        >
          <input type="hidden" name="item_id" value={item.id} />
          <input type="hidden" name="type" value={type} />
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-xl">
              {item.name}
            </h2>
            <p className="text-sm text-gray-600">
              On hand now: <strong className="text-navy-800">{formatQty(item.quantity)}</strong> {item.unit}
            </p>
          </div>

          <div role="radiogroup" aria-label="What happened" className={cn("grid gap-1 rounded-xl bg-mist p-1", types.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
            {types.map((t) => {
              const Icon = typeIcon[t];
              const on = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    setType(t);
                    setReason("");
                  }}
                  className={cn(
                    "admin-press flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors",
                    on ? (t === "out" ? "bg-brick-600 text-white shadow" : t === "in" ? "bg-navy-800 text-white shadow" : "bg-gold-500 text-navy-900 shadow") : "text-gray-600 hover:text-navy-800",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", on && "admin-pop")} aria-hidden /> {shortLabel[t]}
                </button>
              );
            })}
          </div>

          <div className="field-label">
            <label htmlFor={`${titleId}-q`}>{type === "adjust" ? `Counted quantity (${item.unit})` : `Quantity (${item.unit})`}</label>
            <div className="flex items-stretch gap-2">
              <button type="button" onClick={() => step(-1)} className="admin-press flex w-12 items-center justify-center rounded-lg ring-1 ring-gray-300 hover:bg-mist" aria-label="Less">
                <Minus className="size-4" aria-hidden />
              </button>
              <input
                id={`${titleId}-q`}
                name="quantity"
                inputMode="decimal"
                autoFocus
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
                aria-invalid={state.fieldErrors?.quantity || tooMany ? true : undefined}
                className="field-input flex-1 text-center font-display text-2xl font-semibold"
              />
              <button type="button" onClick={() => step(1)} className="admin-press flex w-12 items-center justify-center rounded-lg ring-1 ring-gray-300 hover:bg-mist" aria-label="More">
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
            {state.fieldErrors?.quantity && <span className="field-error">{state.fieldErrors.quantity}</span>}
          </div>

          <p
            key={`${type}-${after}`}
            aria-live="polite"
            className={cn(
              "admin-pop flex items-center justify-between rounded-lg px-4 py-3 text-sm",
              tooMany ? "bg-brick-50 font-semibold text-brick-700" : "bg-navy-100 text-navy-800",
              after === null && "opacity-60",
            )}
          >
            <span>{tooMany ? `Only ${formatQty(item.quantity)} ${item.unit} in stock` : "On hand after this"}</span>
            {!tooMany && (
              <strong className="font-display text-lg">
                {after === null ? "–" : formatQty(after)} <span className="text-sm font-normal">{item.unit}</span>
              </strong>
            )}
          </p>

          <div className="field-label">
            <label htmlFor={`${titleId}-r`}>Reason</label>
            <div className="flex flex-wrap gap-1.5">
              {moveReasons[type].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={cn(
                    "admin-press min-h-9 rounded-full px-3 text-[13px] font-medium",
                    reason === r ? "bg-navy-800 text-white" : "bg-white text-navy-800 ring-1 ring-gray-300 hover:bg-navy-100",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <input id={`${titleId}-r`} name="reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={80} placeholder="Or type a reason" className="field-input" />
          </div>

          {type === "out" && projects.length > 0 && (
            <label className="field-label">
              Project (optional)
              <select name="project_id" defaultValue="" className="field-input">
                <option value="">Not for a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">
              Reference (optional)
              <input name="reference" maxLength={120} placeholder={type === "in" ? "Delivery receipt no." : "Job or receipt no."} className="field-input" />
            </label>
            {type === "in" ? (
              <label className="field-label">
                Cost per unit (₱, optional)
                <input name="unit_cost" inputMode="decimal" placeholder="265" className="field-input" />
              </label>
            ) : (
              <label className="field-label">
                Note (optional)
                <input name="note" maxLength={500} className="field-input" />
              </label>
            )}
          </div>

          {state.error && (
            <p key={JSON.stringify(state)} role="alert" className="admin-shake rounded-lg bg-brick-50 px-4 py-3 text-sm font-medium text-brick-700">
              {Object.entries(state.fieldErrors ?? {}).find(([k]) => k !== "quantity")?.[1] ?? state.error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => dialog.current?.close()} className="btn-outline px-5">
              Cancel
            </button>
            <button type="submit" disabled={pending || !valid || tooMany} className={cn("btn min-w-36 px-5 disabled:opacity-50", type === "out" ? "bg-brick-600 text-white hover:bg-brick-700" : type === "in" ? "btn-navy" : "btn-gold")}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {pending ? "Saving…" : type === "in" ? "Add to stock" : type === "out" ? "Take from stock" : "Set count"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

/** The level bar: fills toward the right, with a thin red line where reordering starts. */
export function StockMeter({ fill, mark, state, index = 0 }: { fill: number; mark: number | null; state: "ok" | "low" | "out"; index?: number }) {
  return (
    <span className="relative block h-1.5 w-full overflow-visible rounded-full bg-gray-200" aria-hidden>
      <span
        className={cn("admin-bar-x absolute inset-y-0 left-0 rounded-full", state === "ok" ? "bg-navy-800" : state === "low" ? "bg-gold-500" : "bg-brick-600")}
        style={{ width: `${Math.max(fill * 100, state === "out" ? 0 : 3)}%`, ["--i" as string]: index }}
      />
      {mark !== null && <span className="absolute -inset-y-0.5 w-0.5 rounded-full bg-brick-600/60" style={{ left: `${mark * 100}%` }} />}
    </span>
  );
}

export function MoveIcon({ type }: { type: MoveType }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg font-display text-base font-bold",
        type === "in" ? "bg-[#e7f3ec] text-[#1e6b3e]" : type === "out" ? "bg-brick-50 text-brick-600" : "bg-gold-100 text-gold-700",
      )}
      role="img"
      aria-label={type === "in" ? "Stock in" : type === "out" ? "Stock out" : "Count correction"}
    >
      {type === "in" ? "+" : type === "out" ? "−" : "="}
    </span>
  );
}
