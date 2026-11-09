import "server-only";

type InquiryEmail = {
  reference: string;
  type: string;
  full_name: string;
  phone: string;
  email?: string;
  location?: string;
  service?: string;
  message?: string;
  attachments: string[];
};

const typeLabels: Record<string, string> = {
  quotation: "Quotation request",
  product: "Product inquiry",
  consultation: "Consultation request",
  contact: "Message",
};

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Emails the business when a new inquiry arrives, and sends the customer a receipt
 * when they gave an email. Uses Resend (free tier) when RESEND_API_KEY is set;
 * otherwise does nothing, and the inquiry still appears in the dashboard.
 */
export async function notifyNewInquiry(inq: InquiryEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_NOTIFY_EMAIL;
  const from = process.env.EMAIL_FROM ?? "Iloilo Modern Homes <onboarding@resend.dev>";
  if (!apiKey || !to) return;

  const label = typeLabels[inq.type] ?? "Inquiry";
  const rows = [
    ["Reference", inq.reference],
    ["Name", inq.full_name],
    ["Phone", inq.phone],
    ["Email", inq.email],
    ["Location", inq.location],
    ["Service", inq.service],
    ["Photos", inq.attachments.length ? `${inq.attachments.length} attached (view in dashboard)` : undefined],
    ["Message", inq.message],
  ].filter(([, v]) => v);

  const send = (payload: object) =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

  await send({
    from,
    to: to.split(",").map((s) => s.trim()),
    subject: `${label} ${inq.reference} from ${inq.full_name}`,
    html: `<h2>${label}</h2><table cellpadding="6">${rows
      .map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${escape(String(v)).replace(/\n/g, "<br>")}</td></tr>`)
      .join("")}</table>`,
  });

  if (inq.email) {
    await send({
      from,
      to: [inq.email],
      subject: `We received your request (${inq.reference})`,
      html: `<p>Hi ${escape(inq.full_name)},</p><p>Thank you for contacting Iloilo Modern Homes Construction Co. Your reference number is <strong>${inq.reference}</strong>. Our team will contact you soon.</p><p>Construct with us!</p>`,
    });
  }
}
