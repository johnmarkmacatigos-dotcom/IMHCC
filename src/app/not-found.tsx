import Link from "next/link";
import { PublicChrome } from "@/components/site/PublicChrome";

export default function NotFound() {
  return (
    <PublicChrome>
    <div className="container-site flex flex-col items-start gap-5 py-24">
      <span className="eyebrow">Page not found</span>
      <h1 className="text-4xl">We couldn&apos;t find that page.</h1>
      <p className="text-lg text-gray-600">It may have been moved or unpublished.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className="btn-navy">
          Go to the homepage
        </Link>
        <Link href="/projects" className="btn-outline">
          See our projects
        </Link>
      </div>
    </div>
    </PublicChrome>
  );
}
