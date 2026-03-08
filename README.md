# SaaS Killer — Open Source Self-Hosted Business Operating System

A modular, self-hosted business platform built for small teams and solo operators. Start with scheduling, grow into CRM, support tickets, finance, and more — all from one unified dashboard. Own your data. Run it anywhere. Kill the SaaS.

## Why SaaS Killer?

Most business tools are fragmented SaaS products that hold your data hostage, charge monthly fees per module, and disappear if the company shuts down. SaaS Killer takes a different approach:

- **Self-hosted**: Run it on your own server or on Replit. Your data stays yours.
- **Modular**: Start with calendar scheduling, enable more modules as you need them.
- **No vendor lock-in**: Uses standard protocols (ICS calendar feeds) and open formats.
- **Multi-tenant**: One instance can serve multiple organizations.
- **Permission system**: Groups, per-user feature overrides, and role-based access control.

## Modules

| Module | Status | Description |
|--------|--------|-------------|
| Calendar | Built | Public booking pages, availability rules, ICS integration, embed SDK |
| CRM | Coming Soon | Contact and deal management |
| Products | Coming Soon | Product catalog and inventory |
| Support | Coming Soon | Ticket and helpdesk system |
| Finance | Coming Soon | Invoicing and expense tracking |
| Email | Coming Soon | Transactional and marketing email |
| Forms | Coming Soon | Custom form builder |
| AI Agents | Coming Soon | Workflow automation with AI |
| Media | Coming Soon | Asset and media library |
| Time Tracking | Coming Soon | Time logs and reporting |
| Backups | Coming Soon | Automated backup management |
| Updates | Coming Soon | Platform update manager |

## Deploy on Replit

The fastest way to get started:

1. Fork or import this repository into Replit
2. Replit auto-provisions a PostgreSQL database — no configuration needed
3. Click **Run** — the app automatically creates database tables on startup
4. The setup wizard guides you through creating your organization and admin account
5. You're live at your Replit URL

## Self-Hosted Deployment

### Prerequisites

- Node.js 20+
- PostgreSQL 15+

### Setup

```bash
git clone https://github.com/your-username/saas-killer.git
cd saas-killer

npm install

cp .env.example .env
# Edit .env — set DATABASE_URL and SESSION_SECRET

npm run dev
```

On first run, the app automatically pushes the database schema and presents a setup wizard at the root URL. No manual migration step required.

### Production Build

```bash
npm run build
npm start
```

The app will be available at `http://localhost:5000`.

## First-Run Setup

When SaaS Killer starts with an empty database, it redirects to a setup wizard:

1. **Step 1 — Organization**: Enter your organization name, URL slug (auto-generated, editable), and timezone
2. **Step 2 — Admin Account**: Create the first admin user with name, email, and password

The wizard creates your tenant, seeds default feature flags (only Calendar enabled), and logs you into the `/hud` dashboard.

## Architecture

