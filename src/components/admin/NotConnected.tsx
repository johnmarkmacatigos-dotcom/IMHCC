import { AuthCard } from "./AuthCard";

/** Shown on /admin while the Supabase project is not connected yet. */
export function NotConnected() {
  return (
    <AuthCard
      title="The dashboard is almost ready"
      intro="It needs the database to be connected first. Once the Supabase project is set up and its two keys are added to the hosting settings, this page becomes the sign-in screen."
    >
      <ol className="list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-gray-700">
        <li>Create the Supabase project and run the setup files (see the README).</li>
        <li>Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the hosting settings.</li>
        <li>Redeploy, then create the owner account here.</li>
      </ol>
    </AuthCard>
  );
}
