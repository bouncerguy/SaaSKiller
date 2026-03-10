# SaaS Killer — Open Source Self-Hosted Business Operating System

## Overview
SaaS Killer is a modular business platform designed to be a comprehensive business operating system. The project offers an open-source, self-hosted alternative to proprietary SaaS solutions. Current modules:

- **Public booking pages**: `/book/:tenantSlug/:eventSlug` — date/time picker, timezone selector, booking form
- **HUD dashboard**: `/hud` — unified control center with module stats (bookings, customers, products, tickets, revenue, time, forms, templates, agents, media, video, pages, funnels, phone lines, documents)
- **CRM module**: Customer management with payment status tracking, lead management with kanban pipeline boards, notes system, lead-to-customer conversion, cross-module linking (tickets, invoices, time entries visible in customer detail)
- **Products module**: Product & service catalog with pricing, billing cycles (one-time/monthly/quarterly/yearly), categories, search
- **Support module**: Ticket management with priority levels (Low/Medium/High/Urgent), status workflow (Open→In Progress→Waiting→Resolved→Closed), customer linking, team assignment
- **Finance module**: Invoice management with auto-numbering (INV-0001), status tracking (Draft/Sent/Paid/Overdue/Cancelled), customer linking, revenue/outstanding totals
- **Time Tracking module**: Time entry logging with start/end times, auto-duration calculation, billable/non-billable, hourly rates, customer linking, grouped by date
- **Forms module**: Form builder with field types (text/email/phone/number/textarea/select/checkbox/url), public form submissions, response viewer, status workflow (Draft→Published→Archived)
- **Email module**: Email template management with HTML/text body, category tagging (transactional/marketing/notification), variables support, sent log viewer with status tracking (Queued/Sent/Failed/Bounced)
- **AI Agents module**: Workflow automation with configurable triggers (Manual/Schedule/Form Submission/New Customer/New Ticket), action definitions (JSON), manual run execution, run history with status tracking (success/failed/running), status workflow (Draft→Active→Paused)
- **Media module**: Digital asset library with grid view, image previews, file type icons, folder organization, tag-based search, metadata editing (alt text, tags, folder), URL-based asset registration
- **Video Conferencing module**: Jitsi Meet integration with auto-generated meeting rooms per booking, Zoom link support per event type, configurable via Settings (provider selector + Jitsi server URL), "Join Meeting" buttons on booking confirmation and admin bookings list
- **Website & Domains module**: Custom domain management with add/remove/set-primary, server IP display with copy-to-clipboard, step-by-step DNS setup instructions (A record + CNAME), public pages directory
- **Pages module**: Block-based page builder with hero, text, features grid, CTA, testimonials, and image blocks. Status workflow (Draft→Published→Archived), homepage toggle, preview capability. Public pages at `/s/:tenantSlug/:pageSlug`
- **Funnels module**: Multi-step sales funnel builder with step types (opt_in/sales/checkout/thank_you/custom), block-based content per step, visual step pipeline, reordering. Public funnels at `/f/:tenantSlug/:funnelSlug` with step navigation
- **Phone System module**: Virtual PBX with Twilio integration, phone number management, call forwarding, voicemail, call logs with direction/status/duration, SMS messaging with compose/receive, Twilio credential configuration per tenant, webhook endpoints for incoming calls/SMS
- **Documents & Signing module**: Document/contract creation with block-based content, signer management (signer/viewer/approver roles), signing order, status workflow (Draft→Sent→Completed/Cancelled/Expired), public signing pages at `/sign/:tenantSlug/:docSlug/:signerId`, signature capture with typed name, activity logging, customer linking
- **HubSpot Integration**: Import contacts as customers or leads, import workflows as AI agents. Requires `HUBSPOT_ACCESS_TOKEN` Private App token. Duplicate detection by email. Imported workflows start as Draft agents.
- **Public form pages**: `/forms/:tenantSlug/:formSlug` — dynamic form renderer with field validation and branded submission
- **First-run setup wizard**: `/setup` — creates organization, admin account, and seeds features on fresh install
- **Authentication**: Email/password login with session-based auth (passport-local + express-session)
- **Multi-user teams**: OWNER can add/edit/remove team members
- **Groups & permissions**: Group-based feature access with per-user overrides
- **Embed SDK**: Inline, popup, floating widget, and iframe embed snippets
- **Multi-tenant**: Tenant isolation with branding support

