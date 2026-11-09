"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { InquiryForm } from "./InquiryForm";

type Tab = "contact" | "consultation" | "product";

export function ContactTabs({ initialTab, product }: { initialTab: Tab; product?: { id?: string; name: string } }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const tabs: { id: Tab; label: string }[] = [
    { id: "contact", label: "Send a message" },
    { id: "consultation", label: "Book a consultation" },
    ...(product ? [{ id: "product" as Tab, label: "Product inquiry" }] : []),
  ];
  return (
    <div className="flex flex-col gap-7">
      <div role="tablist" aria-label="Contact options" className="flex flex-wrap gap-2 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn("-mb-px min-h-11 border-b-2 px-3 py-2 text-[15px] font-semibold", tab === t.id ? "border-gold-500 text-navy-800" : "border-transparent text-gray-500 hover:text-navy-800")}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "contact" && <InquiryForm key="contact" type="contact" submitLabel="Send message" />}
        {tab === "consultation" && <InquiryForm key="consultation" type="consultation" submitLabel="Request consultation" />}
        {tab === "product" && product && <InquiryForm key="product" type="product" productId={product.id} productName={product.name} submitLabel="Send inquiry" />}
      </div>
    </div>
  );
}
