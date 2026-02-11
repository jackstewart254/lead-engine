# Lead Engine

Automated lead generation system for Mclean Stewart.

## Structure

- `apps/dashboard` — Next.js frontend. Campaign management, lead pipeline, email metrics.
- `apps/worker` — Node.js backend. Google Maps scraping, website crawling, AI extraction, email sending.
- `packages/shared` — Shared TypeScript types, Supabase client, utilities.

## Database

Supabase (PostgreSQL). Project: **Personal** (ID: `psmgwsvkbdeyfmzegsfq`, region: `eu-west-2`). Tables: prospects, campaigns, emails_sent, follow_ups, leads.

## Key Conventions

- All types defined in `packages/shared/src/types.ts`
- Both apps use the shared Supabase client
- Worker runs as background jobs, not API routes
- Dashboard reads from Supabase, worker writes to Supabase

## Pipeline Flow

Google Maps API → Crawl website (Puppeteer) → Extract owner name/email (Claude Haiku) → Companies House fallback → Verify email → Store in Supabase → Send personalised email (Outlook/Graph API) → Track opens/clicks via Supabase Edge Function → Display on dashboard
