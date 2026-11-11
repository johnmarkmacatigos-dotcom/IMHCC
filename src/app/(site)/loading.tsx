/** Shown instantly while a public page loads: the page's shape, gently shimmering. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading page">
      <div className="bg-navy-800">
        <div className="container-site flex flex-col gap-4 py-16">
          <div className="h-6 w-36 rounded-full bg-white/15" />
          <div className="h-10 w-full max-w-xl rounded-lg bg-white/15" />
          <div className="h-4 w-full max-w-md rounded bg-white/10" />
        </div>
        <div className="h-1 bg-gradient-to-r from-gold-500 via-gold-300 to-gold-500" />
      </div>
      <div className="container-site grid gap-x-5 gap-y-9 py-14 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3" style={{ opacity: 1 - i * 0.1 }}>
            <div className="ux-skeleton aspect-[4/3] rounded-xl" />
            <div className="ux-skeleton h-5 w-3/4 rounded" />
            <div className="ux-skeleton h-4 w-1/2 rounded" />
          </div>
        ))}
      </div>
      <p className="sr-only" role="status">
        Loading…
      </p>
    </div>
  );
}
