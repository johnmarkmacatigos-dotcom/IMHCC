import { NextResponse } from "next/server";
import { getPublicClient } from "@/lib/supabase/public";
import { notifyNewInquiry } from "@/lib/notify";
import { inquirySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Receives quotation requests, product inquiries, consultation bookings, and contact messages.
 * Validates on the server, then stores the inquiry through the submit_inquiry() database
 * function, which generates the reference number and creates an admin notification.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the highlighted fields.", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  }
  const { website, started_at, ...data } = parsed.data;

  // Bots fill the hidden field or submit instantly. Pretend success so they learn nothing.
  if (website || (started_at && Date.now() - started_at < 2500)) {
    return NextResponse.json({ reference: "RECEIVED" });
  }

  const db = getPublicClient();
  if (!db) {
    return NextResponse.json(
      { error: "Online requests are not connected yet. Please call or message us on Messenger for now." },
      { status: 503 },
    );
  }

  const { data: reference, error } = await db.rpc("submit_inquiry", { payload: data });
  if (error || typeof reference !== "string") {
    console.error("[inquiries] submit failed", error);
    return NextResponse.json({ error: "We could not send your request. Please try again or call us." }, { status: 500 });
  }

  await notifyNewInquiry({ reference, ...data }).catch((e) => console.error("[inquiries] email failed", e));

  return NextResponse.json({ reference });
}
