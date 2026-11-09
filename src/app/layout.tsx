import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { ContactDock } from "@/components/site/ContactDock";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getSettings } from "@/lib/data";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Iloilo Modern Homes Construction Co. | Construction and Renovation in Iloilo",
    template: "%s | Iloilo Modern Homes Construction Co.",
  },
  description:
    "Residential and commercial construction, renovations, modular kitchens, interior fit-outs, and hardware supply in Santa Barbara, Iloilo. Request a free quotation.",
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: "Iloilo Modern Homes Construction Co.",
    images: ["/images/projects/black-marble-peninsula.jpg"],
  },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = { themeColor: "#142B46" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2">
          Skip to content
        </a>
        <SiteHeader
          phone={settings.phone_primary}
          messengerUrl={settings.messenger_url}
          serviceArea="Santa Barbara, Iloilo · Serving Iloilo City and Iloilo Province"
        />
        <main id="main">{children}</main>
        <SiteFooter settings={settings} />
        <ContactDock phone={settings.phone_primary} messengerUrl={settings.messenger_url} />
      </body>
    </html>
  );
}