## User Preferences
Clear, concise, structured. Explain "why" not just "what." Iterative development with small commits. Ask before major architectural changes. Do not modify `shared/schema.ts` without explicit instruction.

## Tech Stack
- **Frontend**: React 18 + Wouter + TanStack Query + Shadcn UI + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Auth**: Passport.js (local strategy) + express-session + connect-pg-simple + bcryptjs
- **Database**: PostgreSQL + Drizzle ORM
- **Build**: Vite
- **Icons**: Lucide React

## Project Structure
```
client/src/
  pages/
    landing.tsx            - Public landing page with BOS positioning + Learn More buttons
    module-detail.tsx      - Individual module feature pages (/modules/:slug)
    get-started.tsx        - Deployment guide: Replit (zero-config) + DigitalOcean + Claude
    auth-page.tsx          - Login/register page
    setup-page.tsx         - First-run setup wizard
    hud-dashboard.tsx      - Dashboard with module stat cards
    hud-event-types.tsx    - Event type management
    hud-bookings.tsx       - Bookings list
    hud-availability.tsx   - Availability rules editor
    hud-crm-customers.tsx  - Customer management with cross-module tabs
    hud-crm-leads.tsx      - Lead management with kanban board
    hud-products.tsx       - Product catalog (orange accent)
    hud-support.tsx        - Support tickets (rose accent)
    hud-finance.tsx        - Invoice management (emerald accent)
    hud-time-tracking.tsx  - Time tracking (violet accent)
    hud-forms.tsx          - Forms builder (sky accent)
    hud-email.tsx          - Email templates & logs (amber accent)
    hud-agents.tsx         - AI Agents automation (cyan accent)
    hud-media.tsx          - Media asset library (pink accent)
    hud-domains.tsx        - Website & domain management
    hud-pages.tsx          - Website pages builder (lime accent)
    hud-funnels.tsx        - Sales funnels builder (fuchsia accent)
    hud-phone.tsx          - Phone system & PBX (teal accent)
    hud-documents.tsx      - Documents & contract signing (indigo accent)
    public-form.tsx        - Public form renderer page
    public-page.tsx        - Public page renderer
    public-funnel.tsx      - Public funnel renderer
    public-document.tsx    - Public document signing page
    hud-users.tsx          - Team management
    hud-settings.tsx       - Settings page
    hud-embed.tsx          - Embed SDK snippets
    hud-help.tsx           - Help & FAQ page
  hooks/
    use-auth.tsx           - Auth context provider
  components/
    app-sidebar.tsx        - Sidebar navigation (Core, Operations, Tools, System)
    theme-provider.tsx     - Dark mode support
    ui/                    - Shadcn UI components
server/
  index.ts                 - Express server entry
  routes.ts                - All API routes
  storage.ts               - IStorage interface + DatabaseStorage (Drizzle)
  auth.ts                  - Passport config + requireAuth middleware
  db.ts                    - Database connection
  seed.ts                  - Dev seed data
  vite.ts                  - Vite dev middleware
shared/
  schema.ts                - Drizzle schema + Zod insert schemas + types
```

## API Routes

### Auth (prefix: /api/auth)
- POST /login — Login with email/password
- POST /logout — Logout
- GET /me — Current user info
- POST /register — Register new user

