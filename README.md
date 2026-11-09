# Iloilo Modern Homes Construction Co. — website

The official website and owner dashboard for **Iloilo Modern Homes Construction Co.**, Santa Barbara, Iloilo.

Built with Next.js 15, TypeScript, Tailwind CSS, Supabase (PostgreSQL, Auth, Storage), React Hook Form, and Zod.

## What's included

**Public website**
- Homepage with hero, services, featured projects, before/after, testimonials, hardware, and call-to-action
- About, Services (with detail pages), Projects portfolio (filterable, with photo viewer and before/during/after sections), Hardware catalog, Promotions, Contact, Privacy
- Quotation request form with photo uploads, plus contact, consultation, and product inquiry forms
- Every submission gets a reference number (for example `QR-2026-0001`) and is stored in the database with status `new`
- Click-to-call and Messenger buttons on every page, SEO metadata, sitemap, and robots.txt

**Owner dashboard (`/admin`)**
- Sign in with email and password. The first account becomes the Owner; team members create an account at `/admin/signup` and wait until the Owner or an Admin switches on their access under **Team**
- Overview: new inquiries, inquiries this month, open quotations, jobs won, and the latest requests
- Inquiries: filter, search, call/text/email buttons, customer photos, status (New → Contacted → Site visit → Quoted → Won/Lost/Closed), who handles it, and team notes
- Projects: details, publish/feature switches, and photo uploads tagged Before, During, or After, with captions, order, and cover picture
- Testimonials (shown only when approved and the customer consented), Services, Hardware products (price, stock), Promotions (start/end dates)
- Website settings, including the shop's map pin (use the phone's location while at the shop, or paste a Google Maps link)
- Team roles and an activity log of every change
- What each role can open: Staff (inquiries, products), Editor (plus website content), Admin (plus settings, team, activity), Owner (everything, including the owner role). The database enforces the same rules.

**Database (`supabase/migrations`)**
- Tables for settings, services, projects and photos, testimonials (published only with consent), products and stock, promotions, announcements, customers, inquiries, notifications, and activity logs
- Roles: Owner, Admin, Editor, Staff. Row Level Security on every table: visitors only read published content and submit inquiries through one validated database function
- Storage buckets: `media` (public site photos) and `inquiry-uploads` (private customer photos, visitors can upload but never read)

Until the database is connected, the site shows the starter content in `src/content/fallback.ts`, and forms show a "call or message us" note.

## Run it locally

```bash
npm install
cp .env.example .env.local   # fill in the Supabase values
npm run dev                  # http://localhost:3000
```

## Connect Supabase

1. Create a project at [supabase.com](https://supabase.com) (region: Singapore).
2. In the SQL editor, run each file in `supabase/migrations` in order (`...0001_init.sql`, `...0002_settings_location.sql`, `...0003_dashboard.sql`), then `supabase/seed.sql`.
3. Copy the project URL and anon key from **Settings > API** into your environment variables.
4. In **Authentication > URL Configuration**, set the Site URL to the website address.
5. Open `/admin/signup` on the website and create the Owner account first (the first account becomes the Owner). Later accounts start with no access until the Owner switches them on. If nobody else will join for a while, you can turn off "Allow new users to sign up" under **Authentication > Sign In / Providers**.

## Deploy on Netlify (temporary, free)

1. Sign in at [app.netlify.com](https://app.netlify.com) with GitHub.
2. **Add new site > Import an existing project > GitHub**, pick `IMHCC`.
3. Netlify reads `netlify.toml`. Under **Site configuration > Environment variables**, add the values from `.env.example`.
4. Deploy. Every push to `main` redeploys the site.

Moving to Vercel later: import the same repo in Vercel and copy the same environment variables. No code changes are needed.

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Production build |
| `npm run lint` / `npm run typecheck` | Code checks |
| `npx supabase start` | Local database, sign-in, and storage in Docker (applies migrations and seed) |
| `npm run seed:generate` | Rebuild `supabase/seed.sql` from the starter content |
