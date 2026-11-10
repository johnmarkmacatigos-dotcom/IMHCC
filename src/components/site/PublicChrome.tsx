import { AnnouncementBar, buildAnnouncements } from "@/components/site/AnnouncementBar";
import { ContactDock } from "@/components/site/ContactDock";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getPromotions, getSettings } from "@/lib/data";

/** Header, footer, and floating contact buttons shared by every public page. */
export async function PublicChrome({ children }: { children: React.ReactNode }) {
  const [settings, promotions] = await Promise.all([getSettings(), getPromotions()]);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <AnnouncementBar items={buildAnnouncements(promotions)} />
      <SiteHeader
        phone={settings.phone_primary}
        messengerUrl={settings.messenger_url}
        serviceArea="Santa Barbara, Iloilo · Serving Iloilo City and Iloilo Province"
      />
      <main id="main">{children}</main>
      <SiteFooter settings={settings} />
      <ContactDock phone={settings.phone_primary} messengerUrl={settings.messenger_url} />
    </>
  );
}
