# CalendaLite - Open Source Scheduling Engine

## Overview
CalendaLite is a Calendly-like scheduling application with:
- **Public booking pages**: `/book/:tenantSlug/:eventSlug` - date/time picker, timezone selector, booking form
- **Admin dashboard (Caladmin)**: `/admin` - manage event types, bookings, availability, embed snippets, settings
- **Availability engine**: Generates time slots from availability rules minus existing bookings
- **Embed SDK**: Inline, popup, floating widget, and iframe embed snippets
- **Multi-tenant**: Tenant isolation with branding support

## Tech Stack
- **Frontend**: React 18 + Wouter + TanStack Query + Shadcn UI + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Build**: Vite

## Project Structure
```
client/src/
  pages/
    landing.tsx          - Home landing page
    public-booking.tsx   - Public booking flow (date picker, time slots, booking form)
    public-tenant.tsx    - Tenant event listing page
    admin-dashboard.tsx  - Admin dashboard with stats
    admin-event-types.tsx - Event type CRUD
    admin-bookings.tsx   - Bookings list with tabs (upcoming/past/canceled)
    admin-availability.tsx - Weekly availability rules
    admin-embed.tsx      - Embed snippet generator
    admin-settings.tsx   - Tenant branding settings
  components/
    app-sidebar.tsx      - Admin navigation sidebar
    theme-provider.tsx   - Dark/light theme provider
    theme-toggle.tsx     - Theme toggle button
server/
  index.ts              - Express server entry point
  routes.ts             - All API routes
  storage.ts            - Database storage interface
  db.ts                 - Database connection
  seed.ts               - Seed data
shared/
  schema.ts             - Drizzle schema definitions
```

## API Routes
### Admin (prefix: /api/admin)
- GET/PATCH /tenant - Tenant settings
- GET/POST /event-types - Event types CRUD
- PATCH /event-types/:id - Update event type
- GET /bookings - All bookings
- PATCH /bookings/:id/cancel - Cancel booking
- GET/POST /availability - Availability rules
- DELETE /availability/:id - Delete rule

### Public (prefix: /api/public)
- GET /:tenantSlug - Tenant info + active event types
- GET /:tenantSlug/:eventSlug - Event type details
- GET /:tenantSlug/:eventSlug/slots/:date/:timezone - Available time slots
- POST /:tenantSlug/:eventSlug/book - Create booking

## Database Schema
- tenants: id, name, slug, logoUrl, brandColor, timezone
- users: id, tenantId, name, email, role, passwordHash
- event_types: id, tenantId, ownerUserId, slug, title, description, durationMinutes, locationType, locationValue, color, isActive, questionsJson
- availability_rules: id, tenantId, userId, dayOfWeek, startTime, endTime, timezone
- bookings: id, tenantId, eventTypeId, hostUserId, inviteeName, inviteeEmail, startAt, endAt, timezone, status, cancelReason, notes, createdAt

## Seed Data
Default tenant "Acme Consulting" with 3 event types, weekday availability (9-12, 1-5), and 4 sample bookings.
