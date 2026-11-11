/** Shown instantly while a dashboard page fetches its data. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <div className="admin-skeleton h-8 w-56 rounded-lg" />
        <div className="admin-skeleton h-4 w-80 max-w-full rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <div className="admin-skeleton h-8 w-14 rounded" />
            <div className="admin-skeleton mt-2 h-3.5 w-32 max-w-full rounded" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="admin-skeleton h-10 rounded-lg" style={{ opacity: 1 - i * 0.15 }} />
        ))}
      </div>
    </div>
  );
}
