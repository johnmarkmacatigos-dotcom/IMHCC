"use client";

import { ErrorScreen } from "@/components/states/ErrorScreen";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen error={error} reset={reset} area="site" />;
}
