import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { NavProgress, PageTransition, Toaster } from "@/components/admin/motion";
import { NotConnected } from "@/components/admin/NotConnected";
import { requireAdmin, roleLabels } from "@/lib/admin/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { signOut } from "../auth-actions";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) return <NotConnected />;
  const s = await requireAdmin();
  const { count } = await s.db.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new");

  return (
    <div className="admin-shell min-h-dvh bg-mist lg:flex">
      <Suspense>
        <NavProgress />
      </Suspense>
      <AdminNav
        can={s.can}
        newInquiries={count ?? 0}
        user={
          <div>
            <div className="truncate font-semibold text-white">{s.profile.full_name ?? s.profile.email}</div>
            <div className="text-xs">{roleLabels[s.profile.role]}</div>
          </div>
        }
        signOut={
          <form action={signOut}>
            <button className="admin-press flex min-h-10 items-center gap-2 font-medium hover:text-white">
              <LogOut className="size-4" aria-hidden /> Sign out
            </button>
          </form>
        }
      />
      <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-10">
        <PageTransition>{children}</PageTransition>
      </main>
      <Toaster />
    </div>
  );
}
