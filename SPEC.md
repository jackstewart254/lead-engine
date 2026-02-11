# Automated Lead Generation Engine

**Product Specification & Value Proposition**

Mclean Stewart | February 2026

---

## Executive Summary

This document outlines the specification for an automated lead generation engine that identifies businesses across the UK without a professional web presence, contacts them via personalised cold email, and delivers warm leads directly to Mclean Stewart for conversion. The system replaces the manual cold calling process with a scalable, passive, and emotionally low-cost alternative.

## The Problem

Cold calling is effective but unsustainable as a solo operator. A full day of manual cold calling yielded 36 calls, 8 emails sent, and zero confirmed clients. The emotional toll is high, the conversion rate is low, and the process cannot scale beyond the number of hours in a day. The business needs a lead generation method that operates independently of the founder's time and energy.

## The Solution

An automated system that scrapes business data from Google Maps across the UK, identifies businesses with no website or a poor web presence, sends personalised cold emails at scale, and follows up automatically. The founder only engages with leads who have already expressed interest by replying.

## The Core USP: Owner-Level Personalisation

The single most valuable feature of this system is its ability to identify the actual business owner by name and contact them directly. This is what separates it from every other cold email tool on the market.

The difference is stark. An email that says "Hi Sarah, I noticed Hazelwood Dental doesn't have a website" gets opened and read. An email that says "Dear Business Owner, we noticed your business could benefit from a web presence" gets deleted instantly. Personalisation to the decision maker by name is the difference between a 3% reply rate and a 10%+ reply rate. It transforms a cold email into something that feels like a genuine, individual approach.

The system achieves this through an intelligent scraping and matching engine. After identifying a business from Google Maps, it crawls the business website looking for owner and director names on About pages, Meet the Team sections, and page footers. It extracts email addresses from contact pages and matches them to the identified owner. Where the website does not provide this information, the system falls back to Companies House data, Google Business Profile details, LinkedIn profiles, and other public directories to find the decision maker's name and direct contact.

This owner identification engine is the intellectual property at the heart of the product. Anyone can send bulk emails. Very few systems can send a personalised email to the actual owner by name, referencing their specific business, in their specific town, with a specific observation about their online presence. That level of personalisation at scale is what makes this system both effective for Mclean Stewart and valuable as a standalone product.

## How It Works

### 1. Data Collection & Owner Identification

The system queries the Google Maps API or scrapes Google Maps listings by category and location. It extracts business name, address, phone number, email address, website URL, and Google rating. It then analyses each business to determine whether they have no website, an outdated website, or no professional email address. Crucially, the system then crawls each business website to identify the owner or director by name, checking About pages, Meet the Team sections, footers, and contact pages. Where the website does not yield a name, the system cross-references Companies House records, Google Business Profiles, and LinkedIn to find the decision maker. The result is a prospect list with the owner's name and direct email attached to every entry.

### 2. Prospect Filtering

Not every business without a website is a good lead. The system filters prospects by category, prioritising sectors with proven demand: dental practices, accountants, solicitors, physiotherapists, and professional services. Trades can be included but are lower priority based on field research showing most tradespeople find work through word-of-mouth.

### 3. Personalised Email Generation

Each email is generated using a template that inserts the business name, location, and a specific observation about their online presence. The tone is conversational, human, and non-pushy. The email reads as though it was written individually, not by a machine. The pitch focuses on the outcome: helping the business get found online and look credible to potential clients.

### 4. Automated Sending

Emails are sent through a dedicated domain using an email service provider such as Resend, SendGrid, or Amazon SES. Sending is throttled to avoid spam filters, typically 50-100 emails per day per domain. Multiple domains can be used to increase volume. Sending is staggered throughout the day to mimic human behaviour.

### 5. Automated Follow-Up

If no reply is received within 5 days, a short follow-up email is sent automatically. This doubles the response rate. A maximum of two follow-ups are sent before the lead is marked as unresponsive.

### 6. Lead Capture & Dashboard

All replies are captured in a dashboard built with Next.js and Supabase. The dashboard shows lead status, email open rates, reply rates, and conversion tracking. Warm leads are flagged for immediate attention. The founder only interacts with people who have already shown interest.

## Projected Performance

Based on industry averages for cold email outreach to small businesses:

| Metric | Projected Value |
|---|---|
| Emails sent per week | 500 |
| Open rate | 15-25% |
| Reply rate | 2-5% |
| Warm leads per week | 10-25 |
| Conversions per week (estimated) | 2-5 |
| Revenue per conversion (website) | £1,000+ |
| Potential weekly revenue | £2,000-5,000 |
| Potential monthly revenue | £8,000-20,000 |

These are conservative estimates. With refined targeting and improved email copy over time, conversion rates improve significantly.

## Cold Calling vs Automated Email

| Factor | Cold Calling | Automated Email |
|---|---|---|
| Volume per day | 36 calls | 100-500 emails |
| Emotional cost | High | None |
| Time required | Full day | 15 minutes monitoring |
| Rejection exposure | Constant | Zero (non-replies are invisible) |
| Scalability | Limited by hours | Unlimited |
| Runs while sleeping | No | Yes |
| Lead quality | Mixed | Pre-filtered by criteria |
| Cost per lead | Time only | Pennies per email |

