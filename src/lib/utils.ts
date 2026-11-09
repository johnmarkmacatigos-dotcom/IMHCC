import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "0917 384 3099" -> "tel:+639173843099" */
export function telHref(phone: string) {
  const digits = phone.replace(/[^0-9+]/g, "");
  if (digits.startsWith("0")) return `tel:+63${digits.slice(1)}`;
  return `tel:${digits}`;
}

export function formatPeso(value: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
}
