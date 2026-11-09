import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Privacy policy" };

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <>
      <PageHero eyebrow="Privacy" title="How we handle your information" />
      <article className="container-site flex max-w-3xl flex-col gap-5 py-14 text-[17px] leading-relaxed text-gray-700">
        <p>
          {s.company_name} respects your privacy and follows the Data Privacy Act of 2012 (Republic Act No. 10173). This page explains what we collect
          through this website and how we use it.
        </p>
        <h2 className="pt-2 text-2xl">What we collect</h2>
        <p>When you send a quotation request, inquiry, or message, we collect your name, mobile number, email (if given), project location, project details, and any photos you choose to upload.</p>
        <h2 className="pt-2 text-2xl">How we use it</h2>
        <p>We use your details only to respond to your request, prepare quotations, schedule site visits, and serve you as a customer. We do not sell or share your information with third parties for marketing.</p>
        <h2 className="pt-2 text-2xl">Photos and testimonials</h2>
        <p>We only publish photos of your property or your testimonial after you give us permission. You can ask us to remove them at any time.</p>
        <h2 className="pt-2 text-2xl">Storage and access</h2>
        <p>Your information is stored securely and can only be viewed by authorized members of our team.</p>
        <h2 className="pt-2 text-2xl">Your rights</h2>
        <p>
          You may ask to see, correct, or delete your information by contacting us{s.phone_primary ? ` at ${s.phone_primary}` : ""}
          {s.email ? ` or ${s.email}` : ""}.
        </p>
      </article>
    </>
  );
}
