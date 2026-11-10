import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { telHref } from "@/lib/utils";
import { WHATSAPP_NUMBER, whatsappHref } from "@/content/business";
import { mainNav } from "./nav";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="bg-navy-950 text-sm text-[#c4cdd8]">
      <div className="container-site grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <strong className="font-display text-lg text-white">{settings.company_name}</strong>
          <p className="leading-relaxed">We design. We execute. Construction, renovation, and hardware supply in Santa Barbara, Iloilo.</p>
        </div>
        <div className="flex flex-col gap-2">
          <strong className="text-gold-300">Contact</strong>
          {settings.phone_primary && (
            <a href={telHref(settings.phone_primary)} className="hover:text-white">
              {settings.phone_primary}
            </a>
          )}
          {settings.phone_secondary && (
            <a href={telHref(settings.phone_secondary)} className="hover:text-white">
              {settings.phone_secondary}
            </a>
          )}
          {settings.email && (
            <a href={`mailto:${settings.email}`} className="hover:text-white">
              {settings.email}
            </a>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <strong className="text-gold-300">Visit us</strong>
          {settings.address && <span>{settings.address}</span>}
          {settings.business_hours && <span>{settings.business_hours}</span>}
        </div>
        <div className="flex flex-col gap-2">
          <strong className="text-gold-300">Explore</strong>
          <ul className="grid grid-cols-2 gap-2">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/quote" className="hover:text-white">
                Get a quote
              </Link>
            </li>
            <li>
              <Link href="/resources" className="hover:text-white">
                Permit guide
              </Link>
            </li>
            <li>
              <Link href="/careers" className="hover:text-white">
                Careers
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white">
                Privacy
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="container-site flex flex-wrap justify-between gap-3 border-t border-[#1e3352] pt-6 pb-28 text-[13px]">
        <span>
          © {new Date().getFullYear()} {settings.company_name}
        </span>
        <span className="flex gap-4">
          {settings.facebook_url && (
            <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              Facebook
            </a>
          )}
          {settings.messenger_url && (
            <a href={settings.messenger_url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              Messenger
            </a>
          )}
          <a href={whatsappHref(WHATSAPP_NUMBER)} target="_blank" rel="noopener noreferrer" className="hover:text-white">
            WhatsApp
          </a>
        </span>
      </div>
    </footer>
  );
}
