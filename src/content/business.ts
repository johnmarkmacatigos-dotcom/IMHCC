/**
 * Business details taken from the company's Facebook page (harvest of 2026-11-10,
 * see docs/reference/facebook-harvest.md). These sit in code, not in the dashboard settings,
 * because the settings table has no column for them yet.
 */

/** WhatsApp number listed on the Facebook page. Also a call/text number. */
export const WHATSAPP_NUMBER = "0966 396 3855";

/** "0966 396 3855" -> "https://wa.me/639663963855" */
export function whatsappHref(phone: string, text?: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  const intl = digits.startsWith("0") ? `63${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** The brand line used across the Facebook page. */
export const BRAND_LINE = "We design. We execute.";

/** Building permit checklist the company posts on Facebook (National Building Code of the Philippines). */
export const PERMIT_STEPS: { title: string; detail: string }[] = [
  {
    title: "Verify your land title",
    detail: "Make sure the title is clean and in your name, or that you hold written consent from the owner to build on the lot.",
  },
  {
    title: "Hire a legit contractor",
    detail: "Work with a registered contractor and licensed professionals who can sign and seal your plans.",
  },
  {
    title: "Prepare complete building plans",
    detail: "Architectural, structural, electrical, and plumbing plans, plus the bill of materials and specifications.",
  },
  {
    title: "Get barangay clearance",
    detail: "Secure the barangay construction clearance for the lot where you will build.",
  },
  {
    title: "Apply for a building permit",
    detail: "File the application and plans with the Office of the Building Official of your city or municipality.",
  },
  {
    title: "Pay permit fees and construction bond",
    detail: "Settle the assessed permit fees and bond so construction can start on schedule.",
  },
];

export type JobOpening = { title: string; type: string; summary: string; requirements: string[] };

/** Openings posted on the Facebook page. Remove an entry here once it is filled. */
export const JOB_OPENINGS: JobOpening[] = [
  {
    title: "Mason",
    type: "On-site, full time",
    summary: "Join our construction team on house builds and renovations around Iloilo. Competitive salary.",
    requirements: ["Skilled in CHB laying, plastering, tile setting, and concrete works", "Willing to work on-site", "Reliable and safety-minded"],
  },
];

export type Announcement = { label: string; text: string; href: string };

/**
 * Standing messages for the scrolling banner at the top of every page. Job openings and
 * current promotions from the dashboard are added automatically (see AnnouncementBar).
 */
export const STANDING_ANNOUNCEMENTS: Announcement[] = [
  { label: "Free guide", text: "Building a house? Follow our 6-step building permit checklist", href: "/resources" },
  { label: "Free quote", text: "Site visit and quotation at no cost, anywhere in Iloilo", href: "/quote" },
];
