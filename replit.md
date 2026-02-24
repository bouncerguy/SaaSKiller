# Calendar Core - Open Source Scheduling Engine

## Overview
Calendar Core is a Calendly-like scheduling application with:
- **Public booking pages**: `/book/:tenantSlug/:eventSlug` - date/time picker, timezone selector, booking form
- **Admin dashboard (Caladmin)**: `/admin` - manage event types, bookings, availability, embed snippets, settings
- **Authentication**: Email/password login with session-based auth (passport-local + express-session)
- **Multi-user teams**: OWNER can add/edit/remove team members; each user manages their own event types and availability
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
    landing.tsx          - Home landing page
    auth-page.tsx        - Login/register page (two-column layout)
    public-booking.tsx   - Public booking flow (date picker, time slots, booking form)
    public-tenant.tsx    - Tenant event listing page
    admin-dashboard.tsx  - Admin dashboard with stats
    admin-event-types.tsx - Event type CRUD
    admin-bookings.tsx   - Bookings list with tabs (upcoming/past/canceled)
    admin-availability.tsx - Weekly availability rules
    admin-embed.tsx      - Embed snippet generator
    admin-settings.tsx   - Tenant branding settings
    admin-team.tsx       - Team member management (OWNER only)
    admin-help.tsx       - Help & FAQ page
  hooks/
    use-auth.tsx         - Auth context provider and useAuth hook
  components/
    app-sidebar.tsx      - Admin navigation sidebar with user info and logout
    theme-provider.tsx   - Dark/light theme provider
    theme-toggle.tsx     - Theme toggle button
server/
  index.ts              - Express server entry point
  auth.ts               - Passport + session configuration, requireAuth middleware
  routes.ts             - All API routes (auth, admin, public, team)
  storage.ts            - Database storage interface
  db.ts                 - Database connection
  seed.ts               - Seed data (default login: alex@acmeconsulting.com / password123)
  ics-calendar.ts       - ICS feed fetch, parse, cache
shared/
  schema.ts             - Drizzle schema definitions
```

## API Routes
### Auth (prefix: /api/auth)
- POST /register - Register new user (first user becomes OWNER; subsequent require OWNER auth)
- POST /login - Login with email + password
- POST /logout - Destroy session
- GET /user - Get current authenticated user (or 401)

### Admin (prefix: /api/admin) - All require authentication
- GET/PATCH /tenant - Tenant settings
- GET/POST /event-types - Event types CRUD (scoped to tenant, owner is logged-in user)
- PATCH /event-types/:id - Update event type
- GET /bookings - All bookings for tenant
- PATCH /bookings/:id/cancel - Cancel booking
- GET/POST /availability - Availability rules (scoped to logged-in user)
- DELETE /availability/:id - Delete rule
- GET /team - List team members (OWNER only)
- POST /team - Add team member (OWNER only)
- PATCH /team/:id - Update team member (OWNER only)
- DELETE /team/:id - Remove team member (OWNER only, cannot remove self)
- POST /calendar/test - Test ICS URL

### Public (prefix: /api/public)
- GET /:tenantSlug - Tenant info + active event types
- GET /:tenantSlug/:eventSlug - Event type details
- GET /:tenantSlug/:eventSlug/slots/:date/:timezone - Available time slots
- POST /:tenantSlug/:eventSlug/book - Create booking

## Database Schema
- tenants: id, name, slug, logoUrl, brandColor, timezone, calendarIcsUrl
- users: id, tenantId, name, email, role (OWNER/MEMBER), passwordHash
- session: managed by connect-pg-simple (auto-created)
- event_types: id, tenantId, ownerUserId, slug, title, description, durationMinutes, locationType, locationValue, color, isActive, questionsJson
- availability_rules: id, tenantId, userId, dayOfWeek, startTime, endTime, timezone
- bookings: id, tenantId, eventTypeId, hostUserId, inviteeName, inviteeEmail, startAt, endAt, timezone, status, cancelReason, notes, createdAt

## Authentication Flow
- Session-based auth using express-session stored in PostgreSQL (connect-pg-simple)
- Passwords hashed with bcryptjs (cost factor 10)
- First registered user automatically becomes OWNER
- OWNER can add team members via /admin/team page
- All /api/admin/* routes protected by requireAuth middleware
- Frontend AuthProvider wraps app, redirects to /auth if unauthenticated
- SESSION_SECRET environment variable used for session signing

## Calendar Integration (ICS Feed)
- Users can paste any public ICS/iCal feed URL in admin settings (Google Calendar, Outlook, Apple Calendar)
- Backend fetches and parses the ICS feed, caches results for 5 minutes
- Busy times from the external calendar are excluded from available slots
- Booking creation also validates against ICS busy times to prevent conflicts
- Test endpoint: POST /api/admin/calendar/test validates the ICS URL
- No OAuth or API keys required - works with any standard ICS feed URL
- Server utility: `server/ics-calendar.ts` handles fetch, parse, cache, and date filtering

## Seed Data
Default tenant "Acme Consulting" with 3 event types, weekday availability (9-12, 1-5), and 4 sample bookings.
Default login: alex@acmeconsulting.com / password123

## Design System (Updated Feb 2026)
- **Color palette**: Warm indigo primary (#5b4cdb / HSL 235 72% 55%), neutral grays for backgrounds
- **Typography**: Inter font with -0.011em tracking, tighter heading tracking (-0.025em)
- **Spacing**: Consistent 4/6/8px rhythm, generous whitespace, max-w containers for readability
- **Components**: Shadcn UI exclusively - Cards, Buttons, Badges, Sidebar, Tabs, Dialogs
- **Icons**: Lucide React throughout
- **Dark mode**: Full dark mode support via CSS variables in :root/.dark
- **Shadows**: Custom shadow scale from 2xs to 2xl for depth hierarchy
- **Layout**: Sticky headers with z-[9999], backdrop-blur, flex-wrap on all flex rows
