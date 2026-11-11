"use client";

import "./globals.css";

/** Last line of defence: shown only if the whole site layout fails. Kept plain on purpose. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center bg-mist px-4 py-10 font-sans">
        <main className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brick-600 via-gold-500 to-brick-600" aria-hidden />
          <p className="mx-auto mb-3 inline-block rounded-full bg-brick-600 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.1em] text-white">Something went wrong</p>
          <h1 className="text-2xl text-navy-800">Sorry, the website didn&apos;t load properly</h1>
          <p className="mt-2 text-[15px] text-gray-600">It&apos;s on our side. Please try again, or call us and we&apos;ll help right away.</p>
          <div className="mt-6 flex flex-col gap-2.5">
            <button type="button" onClick={reset} className="btn-gold">
              Try again
            </button>
            <a href="tel:09173843099" className="btn-outline">
              Call 0917 384 3099
            </a>
          </div>
          {error.digest && <p className="mt-4 font-mono text-[13px] text-gray-400">Error code: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
