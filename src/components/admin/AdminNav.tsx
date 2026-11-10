"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardList,
  ExternalLink,
  FolderKanban,
  Gauge,
  History,
  Menu,
  Megaphone,
  MessageSquareQuote,
  Package,
  Settings,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Overview", icon: Gauge, level: "team" },
  { href: "/admin/inquiries", label: "Inquiries", icon: ClipboardList, level: "team" },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban, level: "edit" },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote, level: "edit" },
  { href: "/admin/services", label: "Services", icon: Wrench, level: "edit" },
  { href: "/admin/products", label: "Hardware products", icon: Package, level: "team" },
  { href: "/admin/promotions", label: "Promotions", icon: Megaphone, level: "edit" },
  { href: "/admin/settings", label: "Website settings", icon: Settings, level: "manage" },
  { href: "/admin/team", label: "Team", icon: Users, level: "manage" },
  { href: "/admin/activity", label: "Activity log", icon: History, level: "manage" },
] as const;

export function AdminNav({ can, newInquiries, user, signOut }: { can: { edit: boolean; manage: boolean }; newInquiries: number; user: React.ReactNode; signOut: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const visible = items.filter((i) => i.level === "team" || (i.level === "edit" && can.edit) || (i.level === "manage" && can.manage));
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Dashboard" className="flex flex-col gap-1">
      {visible.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(href) ? "page" : undefined}
          className={cn(
            "group admin-press flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] transition-[background-color,color,box-shadow] duration-200",
            isActive(href)
              ? "bg-white/10 font-semibold text-white shadow-[inset_3px_0_0_var(--color-gold-500)]"
              : "text-[#c9d3df] shadow-[inset_0_0_0_var(--color-gold-500)] hover:bg-white/5 hover:text-white hover:shadow-[inset_2px_0_0_rgb(201_154_53/0.5)]",
          )}
        >
          <Icon
            className={cn("size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110", isActive(href) && "text-gold-500")}
            aria-hidden
          />
          <span className="flex-1">{label}</span>
          {href === "/admin/inquiries" && newInquiries > 0 && (
            <span className="relative flex" aria-label={`${newInquiries} new`}>
              <span className="absolute inset-0 animate-ping rounded-full bg-brick-500 opacity-40 motion-reduce:hidden" aria-hidden />
              <span key={newInquiries} className="admin-pop relative rounded-full bg-brick-600 px-2 py-0.5 text-xs font-bold text-white">
                {newInquiries}
              </span>
            </span>
          )}
        </Link>
      ))}
      <Link href="/" target="_blank" className="mt-3 flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] text-[#c9d3df] hover:bg-white/5 hover:text-white">
        <ExternalLink className="size-[18px]" aria-hidden /> View website
      </Link>
    </nav>
  );

  return (
    <>
      {/* Phone top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/images/logo.jpg" alt="Iloilo Modern Homes dashboard" width={498} height={250} className="h-10 w-auto" />
        </Link>
        <button type="button" onClick={() => setOpen(true)} className="admin-press flex size-11 items-center justify-center rounded-lg border border-gray-300" aria-label="Open menu" aria-expanded={open}>
          <Menu className="size-5" aria-hidden />
        </button>
      </div>

      <div
        className={cn("fixed inset-0 z-40 bg-navy-950/50 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden", open ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-6 overflow-y-auto bg-navy-900 px-4 py-5 transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-2">
          <Link href="/admin" className="flex items-center gap-2.5 text-white">
            <Building2 className="size-6 text-gold-500 transition-transform duration-300 hover:rotate-[-6deg]" aria-hidden />
            <span className="font-display text-lg font-semibold leading-tight">
              Iloilo Modern Homes
              <span className="block text-[11px] font-bold tracking-[0.14em] text-brick-500 [text-shadow:0_0_10px_rgba(207,68,54,0.55)]">CONSTRUCTION CO.</span>
              <span className="block text-xs font-normal text-[#9fb0c4]">Dashboard</span>
            </span>
          </Link>
          <button type="button" onClick={() => setOpen(false)} className="flex size-10 items-center justify-center rounded-lg text-white lg:hidden" aria-label="Close menu">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {nav}
        <div className="mt-auto flex flex-col gap-3 border-t border-white/10 px-2 pt-4 text-sm text-[#c9d3df]">
          {user}
          {signOut}
        </div>
      </aside>
    </>
  );
}
