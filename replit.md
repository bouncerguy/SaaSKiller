# SaaS Killer — Open Source Self-Hosted Business Operating System

## Overview
SaaS Killer is a modular business platform designed to be a comprehensive business operating system. The project offers an open-source, self-hosted alternative to proprietary SaaS solutions. Current modules:

- **Public booking pages**: `/book/:tenantSlug/:eventSlug` — date/time picker, timezone selector, booking form
- **HUD dashboard**: `/hud` — unified control center with module stats (bookings, customers, products, tickets, revenue, time, forms, templates, agents, media)
- **CRM module**: Customer management with payment status tracking, lead management with kanban pipeline boards, notes system, lead-to-customer conversion, cross-module linking (tickets, invoices, time entries visible in customer detail)
- **Products module**: Product & service catalog with pricing, billing cycles (one-time/monthly/quarterly/yearly), categories, search
- **Support module**: Ticket management with priority levels (Low/Medium/High/Urgent), status workflow (Open→In Progress→Waiting→Resolved→Closed), customer linking, team assignment
- **Finance module**: Invoice management with auto-numbering (INV-0001), status tracking (Draft/Sent/Paid/Overdue/Cancelled), customer linking, revenue/outstanding totals
- **Time Tracking module**: Time entry logging with start/end times, auto-duration calculation, billable/non-billable, hourly rates, customer linking, grouped by date
- **Forms module**: Form builder with field types (text/email/phone/number/textarea/select/checkbox/url), public form submissions, response viewer, status workflow (Draft→Published→Archived)
- **Email module**: Email template management with HTML/text body, category tagging (transactional/marketing/notification), variables support, sent log viewer with status tracking (Queued/Sent/Failed/Bounced)
- **AI Agents module**: Workflow automation with configurable triggers (Manual/Schedule/Form Submission/New Customer/New Ticket), action definitions (JSON), manual run execution, run history with status tracking (success/failed/running), status workflow (Draft→Active→Paused)
- **Media module**: Digital asset library with grid view, image previews, file type icons, folder organization, tag-based search, metadata editing (alt text, tags, folder), URL-based asset registration
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
    landing.tsx            - Public landing page with BOS positioning
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
    public-form.tsx        - Public form renderer page
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

### Public (prefix: /api/public)
- GET /:tenantSlug — Tenant info + active event types
- GET /:tenantSlug/:eventSlug — Event type details
- GET /:tenantSlug/:eventSlug/slots/:date/:timezone — Available time slots
- POST /:tenantSlug/:eventSlug/book — Create booking
- GET /forms/:tenantSlug/:formSlug — Get published form
- POST /forms/:tenantSlug/:formSlug/submit — Submit form response

## Database Schema
Key tables: tenants, users, groups, user_groups, features, group_features, user_features, settings, activity_log, event_types, availability_rules, bookings, customers, leads, pipelines, notes, products, tickets, invoices, time_entries, forms, form_responses, email_templates, email_logs, agents, agent_runs, media_assets, session

## Design System
- **Primary**: Warm indigo, Inter font
- **Module accents**: CRM (emerald), Products (orange), Support (rose), Finance (emerald), Time Tracking (violet), Forms (sky), Email (amber), AI Agents (cyan), Media (pink)
- **Dark mode**: Full support via ThemeProvider + class-based toggling
- Prices stored in cents, invoice auto-numbered INV-0001+

## Dev Login
- Email: alex@acmeconsulting.com / Password: password123 (seeded in dev only)
