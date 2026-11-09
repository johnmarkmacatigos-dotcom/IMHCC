import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminForm, TextField } from "@/components/admin/Form";
import { AuthCard } from "@/components/admin/AuthCard";
import { NotConnected } from "@/components/admin/NotConnected";
import { getSession } from "@/lib/admin/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { signIn } from "../auth-actions";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!isSupabaseConfigured) return <NotConnected />;
  if (await getSession()) redirect("/admin");
  const { next } = await searchParams;
  return (
    <AuthCard
      title="Sign in to the dashboard"
      intro="For the Iloilo Modern Homes team."
      footer={
        <>
          New team member?{" "}
          <Link href="/admin/signup" className="font-semibold text-navy-800 underline">
            Create your account
          </Link>
          , then ask the owner to switch on your access.
        </>
      }
    >
      <AdminForm action={signIn} submitLabel="Sign in">
        <input type="hidden" name="next" value={next ?? ""} />
        <TextField name="email" label="Email" type="email" inputMode="email" required />
        <TextField name="password" label="Password" type="password" required />
      </AdminForm>
    </AuthCard>
  );
}