```
client/src/               React frontend (Vite)
  pages/                  Page components
    landing.tsx           Public landing page
    auth-page.tsx         Login page
    setup-page.tsx        First-run setup wizard
    public-booking.tsx    Public booking flow
    public-tenant.tsx     Tenant event listing
    hud-dashboard.tsx     HUD dashboard with stats
    hud-event-types.tsx   Event type CRUD
    hud-bookings.tsx      Bookings list (upcoming/past/canceled)
    hud-availability.tsx  Weekly availability rules
    hud-embed.tsx         Embed snippet generator
    hud-settings.tsx      Tenant settings
    hud-team.tsx          Team member management
    hud-users.tsx         User & group management
    hud-help.tsx          Help & FAQ
  hooks/
    use-auth.tsx          Auth context with setup detection
  components/
    app-sidebar.tsx       Module-aware sidebar navigation
    theme-provider.tsx    Dark/light theme provider
    theme-toggle.tsx      Theme toggle button
server/
  index.ts               Express server entry (auto schema push)
  auth.ts                Passport + session config, requireAuth middleware
  routes.ts              All API routes (auth, setup, admin, public, groups)
  storage.ts             Database storage interface + implementations
  db.ts                  Database connection
  seed.ts                Dev-only seed data
  ics-calendar.ts        ICS feed fetch, parse, cache
shared/
  schema.ts              Drizzle schema + Zod validation
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Wouter, TanStack Query |
| UI | Shadcn UI, Tailwind CSS, Lucide |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Auth | Passport.js (local), express-session, bcryptjs |
| Build | Vite |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret for signing session cookies |
| `PGHOST` | No | PostgreSQL host (alternative to DATABASE_URL) |
| `PGPORT` | No | PostgreSQL port (default: 5432) |
| `PGUSER` | No | PostgreSQL user |
| `PGPASSWORD` | No | PostgreSQL password |
| `PGDATABASE` | No | PostgreSQL database name |
| `NODE_ENV` | No | Set to `production` for production builds |

## Development

### Dev Seed Data

In development mode (`NODE_ENV=development`), the app seeds sample data on startup:

- **Tenant**: Acme Consulting
- **Default login**: `alex@acmeconsulting.com` / `password123`
- **Sample data**: 3 event types, weekday availability (9-12, 1-5), 4 sample bookings

In production, seed data is skipped — use the setup wizard instead.

### Running Locally

```bash
npm run dev          # Start dev server (frontend + backend on port 5000)
npm run build        # Production build
npm start            # Start production server
npm run db:push      # Push schema changes to database
npm run check        # TypeScript type checking
```

## Calendar Features

- **Public booking pages** — Shareable links at `/book/:tenantSlug/:eventSlug`
- **Timezone-aware scheduling** — Automatic detection with manual override
- **Availability rules** — Weekly schedule with multiple time blocks per day
- **ICS calendar integration** — Paste a feed URL to block busy times (Google Calendar, Outlook, Apple Calendar)
- **Embed SDK** — Inline, popup, floating widget, and iframe options
- **Dark mode** — Full dark mode support throughout the interface
- **Booking management** — View upcoming/past bookings, cancel with reasons

### Calendar Integration

SaaS Killer uses ICS feeds to check external calendar availability — no OAuth or API keys needed.

1. Go to **HUD > Settings > Calendar Integration**
2. Paste your calendar's ICS feed URL
3. Click **Test** to verify the connection
4. Save — busy times are now automatically excluded from available slots

**Where to find your ICS URL:**
- **Google Calendar**: Settings > Select calendar > Integrate calendar > "Secret address in iCal format"
- **Outlook**: Calendar settings > Shared calendars > Publish a calendar > ICS link
- **Apple Calendar**: Right-click calendar > Share Calendar > copy the URL

### Embedding

Generate embed snippets from the HUD **Embed** page:
- **Inline** — Renders directly in your page
- **Popup** — Opens in a modal overlay
- **Floating Widget** — A persistent button that opens the booking flow
- **iframe** — Simple iframe embed

## API Reference

### Setup Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/setup/status` | No | Returns `{ needsSetup: boolean }` |
| POST | `/api/setup` | No | Create org + admin (only when needsSetup is true) |

### Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | OWNER | Register new user (first user auto-becomes OWNER) |
| POST | `/api/auth/login` | No | Login with email + password |
| POST | `/api/auth/logout` | Yes | Destroy session |
| GET | `/api/auth/user` | Yes | Get current authenticated user |

### Admin Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/tenant` | Yes | Get tenant settings |
| PATCH | `/api/admin/tenant` | Yes | Update tenant settings |
| GET | `/api/admin/event-types` | Yes | List event types |
| POST | `/api/admin/event-types` | Yes | Create event type |
| PATCH | `/api/admin/event-types/:id` | Yes | Update event type |
| GET | `/api/admin/bookings` | Yes | List all bookings |
| PATCH | `/api/admin/bookings/:id/cancel` | Yes | Cancel a booking |
| GET | `/api/admin/availability` | Yes | List availability rules |
| POST | `/api/admin/availability` | Yes | Create availability rule |
| DELETE | `/api/admin/availability/:id` | Yes | Delete availability rule |
| POST | `/api/admin/calendar/test` | Yes | Test an ICS feed URL |
| GET | `/api/admin/team` | OWNER | List team members |
| POST | `/api/admin/team` | OWNER | Add team member |
| PATCH | `/api/admin/team/:id` | OWNER | Update team member |
| DELETE | `/api/admin/team/:id` | OWNER | Remove team member |

### Group Management Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/hud/groups` | OWNER | List all groups |
| POST | `/api/hud/groups` | OWNER | Create a group |
| PATCH | `/api/hud/groups/:id` | OWNER | Update a group |
| DELETE | `/api/hud/groups/:id` | OWNER | Delete a group |
| GET | `/api/hud/groups/:id/members` | OWNER | List group members |
| POST | `/api/hud/groups/:id/members` | OWNER | Add member to group |
| DELETE | `/api/hud/groups/:id/members` | OWNER | Remove member from group |
| GET | `/api/hud/groups/:id/features` | OWNER | List group feature permissions |
| PATCH | `/api/hud/groups/:id/features` | OWNER | Update group feature permissions |

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/public/:tenantSlug` | Tenant info + active event types |
| GET | `/api/public/:tenantSlug/:eventSlug` | Event type details |
| GET | `/api/public/:tenantSlug/:eventSlug/slots/:date/:timezone` | Available time slots |
| POST | `/api/public/:tenantSlug/:eventSlug/book` | Create a booking |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute.

## License

[MIT](LICENSE) — Use it however you want. Fork it, modify it, ship it.
