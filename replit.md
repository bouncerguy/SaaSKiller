# SaaS Killer — Open Source Self-Hosted Business Operating System

## Overview
SaaS Killer is a modular business platform that starts with Calendly-like scheduling and expands into a full business operating system. Current features:
- **Public booking pages**: `/book/:tenantSlug/:eventSlug` — date/time picker, timezone selector, booking form
- **HUD dashboard**: `/hud` — unified control center for all modules
- **CRM module**: Customer management with payment status tracking, lead management with kanban pipeline boards, notes system, lead-to-customer conversion
- **First-run setup wizard**: `/setup` — creates organization, admin account, and seeds features on fresh install
- **Authentication**: Email/password login with session-based auth (passport-local + express-session)
- **Multi-user teams**: OWNER can add/edit/remove team members; each user manages their own event types and availability
- **Groups & permissions**: Group-based feature access with per-user overrides
- **Availability engine**: Generates time slots from availability rules minus existing bookings
- **Embed SDK**: Inline, popup, floating widget, and iframe embed snippets
- **Multi-tenant**: Tenant isolation with branding support

## Tech Stack
- **Frontend**: React 18 + Wouter + TanStack Query + Shadcn UI + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Auth**: Passport.js (local strategy) + express-session + connect-pg-simple + bcryptjs
- **Database**: PostgreSQL + Drizzle ORM
- **Build**: Vite

## Project Structure
```
client/src/
  pages/
    landing.tsx            - Public landing page
    auth-page.tsx          - Login page (two-column layout)
    setup-page.tsx         - First-run setup wizard (multi-step)
    public-booking.tsx     - Public booking flow (date picker, time slots, booking form)
    public-tenant.tsx      - Tenant event listing page
    hud-dashboard.tsx      - HUD dashboard with stats
    hud-event-types.tsx    - Event type CRUD
    hud-bookings.tsx       - Bookings list with tabs (upcoming/past/canceled)
    hud-availability.tsx   - Weekly availability rules
    hud-embed.tsx          - Embed snippet generator
    hud-settings.tsx       - Tenant branding settings
    hud-team.tsx           - Team member management (OWNER only)
    hud-users.tsx          - User & group management with feature permissions
    hud-crm-customers.tsx  - Customer management (green accent, search, detail sheet, notes)
    hud-crm-leads.tsx      - Lead management with kanban board (blue accent, pipeline stages)
    hud-help.tsx           - Help & FAQ page
  hooks/
    use-auth.tsx           - Auth context provider with setup status detection
  components/
    app-sidebar.tsx        - Module-aware sidebar with grouped navigation
    theme-provider.tsx     - Dark/light theme provider
    theme-toggle.tsx       - Theme toggle button
server/
  index.ts                - Express server entry point (auto schema push on startup)
  auth.ts                 - Passport + session configuration, requireAuth middleware
  routes.ts               - All API routes (auth, setup, admin, public, groups)
  storage.ts              - Database storage interface with permission hierarchy
  db.ts                   - Database connection
  seed.ts                 - Dev-only seed data (default login: alex@acmeconsulting.com / password123)
  ics-calendar.ts         - ICS feed fetch, parse, cache
shared/
  schema.ts               - Drizzle schema definitions (tenants, users, groups, features, settings, activity_log)
```

## Startup Behavior
- On startup, the server automatically runs `npx drizzle-kit push` to sync the database schema
- In development (`NODE_ENV=development`), seed data is loaded automatically
- In production, seed data is skipped — the setup wizard handles initial configuration
- If no tenants exist, the app redirects to `/setup` for first-run configuration

## API Routes

### Setup (unauthenticated)
- GET `/api/setup/status` — Returns `{ needsSetup: boolean }` (true when zero tenants exist)
- POST `/api/setup` — Create organization + admin user + seed features (403 if setup already done)

### Auth (prefix: /api/auth)
- POST /register — Register new user (first user becomes OWNER; subsequent require OWNER auth)
- POST /login — Login with email + password
- POST /logout — Destroy session
- GET /user — Get current authenticated user (or 401)

### Admin (prefix: /api/admin) — All require authentication
- GET/PATCH /tenant — Tenant settings
- GET/POST /event-types — Event types CRUD (scoped to tenant)
- PATCH /event-types/:id — Update event type
- GET /bookings — All bookings for tenant
- PATCH /bookings/:id/cancel — Cancel booking
- GET/POST /availability — Availability rules (scoped to logged-in user)
- DELETE /availability/:id — Delete rule
- GET /team — List team members (OWNER only)
- POST /team — Add team member (OWNER only)
- PATCH /team/:id — Update team member (OWNER only)
- DELETE /team/:id — Remove team member (OWNER only, cannot remove self)
- POST /calendar/test — Test ICS URL

