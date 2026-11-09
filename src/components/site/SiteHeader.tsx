"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { cn, telHref } from "@/lib/utils";
import { mainNav } from "./nav";

type Props = { phone: string | null; messengerUrl: string | null; serviceArea: string };

export function SiteHeader({ phone, messengerUrl, serviceArea }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <div className="bg-navy-900 text-[13px] text-[#e5e9ef]">
        <div className="container-site flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2.5">
          <span>{serviceArea}</span>
          <span className="flex flex-wrap gap-5">
            {phone && (
              <a href={telHref(phone)} className="font-semibold text-gold-300 hover:text-white">
                Call {phone}
              </a>
            )}
            {messengerUrl && (
              <a href={messengerUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                Message us on Messenger
              </a>
            )}
          </span>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="container-site flex items-center justify-between gap-4 py-2">
          <Link href="/" aria-label="Iloilo Modern Homes Construction Co. home" className="shrink-0">
            <Image src="/images/logo.jpg" alt="Iloilo Modern Homes Construction Co." width={498} height={250} priority className="h-16 w-auto sm:h-20 lg:h-[88px]" />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-7 text-[15px] font-medium lg:flex">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn("py-2 hover:text-navy-800", isActive(item.href) ? "text-navy-800 font-semibold" : "text-gray-700")}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {phone && (
              <a href={telHref(phone)} className="btn-outline px-3 sm:hidden" aria-label={`Call ${phone}`}>
                <Phone className="size-5" aria-hidden />
              </a>
            )}
            <Link href="/quote" className="btn-navy hidden sm:inline-flex">
              Request a free quote
            </Link>
            <button
              type="button"
              className="btn-outline px-3 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </div>
        {open && (
          <nav id="mobile-nav" aria-label="Mobile" className="border-t border-gray-200 bg-white lg:hidden">
            <div className="container-site flex flex-col py-3">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn("rounded-md px-3 py-3 text-base", isActive(item.href) ? "bg-navy-100 font-semibold text-navy-800" : "text-gray-700")}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/quote" className="btn-gold mt-3">
                Request a free quote
              </Link>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
