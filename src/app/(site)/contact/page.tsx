import type { Metadata } from "next";
import { Clock, Globe, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactTabs } from "@/components/forms/ContactTabs";
import { DirectionsMap } from "@/components/site/DirectionsMap";
import { PageHero } from "@/components/site/PageHero";
import { getProducts, getSettings } from "@/lib/data";
import { telHref } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Call, message, or visit Iloilo Modern Homes Construction Co. in Santa Barbara, Iloilo.",
};

type Props = { searchParams: Promise<{ product?: string; tab?: string }> };

export default async function ContactPage({ searchParams }: Props) {
  const [{ product: productSlug, tab }, s, products] = await Promise.all([searchParams, getSettings(), getProducts()]);
  const product = productSlug ? products.find((p) => p.slug === productSlug) : undefined;
  const isUuid = (v: string) => /^[0-9a-f-]{36}$/.test(v);

  const items = [
    s.phone_primary && { icon: Phone, label: "Call us", value: s.phone_primary, href: telHref(s.phone_primary) },
    s.phone_secondary && { icon: Phone, label: "Other number", value: s.phone_secondary, href: telHref(s.phone_secondary) },
    s.messenger_url && { icon: MessageCircle, label: "Messenger", value: "Chat with us", href: s.messenger_url, external: true },
    s.email && { icon: Mail, label: "Email", value: s.email, href: `mailto:${s.email}` },
    s.facebook_url && { icon: Globe, label: "Facebook", value: "Follow our page", href: s.facebook_url, external: true },
    s.address && { icon: MapPin, label: "Location", value: s.address },
    s.business_hours && { icon: Clock, label: "Hours", value: s.business_hours },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string; external?: boolean }[];

  return (
    <>
      <PageHero eyebrow="Contact" title="Let's talk about your project" intro="Call, message, or send us your details and we'll get back to you." />
      <div className="container-site flex flex-wrap items-start gap-10 py-14">
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-6">
          <ul className="flex flex-col gap-3">
            {items.map(({ icon: Icon, label, value, href, external }) => {
              const content = (
                <>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-navy-800 text-gold-300">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[13px] text-gray-500">{label}</span>
                    <span className="font-semibold text-navy-800">{value}</span>
                  </span>
                </>
              );
              return (
                <li key={label}>
                  {href ? (
                    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="flex items-center gap-3.5 rounded-xl p-2 hover:bg-mist">
                      {content}
                    </a>
                  ) : (
                    <div className="flex items-center gap-3.5 p-2">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
          {s.latitude !== null && s.longitude !== null ? (
            <DirectionsMap lat={s.latitude} lng={s.longitude} label={s.company_name} />
          ) : (
            s.map_embed_url && (
              <iframe title="Map to Iloilo Modern Homes" src={s.map_embed_url} className="h-72 w-full rounded-xl border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            )
          )}
        </div>
        <div className="min-w-0 flex-[999_1_560px] rounded-2xl border border-gray-200 bg-white p-6 sm:p-9">
          <ContactTabs
            initialTab={product ? "product" : tab === "consultation" ? "consultation" : "contact"}
            product={product ? { id: isUuid(product.id) ? product.id : undefined, name: product.name } : undefined}
          />
        </div>
      </div>
    </>
  );
}