### Groups (prefix: /api/hud) — All require OWNER role
- GET/POST /groups — List/create groups
- PATCH/DELETE /groups/:id — Update/delete group
- GET/POST/DELETE /groups/:id/members — Manage group membership
- GET/PATCH /groups/:id/features — Manage group feature access

### CRM (prefix: /api/admin) — All require authentication
- GET/POST /customers — List (with ?search) / create customers
- GET/PATCH /customers/:id — Get/update single customer (includes notes + activity)
- GET/POST /leads — List (with ?pipelineId) / create leads
- GET/PATCH/DELETE /leads/:id — Get/update/delete single lead
- POST /leads/:id/convert — Convert lead to customer (creates customer, sets lead stage to Won)
- GET/POST /pipelines — List/create pipelines (auto-creates default on first request)
- PATCH/DELETE /pipelines/:id — Update/delete pipeline
- GET /notes/:entityType/:entityId — Get notes for entity
- POST /notes — Create note (entityType, entityId, content)
- DELETE /notes/:id — Delete note

### Public (prefix: /api/public)
- GET /:tenantSlug — Tenant info + active event types
- GET /:tenantSlug/:eventSlug — Event type details
- GET /:tenantSlug/:eventSlug/slots/:date/:timezone — Available time slots
- POST /:tenantSlug/:eventSlug/book — Create booking

## Database Schema
- **tenants**: id, name, slug, logoUrl, brandColor, timezone, calendarIcsUrl
- **users**: id, tenantId, name, email, role (OWNER/MEMBER), passwordHash, isActive
- **groups**: id, tenantId, name, description, createdAt
- **user_groups**: id, userId, groupId (junction table)
- **features**: id, name, slug (unique), description, enabledGlobally
- **group_features**: id, groupId, featureId, enabled
- **user_features**: id, userId, featureId, enabled (overrides group setting)
- **settings**: id, key (unique), value, category
- **activity_log**: id, tenantId, userId, entityType, entityId, action, details, createdAt
- **event_types**: id, tenantId, ownerUserId, slug, title, description, durationMinutes, locationType, locationValue, color, isActive, questionsJson
- **availability_rules**: id, tenantId, userId, dayOfWeek, startTime, endTime, timezone
- **bookings**: id, tenantId, eventTypeId, hostUserId, inviteeName, inviteeEmail, startAt, endAt, timezone, status, cancelReason, notes, createdAt
- **pipelines**: id, tenantId, name, stages (JSON text), isDefault, createdAt
- **customers**: id, tenantId, userId, name, businessName, email, phone, address, billingType, paymentStatus (CURRENT/PAST_DUE_30/PAST_DUE_60/COLLECTIONS), isActive, createdAt, updatedAt
- **leads**: id, tenantId, name, email, phone, source, pipelineId, stage, awarenessData, createdAt, updatedAt
- **notes**: id, tenantId, entityType, entityId, userId, content, createdAt
- **session**: managed by connect-pg-simple (auto-created)

## Permission Hierarchy
Feature access is resolved in this order:
1. **user_features** — Per-user override (highest priority)
2. **group_features** — Group-level permission (checked for all groups the user belongs to)
3. **features.enabledGlobally** — Global default (lowest priority)

## Authentication Flow
- Session-based auth using express-session stored in PostgreSQL (connect-pg-simple)
- Passwords hashed with bcryptjs
- First-run: setup wizard creates the initial OWNER user
- OWNER can add team members via /hud/team page
- All /api/admin/* routes protected by requireAuth middleware
- Frontend AuthProvider checks setup status and redirects accordingly

## Seed Data (dev only)
Default tenant "Acme Consulting" with 3 event types, weekday availability (9-12, 1-5), and 4 sample bookings.
Default login: alex@acmeconsulting.com / password123

## Design System
- **Color palette**: Warm indigo primary (#5b4cdb / HSL 235 72% 55%), neutral grays for backgrounds
- **Typography**: Inter font with -0.011em tracking, tighter heading tracking (-0.025em)
- **Spacing**: Consistent 4/6/8px rhythm, generous whitespace, max-w containers for readability
- **Components**: Shadcn UI exclusively — Cards, Buttons, Badges, Sidebar, Tabs, Dialogs
- **Icons**: Lucide React throughout
- **Dark mode**: Full dark mode support via CSS variables in :root/.dark
- **Shadows**: Custom shadow scale from 2xs to 2xl for depth hierarchy
- **Layout**: Sticky headers with z-[9999], backdrop-blur, flex-wrap on all flex rows

## Sidebar Navigation Structure
The HUD sidebar is organized by function:
- **Core**: Dashboard, Calendar (with sub-items: Event Types, Bookings, Availability), CRM (with sub-items: Customers, Leads), Products
- **Operations**: Support, Time Tracking, Finance
- **Tools**: Forms, Email, AI Agents, Media
- **System**: Users & Groups, Assets, Settings, Backups, Updates, Help

Modules that aren't built yet appear disabled with a "Coming Soon" tooltip.
