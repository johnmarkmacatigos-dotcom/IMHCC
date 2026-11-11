import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminForm, TextField } from "@/components/admin/Form";
import { AuthCard } from "@/components/admin/AuthCard";
import { NotConnected } from "@/components/admin/NotConnected";
import { ResumeAfterSignIn } from "@/components/states/ResumeAfterSignIn";
import { History } from "lucide-react";
import { getSession } from "@/lib/admin/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { signIn } from "../auth-actions";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; confirmed?: string; expired?: string }> }) {
  if (!isSupabaseConfigured) return <NotConnected />;
  if (await getSession()) redirect("/admin");
  const { next, confirmed, expired } = await searchParams;
  return (
    <AuthCard
      title={expired ? "Welcome back. Please sign in again" : "Sign in to the dashboard"}
      intro={expired ? "You were signed out after some time away, to keep the business data safe." : "For the Iloilo Modern Homes team."}
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
      <ResumeAfterSignIn />
      {expired && (
        <div role="status" className="ux-in flex items-start gap-3 rounded-lg bg-gold-100 px-4 py-3 text-sm text-gold-700">
          <History className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            <strong className="block font-semibold text-navy-800">Session expired. Your work is safe.</strong>
            Anything you typed but hadn&apos;t saved is kept on this device. Sign in and we&apos;ll take you back to it.{" "}
            <span id="draft-count" hidden className="font-semibold" />
          </p>
        </div>
      )}
      {confirmed && <p className="rounded-lg bg-[#e7f3ec] px-4 py-3 text-sm font-medium text-[#1e6b3e]">Your email is confirmed. Sign in to continue.</p>}
      <AdminForm action={signIn} submitLabel="Sign in" redirectToast={false}>
        <input type="hidden" name="next" value={next ?? ""} />
        <TextField name="email" label="Email" type="email" inputMode="email" required />
        <TextField name="password" label="Password" type="password" required />
      </AdminForm>
    </AuthCard>
  );
}
