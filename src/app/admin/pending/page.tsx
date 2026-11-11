import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/AuthCard";
import { getSession } from "@/lib/admin/session";
import { signOut } from "../auth-actions";

export const metadata = { title: "Waiting for access" };

export default async function PendingPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.profile?.is_active) redirect("/admin");
  return (
    <AuthCard
      title="Your account is waiting for approval"
      intro="For safety, new accounts can't see business data until the owner or an admin switches them on."
    >
      <ol className="flex flex-col gap-3 text-[15px] text-gray-700">
        {["Tell the owner or an admin you signed up with this email.", "They open Dashboard → Team and switch on your access.", "Sign out, then sign in again. You'll go straight to the dashboard."].map((t, i) => (
          <li key={t} className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gold-500 text-sm font-semibold text-navy-900">{i + 1}</span>
            <span className="pt-0.5">{t}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2.5">
        <form action={signOut}>
          <button className="btn-navy">Sign out</button>
        </form>
        <Link href="/" className="btn-outline">
          Go to the website
        </Link>
      </div>
    </AuthCard>
  );
}
