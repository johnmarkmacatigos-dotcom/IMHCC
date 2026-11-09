import { z } from "zod";

export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

const phone = z
  .string()
  .trim()
  .min(7, "Enter a valid mobile number")
  .max(20, "Enter a valid mobile number")
  .regex(/^[0-9+() -]+$/, "Use numbers only, for example 0917 123 4567");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .optional()
    .or(z.literal(""));

/** Shared by the browser form and the server route, so both enforce the same rules. */
export const inquirySchema = z.object({
  type: z.enum(["quotation", "product", "consultation", "contact"]),
  full_name: z.string().trim().min(2, "Enter your name").max(120),
  phone,
  email: z.string().trim().email("Enter a valid email").max(160).optional().or(z.literal("")),
  location: optionalText(200),
  service: optionalText(120),
  product_id: z.string().uuid().optional().or(z.literal("")),
  budget: optionalText(60),
  preferred_date: optionalText(60),
  preferred_contact: optionalText(40),
  message: optionalText(4000),
  consent: z.literal(true, { message: "Please agree so we can contact you" }),
  attachments: z
    .array(z.string().regex(/^[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,120}$/))
    .max(MAX_PHOTOS)
    .default([]),
  // Spam protection: a hidden field people never fill in, and the time the form was opened.
  website: z.string().max(0).optional().or(z.literal("")),
  started_at: z.number().int().optional(),
});

export type InquiryInput = z.input<typeof inquirySchema>;
