import Link from "next/link";
import { AdminForm, TextField } from "@/components/admin/Form";
import { AuthCard } from "@/components/admin/AuthCard";
import { NotConnected } from "@/components/admin/NotConnected";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { signUp } from "../auth-actions";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  if (!isSupabaseConfigured) return <NotConnected />;
  return (
    <AuthCard
      title="Create your account"
      intro="The first account becomes the owner. Accounts after that wait until the owner or an admin switches them on."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/admin/login" className="font-semibold text-navy-800 underline">
            Sign in
          </Link>
        </>
      }
    >
      <AdminForm action={signUp} submitLabel="Create account" redirectToast={false}>
        <TextField name="full_name" label="Your name" required />
        <TextField name="email" label="Email" type="email" inputMode="email" required />
        <TextField name="password" label="Password" type="password" hint="At least 10 characters." required />
      </AdminForm>
    </AuthCard>
  );
}
