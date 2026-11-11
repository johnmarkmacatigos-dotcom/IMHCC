import { SuccessBadge } from "./Celebrate";

/** Right after a project is created: celebrate, then show the three steps to get it on the website. */
export function CreatedPanel({ published }: { published: boolean }) {
  const steps = [
    { title: "Add photos", text: "Upload before, during, and after shots in the Photos box below." },
    { title: "Pick a cover", text: "Choose the best photo as the cover. It's what visitors see first." },
    { title: published ? "It's live" : "Switch on Published", text: published ? "Already on the website. Share the link on Facebook." : "Tick Published in Details and save, and it appears on the website." },
  ];
  return (
    <section role="status" className="ux-in relative flex flex-col gap-5 overflow-hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#3f9b66]/40 sm:flex-row sm:items-center sm:p-6">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold-500 via-[#3f9b66] to-gold-500" aria-hidden />
      <div className="flex items-center gap-4 sm:w-64 sm:shrink-0">
        <SuccessBadge size={56} />
        <div>
          <h2 className="text-xl">Project created!</h2>
          <p className="text-sm text-gray-600">Here&apos;s what&apos;s next.</p>
        </div>
      </div>
      <ol className="grid flex-1 gap-3 sm:grid-cols-3">
        {steps.map((st, i) => (
          <li key={st.title} className="ux-in flex gap-3 rounded-xl bg-mist p-3.5" style={{ animationDelay: `${250 + i * 120}ms` }}>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gold-500 text-sm font-semibold text-navy-900">{i + 1}</span>
            <span className="flex flex-col">
              <span className="font-semibold text-navy-800">{st.title}</span>
              <span className="text-[13px] leading-snug text-gray-600">{st.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
