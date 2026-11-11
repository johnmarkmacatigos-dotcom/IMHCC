import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { PublicChrome } from "@/components/site/PublicChrome";
import { StatePanel } from "@/components/states/StatePanel";

export default function NotFound() {
  return (
    <PublicChrome>
      <div className="container-site py-16 sm:py-24">
        <StatePanel
          tone="search"
          icon={MapPinOff}
          eyebrow="Page not found"
          title="We couldn't find that page"
          size="lg"
          tips={["The link may be old, or the project was unpublished.", "Check the address for a typo, or pick one of these instead."]}
          actions={
            <>
              <Link href="/" className="btn-navy">
                Go to the homepage
              </Link>
              <Link href="/projects" className="btn-outline">
                See our projects
              </Link>
              <Link href="/hardware" className="btn-outline">
                Browse hardware
              </Link>
              <Link href="/quote" className="btn-gold">
                Get a free quote
              </Link>
            </>
          }
        />
      </div>
    </PublicChrome>
  );
}
