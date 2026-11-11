import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getServerClient, type ServerClient } from "@/lib/supabase/server";

export type Role = "owner" | "admin" | "editor" | "staff";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: Role;
  is_active: boolean;
};

export type AdminSession = {
  db: ServerClient;
  userId: string;
  profile: Profile;
  can: { edit: boolean; manage: boolean; owner: boolean };
};

export const roleLabels: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Content editor",
  staff: "Staff",
};

export const roleHelp: Record<Role, string> = {
  owner: "Everything, including giving the owner role",
  admin: "Everything except the owner role",
  editor: "Website content, products, inventory, and inquiries",
  staff: "Inquiries, products, and stock in / out only",
};

function permissions(role: Role) {
  return {
    edit: role === "owner" || role === "admin" || role === "editor",
    manage: role === "owner" || role === "admin",
    owner: role === "owner",
  };
}

/** The signed-in user and their profile, or null. Cached per request. */
export const getSession = cache(async (): Promise<{ db: ServerClient; userId: string; profile: Profile | null } | null> => {
  const db = await getServerClient();
  if (!db) return null;
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db.from("profiles").select("id, full_name, email, role, is_active").eq("id", user.id).maybeSingle<Profile>();
  return { db, userId: user.id, profile: data ?? null };
});

/**
 * Use at the top of every dashboard page and action. Sends signed-out users to sign in,
 * inactive accounts to the waiting page, and users without the needed level to the overview.
 */
export async function requireAdmin(level: "team" | "edit" | "manage" | "owner" = "team"): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!session.profile?.is_active) redirect("/admin/pending");
  const can = permissions(session.profile.role);
  const allowed = level === "team" || (level === "edit" && can.edit) || (level === "manage" && can.manage) || (level === "owner" && can.owner);
  if (!allowed) redirect("/admin?denied=1");
  return { db: session.db, userId: session.userId, profile: session.profile, can };
}

/** Records who changed what, for the activity log. Never blocks the change itself. */
export async function logActivity(s: AdminSession, action: string, entity: string, entityId?: string | null, details?: Record<string, unknown>) {
  const { error } = await s.db.from("activity_logs").insert({
    actor_id: s.userId,
    action,
    entity,
    entity_id: entityId ?? null,
    details: details ?? null,
  });
  if (error) console.error("[activity] could not log", error.message);
}
