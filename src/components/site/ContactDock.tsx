import { MessageCircle, Phone } from "lucide-react";
import { telHref } from "@/lib/utils";

/** Floating click-to-call and Messenger buttons, most useful on phones. */
export function ContactDock({ phone, messengerUrl }: { phone: string | null; messengerUrl: string | null }) {
  if (!phone && !messengerUrl) return null;
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-3">
      {messengerUrl && (
        <a
          href={messengerUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Message us on Messenger"
          className="flex size-14 items-center justify-center rounded-full bg-navy-800 text-white shadow-lg ring-2 ring-white hover:bg-navy-700"
        >
          <MessageCircle className="size-6" aria-hidden />
        </a>
      )}
      {phone && (
        <a
          href={telHref(phone)}
          aria-label={`Call ${phone}`}
          className="flex size-14 items-center justify-center rounded-full bg-gold-500 text-navy-800 shadow-lg ring-2 ring-white hover:bg-gold-300"
        >
          <Phone className="size-6" aria-hidden />
        </a>
      )}
    </div>
  );
}
