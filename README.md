# Calendar Core

An open-source, self-hostable scheduling engine for individuals and small teams. Built for authors, coaches, consultants, and anyone who wants to own their scheduling infrastructure instead of renting it from a SaaS platform.

## Why Calendar Core?

Most scheduling tools are SaaS products that hold your data, charge monthly fees, and disappear if the company shuts down. Calendar Core is different:

- **Self-hosted**: Run it on your own server. Your data stays yours.
- **Embeddable**: Drop scheduling into any website with a simple embed snippet.
- **No vendor lock-in**: Uses standard ICS calendar feeds — works with Google Calendar, Outlook, Apple Calendar, and any iCal-compatible service.
- **Multi-tenant**: One instance can serve multiple users or organizations.

## Features

- **Public booking pages** — Shareable links where anyone can book time with you
- **Timezone-aware scheduling** — Automatic timezone detection and conversion
- **Availability rules** — Set your weekly schedule with multiple time blocks per day
- **Calendar integration** — Paste an ICS feed URL to automatically block busy times
- **Admin dashboard** — Manage event types, view bookings, configure availability
- **Embed SDK** — Inline, popup, floating widget, and iframe embed options
- **Dark mode** — Full dark mode support throughout the interface
- **Booking management** — View upcoming/past bookings, cancel with reasons

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/calendar-core.git
cd calendar-core

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and a session secret

# Push the database schema
npm run db:push

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5000`.

### Production Build

```bash
npm run build
npm start
```

## Architecture

```
client/src/           React frontend (Vite)
  pages/              Page components (booking, admin, landing)
  components/         Shared UI components (Shadcn)
server/               Express backend
  routes.ts           API endpoints
  storage.ts          Database access layer
  ics-calendar.ts     ICS calendar feed integration
  seed.ts             Initial seed data
shared/               Shared between frontend and backend
  schema.ts           Database schema (Drizzle) + validation (Zod)
```

### Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, Wouter, TanStack Query  |
| UI        | Shadcn UI, Tailwind CSS, Lucide   |
| Backend   | Express.js, TypeScript            |
| Database  | PostgreSQL, Drizzle ORM           |
| Build     | Vite                              |

## Public Booking Flow

Bookings happen through shareable URLs:

```
/book/:tenantSlug/:eventSlug
```

The booking page includes:
1. A date picker showing available days
2. Time slots generated from your availability rules
3. Automatic timezone detection with manual override
4. A booking form collecting name, email, and optional notes

## Admin Dashboard

Access the admin panel at `/admin` to:

- **Event Types** — Create and manage different meeting types (duration, location, custom questions)
- **Bookings** — View all bookings with tabs for upcoming, past, and canceled
- **Availability** — Set weekly availability rules with timezone support
- **Embed** — Generate embed snippets for your website
- **Settings** — Configure organization name, branding, timezone, and calendar integration

## Calendar Integration

Calendar Core uses ICS feeds to check external calendar availability — no OAuth or API keys needed.

1. Go to **Admin > Settings > Calendar Integration**
2. Paste your calendar's ICS feed URL
3. Click **Test** to verify the connection
4. Save — busy times are now automatically excluded from available slots

### Where to Find Your ICS URL

- **Google Calendar**: Settings > Select calendar > Integrate calendar > "Secret address in iCal format"
- **Outlook**: Calendar settings > Shared calendars > Publish a calendar > ICS link
- **Apple Calendar**: Right-click calendar > Share Calendar > copy the URL

## Embedding

Calendar Core provides four embed options. Generate snippets from the admin **Embed** page:

- **Inline** — Renders directly in your page
- **Popup** — Opens in a modal overlay
- **Floating Widget** — A persistent button that opens the booking flow
- **iframe** — Simple iframe embed

## API Reference

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/public/:tenantSlug` | Tenant info + active event types |
| GET | `/api/public/:tenantSlug/:eventSlug` | Event type details |
| GET | `/api/public/:tenantSlug/:eventSlug/slots/:date/:timezone` | Available time slots |
| POST | `/api/public/:tenantSlug/:eventSlug/book` | Create a booking |

### Admin Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/tenant` | Get tenant settings |
| PATCH | `/api/admin/tenant` | Update tenant settings |
| GET | `/api/admin/event-types` | List event types |
| POST | `/api/admin/event-types` | Create event type |
| PATCH | `/api/admin/event-types/:id` | Update event type |
| GET | `/api/admin/bookings` | List all bookings |
| PATCH | `/api/admin/bookings/:id/cancel` | Cancel a booking |
| GET | `/api/admin/availability` | List availability rules |
| POST | `/api/admin/availability` | Create availability rule |
| DELETE | `/api/admin/availability/:id` | Delete availability rule |
| POST | `/api/admin/calendar/test` | Test an ICS feed URL |

## Database Schema

Calendar Core uses PostgreSQL with the following tables:

- **tenants** — Organizations with branding and timezone settings
- **users** — Team members belonging to a tenant
- **event_types** — Bookable meeting types (duration, location, custom questions)
- **availability_rules** — Weekly time blocks when the host is available
- **bookings** — Scheduled meetings with status tracking

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute.

## License

[MIT](LICENSE) — Use it however you want. Fork it, modify it, ship it.