### Admin (prefix: /api/admin) — All require authentication
- **Customers**: GET/POST /customers, GET/PATCH /customers/:id (detail includes linked tickets/invoices/time entries)
- **Leads**: GET/POST /leads, PATCH/DELETE /leads/:id
- **Products**: GET/POST /products, GET/PATCH/DELETE /products/:id
- **Tickets**: GET/POST /tickets, GET/PATCH/DELETE /tickets/:id
- **Invoices**: GET/POST /invoices, GET/PATCH/DELETE /invoices/:id
- **Time Entries**: GET/POST /time-entries, PATCH/DELETE /time-entries/:id
- **Forms**: GET/POST /forms, GET/PATCH/DELETE /forms/:id, GET /forms/:id/responses
- **Email Templates**: GET/POST /email-templates, GET/PATCH/DELETE /email-templates/:id
- **Email Logs**: GET /email-logs
- **Agents**: GET/POST /agents, GET/PATCH/DELETE /agents/:id, POST /agents/:id/run, GET /agents/:id/runs
- **Media**: GET/POST /media, GET/PATCH/DELETE /media/:id (supports ?folder= and ?search= filters)
- **Notes**: POST /notes, DELETE /notes/:id
- **Event Types**: GET/POST /event-types, GET/PATCH /event-types/:id
- **Bookings**: GET /bookings
- **Users**: GET/POST /team, PATCH/DELETE /team/:id
- **Settings**: GET/PATCH /settings
- **Video Settings**: GET/PATCH /video-settings
- **Domains**: GET/POST /domains, PATCH/DELETE /domains/:id
- **Server Info**: GET /server-info
- **Pages**: GET/POST /pages, GET/PATCH/DELETE /pages/:id
- **Funnels**: GET/POST /funnels, GET/PATCH/DELETE /funnels/:id
- **Funnel Steps**: GET/POST /funnels/:id/steps, PATCH/DELETE /funnels/:id/steps/:stepId
- **Phone Settings**: GET/PATCH /phone-settings, POST /phone-settings/test
- **Phone Numbers**: GET/POST /phone-numbers, PATCH/DELETE /phone-numbers/:id, GET /phone-numbers/available
- **Call Logs**: GET /call-logs, GET /call-logs/:id, POST /calls (outbound)
- **SMS**: GET/POST /sms, GET /sms/:id
- **Documents**: GET/POST /documents, GET/PATCH/DELETE /documents/:id, POST /documents/:id/send, GET /documents/:id/activity
- **Signers**: GET/POST /documents/:id/signers, PATCH/DELETE /documents/:id/signers/:signerId
- **HubSpot**: GET /hubspot/status, GET /hubspot/contacts, POST /hubspot/import-customers, POST /hubspot/import-leads, GET /hubspot/workflows, POST /hubspot/import-workflows

### Public (prefix: /api/public)
- GET /:tenantSlug — Tenant info + active event types
- GET /:tenantSlug/:eventSlug — Event type details
- GET /:tenantSlug/:eventSlug/slots/:date/:timezone — Available time slots
- POST /:tenantSlug/:eventSlug/book — Create booking
- GET /forms/:tenantSlug/:formSlug — Get published form
- POST /forms/:tenantSlug/:formSlug/submit — Submit form response
- GET /:tenantSlug/pages/:pageSlug — Published page content
- GET /:tenantSlug/funnels/:funnelSlug — Funnel with all steps
- GET /:tenantSlug/documents/:docSlug — Document for signing
- GET /:tenantSlug/documents/:docSlug/signer/:signerId — Signer view
- POST /:tenantSlug/documents/:docSlug/signer/:signerId/sign — Submit signature
- POST /:tenantSlug/documents/:docSlug/signer/:signerId/decline — Decline signing

## Database Schema
Key tables: tenants, users, groups, user_groups, features, group_features, user_features, settings, activity_log, event_types, availability_rules, bookings, customers, leads, pipelines, notes, products, tickets, invoices, time_entries, forms, form_responses, email_templates, email_logs, agents, agent_runs, media_assets, pages, funnels, funnel_steps, phone_numbers, call_logs, sms_messages, documents, document_signers, document_activity_log, session

## Design System
- **Primary**: Warm indigo, Inter font
- **Module accents**: CRM (emerald), Products (orange), Support (rose), Finance (emerald), Time Tracking (violet), Forms (sky), Email (amber), AI Agents (cyan), Media (pink), Pages (lime), Funnels (fuchsia), Phone (teal), Documents (indigo)
- **Dark mode**: Full support via ThemeProvider + class-based toggling
- Prices stored in cents, invoice auto-numbered INV-0001+

## Dev Login
- Email: alex@acmeconsulting.com / Password: password123 (seeded in dev only)