## Technical Specification

### Tech Stack

- **Frontend & Dashboard:** Next.js, TypeScript, Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Data Scraping:** Google Maps API or Puppeteer/Playwright for scraping
- **Email Service:** Resend, SendGrid, or Amazon SES
- **Scheduling:** Cron jobs via Vercel or Supabase Edge Functions
- **Deployment:** Vercel

### Database Schema

- **prospects** - business name, category, location, email, website URL, website status, Google rating, owner name, owner email, owner source (website/Companies House/LinkedIn), date scraped
- **campaigns** - campaign name, target category, target location, email template, status
- **emails_sent** - prospect ID, campaign ID, email content, sent date, opened, replied, bounced
- **follow_ups** - email ID, follow-up number, sent date, content
- **leads** - prospect ID, status (warm/hot/converted/lost), notes, follow-up date

### Dashboard Features

- Real-time metrics: emails sent, open rate, reply rate, bounce rate
- Lead pipeline view with status tracking
- Campaign management: create, pause, resume, and archive campaigns
- Email template editor with personalisation variables
- Prospect database with filtering by category, location, and status
- Automated follow-up scheduling and tracking

## Email Strategy

### Deliverability

Email deliverability is the single biggest risk to this system. To mitigate this, emails are sent from a dedicated domain (not mcleanstewart.co.uk) with proper SPF, DKIM, and DMARC records configured. The domain is warmed up gradually over 2-3 weeks before sending at volume. Sending is capped at 50-100 emails per day per domain to stay below spam thresholds. Multiple domains can be rotated to increase total volume without increasing per-domain risk.

### Email Template Approach

The email must read as human-written. No HTML formatting, no images, no marketing language. Plain text, conversational tone, short paragraphs. The template follows the proven cold email formula:

- Personalised opening addressing the owner by their first name and referencing their specific business and location
- Observation about their current online presence (no website, outdated site, no Google listing)
- Value statement explaining what they're missing in terms of clients or credibility
- Soft call to action offering a free consultation or simply asking if they'd like to see examples
- Short signature with name, phone number, and website link

### Follow-Up Sequence

- **Day 0:** Initial email sent
- **Day 5:** First follow-up. Short, casual. "Just floating this to the top of your inbox."
- **Day 12:** Final follow-up. "No worries if the timing isn't right. I'm here if anything changes."

## Target Sectors (Priority Order)

Based on field research from cold calling 36 businesses in Birmingham, the following sectors showed the highest demand for web presence:

| Sector | Demand Level | Typical Budget | Why They Buy |
|---|---|---|---|
| Dental Practices | Very High | £1,000-3,000 | Patients Google before booking |
| Accountants | High | £1,000-2,000 | Credibility with new clients |
| Solicitors | High | £1,500-3,000 | Trust and professionalism |
| Physiotherapists | Medium-High | £1,000-2,000 | Online booking and visibility |
| Estate Agents | Medium | £1,000-2,500 | Property listings and leads |
| Trades (selective) | Low-Medium | £500-1,000 | Exceptions exist but most rely on word-of-mouth |

## Running Costs

| Item | Monthly Cost |
|---|---|
| Email service (Resend/SendGrid) | £20-50 |
| Dedicated sending domains (2-3) | £20-30 |
| Google Maps API or scraping proxy | £10-30 |
| Vercel hosting | Free (hobby) or £20 (pro) |
| Supabase | Free tier or £25 (pro) |
| **Total estimated monthly cost** | **£50-155** |

## Build Timeline

| Phase | Work | Duration |
|---|---|---|
| Week 1 | Google Maps scraper, prospect database, filtering logic | 3-4 days |
| Week 2 | Email template engine, sending integration, domain setup | 3-4 days |
| Week 3 | Dashboard build, campaign management, lead tracking | 3-4 days |
| Week 4 | Follow-up automation, testing, domain warming begins | 3-4 days |
| Week 5+ | Live sending begins, iterate on copy and targeting | Ongoing |

## Dual Value Proposition

This system has value beyond generating leads for Mclean Stewart. It is a standalone product in its own right. Once built and proven, it could be offered as a SaaS tool for other freelancers, agencies, and small businesses who need automated lead generation. The same engine that finds clients for Mclean Stewart could be white-labelled and sold as a subscription service, creating a second revenue stream on top of the web design business it supports.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Emails land in spam | Zero visibility, wasted effort | Proper domain auth, warm-up period, throttled sending |
| Low reply rates | Fewer leads than projected | A/B test subject lines and copy, refine targeting |
| Google Maps API limits | Cannot scrape at volume | Use multiple API keys, supplement with Puppeteer scraping |
| GDPR compliance | Legal exposure | Only email businesses (not individuals), include unsubscribe, legitimate interest basis |
| Prospect data quality | Bounced emails, wrong contacts | Verify emails before sending, clean database regularly |

## Conclusion

This system turns lead generation from a manual, emotionally draining process into a passive, scalable engine. It costs under £155 per month to run, can be built in 4-5 weeks, and has the potential to generate £8,000-20,000 per month in revenue from website sales alone. Beyond that, it is a portfolio piece, a proof of technical capability, and a product that could be sold to others. It is the most efficient use of the founder's programming skills applied to the business's biggest bottleneck: finding clients.
