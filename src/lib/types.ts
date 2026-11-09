export type SiteSettings = {
  company_name: string;
  tagline: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  phone_primary: string | null;
  phone_secondary: string | null;
  email: string | null;
  address: string | null;
  business_hours: string | null;
  facebook_url: string | null;
  messenger_url: string | null;
  map_embed_url: string | null;
  latitude: number | null;
  longitude: number | null;
  about_intro: string | null;
  mission: string | null;
  vision: string | null;
  stats: { value: string; label: string }[];
};

export type Service = {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string | null;
  description: string | null;
  scope: string[];
  cover_image: string | null;
  sort_order: number;
  is_featured: boolean;
};

export type PhotoPhase = "before" | "during" | "after";

export type ProjectPhoto = {
  id: string;
  image_url: string;
  caption: string | null;
  phase: PhotoPhase;
  sort_order: number;
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: "planning" | "ongoing" | "completed";
  location: string | null;
  summary: string | null;
  story: string | null;
  scope: string[];
  duration: string | null;
  completed_on: string | null;
  cover_image: string | null;
  is_featured: boolean;
  photos?: ProjectPhoto[];
};

export type Testimonial = {
  id: string;
  customer_name: string;
  customer_town: string | null;
  service_label: string | null;
  quote: string;
  rating: number | null;
  photo_url: string | null;
  project_id: string | null;
};

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "made_to_order";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  specifications: string | null;
  price: number | null;
  price_unit: string | null;
  price_on_request: boolean;
  stock_status: StockStatus;
  delivery_info: string | null;
  image_url: string | null;
  is_featured: boolean;
};

export type Promotion = {
  id: string;
  title: string;
  description: string | null;
  banner_image: string | null;
  terms: string | null;
  cta_label: string | null;
  cta_url: string | null;
  starts_on: string | null;
  ends_on: string | null;
};

export type InquiryType = "quotation" | "product" | "consultation" | "contact";
