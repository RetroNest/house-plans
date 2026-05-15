# Chez Sidney Catering Website Prototype

This repository now contains a static, client-previewable website prototype for **Chez Sidney Catering**.

## Preview locally

From the repository root, run:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000
```

No build step is required. The site is plain HTML, CSS, and JavaScript so it can be previewed quickly for customer demos.

## What is included

- Customer-facing local catering landing page with SEO metadata and LocalBusiness/CateringService structured data.
- Editable menu package data rendered into customer package cards and quote choices.
- Event-size pricing logic with guest minimums, service style multipliers, add-ons, staffing, travel, service fees, rush timing, and tax estimates.
- Inquiry intake form with honeypot and math anti-spam checks.
- Browser localStorage demo database for packages, gallery media, blackout dates, and leads.
- Availability handling with blackout dates and minimum lead-time rules.
- Quote generation with downloadable JSON and browser print/save-as-PDF support.
- Lead follow-up center with email templates, CRM CSV export, and downloadable calendar hold files.
- Admin editing panel for menu packages, blackout dates, gallery media, and lead operations.
- Responsive layouts optimized for mobile, tablet, and desktop previewing.

## Production handoff notes

The prototype demonstrates the workflow in the browser. Before using it as a live business system, replace localStorage and client-only actions with production services:

- Database: Postgres, Supabase, Firebase, Airtable, or a hosted CMS.
- Email workflows: Resend, SendGrid, Mailchimp, HubSpot, or Salesforce Marketing Cloud.
- PDF generation: server-rendered proposal PDFs with stored files and signed URLs.
- CRM sync: HubSpot, Salesforce, HoneyBook, or Dubsado API integration.
- Calendar coordination: Google Calendar or Microsoft Graph with OAuth.
- Security: authenticated admin access, server-side validation, CAPTCHA, rate limiting, audit logging, and secure secrets management.
