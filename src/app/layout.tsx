import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>{children}</body>
    </html>
  );
}
