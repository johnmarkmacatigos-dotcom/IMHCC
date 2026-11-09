# Iloilo Modern Homes Construction Co. — website

The official website and (coming next) owner dashboard for **Iloilo Modern Homes Construction Co.**, Santa Barbara, Iloilo.

Built with Next.js 15, TypeScript, Tailwind CSS, Supabase (PostgreSQL, Auth, Storage), React Hook Form, and Zod.

## What's included

**Public website**
- Homepage with hero, services, featured projects, before/after, testimonials, hardware, and call-to-action
- About, Services (with detail pages), Projects portfolio (filterable, with photo viewer and before/during/after sections), Hardware catalog, Promotions, Contact, Privacy
- Quotation request form with photo uploads, plus contact, consultation, and product inquiry forms
- Every submission gets a reference number (for example `QR-2026-0001`) and is stored in the database with status `new`
- Click-to-call and Messenger buttons on every page, SEO metadata, sitemap, and robots.txt

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
2. In the SQL editor, run `supabase/migrations/20261109000001_init.sql`, then `supabase/seed.sql`.
3. Copy the project URL and anon key from **Settings > API** into your environment variables.
4. In **Authentication > Sign In / Providers**, turn off "Allow new users to sign up" once the owner account exists. The first account created becomes the Owner; later accounts start inactive until the Owner activates them.

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
| `npm run seed:generate` | Rebuild `supabase/seed.sql` from the starter content |
