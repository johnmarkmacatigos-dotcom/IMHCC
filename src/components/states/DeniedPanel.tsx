import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { roleHelp, roleLabels, type Role } from "@/lib/admin/session";
import { StatePanel } from "./StatePanel";

const needs: Record<string, { who: string; roles: Role[] }> = {
  edit: { who: "Content editors, Admins, and the Owner", roles: ["editor", "admin", "owner"] },
  manage: { who: "Admins and the Owner", roles: ["admin", "owner"] },
  owner: { who: "the Owner", roles: ["owner"] },
};

/**
 * Shown on the overview when someone opens a page their role doesn't include. Says why, what
 * their role can do, who can open it, and how to get access, instead of a dead end.
 */
export function DeniedPanel({ level, role }: { level: string; role: Role }) {
  const need = needs[level] ?? needs.manage;
  return (
    <StatePanel
      tone="denied"
      icon={Lock}
      eyebrow="Permission needed"
      title="That page isn't part of your role"
      role="alert"
      size="sm"
      tips={[
        <>
          You&apos;re signed in as <strong className="text-navy-800">{roleLabels[role]}</strong>: {roleHelp[role].toLowerCase()}.
        </>,
        <>Only {need.who} can open it.</>,
        <>Need it? Ask the owner or an admin to change your role under Dashboard → Team, then reload this page.</>,
      ]}
      actions={
        <>
          <Link href="/admin" className="btn-navy">
            <ArrowLeft className="size-4" aria-hidden /> Back to the overview
          </Link>
          <Link href="/admin/inquiries" className="btn-outline">
            Open inquiries
          </Link>
        </>
      }
    />
  );
}
