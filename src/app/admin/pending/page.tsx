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
      intro="Ask the owner or an admin to open Dashboard, then Team, and switch on your access. Then sign in again."
    >
      <form action={signOut}>
        <button className="btn-outline">Sign out</button>
      </form>
    </AuthCard>
  );
}
