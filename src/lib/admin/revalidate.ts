import "server-only";
import { revalidatePath } from "next/cache";

/** Refreshes the public website and the dashboard after a content change. */
export function refreshSite() {
  revalidatePath("/", "layout");
}
