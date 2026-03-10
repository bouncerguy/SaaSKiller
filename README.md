# SaaS Killer

### Open Source Self-Hosted Business Operating System

[![Deploy on Replit](https://replit.com/badge?caption=Deploy%20on%20Replit)](https://replit.com/refer/kenpcox)
[![Deploy on DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://www.digitalocean.com/?refcode=de537efcf1f1&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge)

A modular, self-hosted business platform built for small teams and solo operators. Start with scheduling, grow into CRM, support tickets, finance, and more — all from one unified dashboard. Own your data. Run it anywhere. Kill the SaaS.

---

## Why SaaS Killer?

Most business tools are fragmented SaaS products that hold your data hostage, charge monthly fees per module, and disappear if the company shuts down. SaaS Killer takes a different approach:

- **Self-hosted** — Run it on your own server or on Replit. Your data stays yours.
- **Modular** — Start with calendar scheduling, enable more modules as you need them.
- **No vendor lock-in** — Uses standard protocols (ICS calendar feeds) and open formats.
- **Multi-tenant** — One instance can serve multiple organizations.
- **Permission system** — Groups, per-user feature overrides, and role-based access control.

---

## Modules (15)

| Module | Description |
|--------|-------------|
| **Calendar & Booking** | Public booking pages, availability rules, ICS integration, timezone-aware scheduling, embed SDK |
| **CRM — Customers** | Customer management with payment status tracking, cross-module linking (tickets, invoices, time entries) |
| **CRM — Leads** | Lead pipeline with kanban boards, notes, lead-to-customer conversion |
| **Products** | Product & service catalog with pricing, billing cycles, categories, search |
| **Support** | Ticket management with priority levels, status workflow, customer & team assignment |
| **Finance** | Invoice management with auto-numbering (INV-0001), status tracking, revenue/outstanding totals |
| **Time Tracking** | Time entry logging with duration calculation, billable/non-billable, hourly rates, customer linking |
| **Forms** | Form builder with multiple field types, public submissions, response viewer, status workflow |
| **Email** | Email template management with HTML/text body, category tagging, variables, sent log with status tracking |
| **AI Agents** | Workflow automation with configurable triggers (manual, schedule, form, customer, ticket), run history |
| **Media** | Digital asset library with grid view, image previews, folder organization, tag-based search |
| **Pages** | Block-based page builder with hero, text, features, CTA, testimonials blocks. Public pages served at custom URLs |
| **Funnels** | Multi-step sales funnel builder with opt-in, sales, checkout, thank-you steps and block-based content |
| **Phone System** | Virtual PBX with Twilio integration, call forwarding, voicemail, call logs, SMS messaging |
| **Documents & Signing** | Document/contract creation with signer management, signing order, signature capture, activity logging |

---

## Quick Start

### Path A: Deploy on Replit (Zero Config)

The fastest way to get running — no server management, no SSH, no configuration files.

1. **Create a Replit account** — [Sign up here](https://replit.com/refer/kenpcox)
2. **Fork/import** this GitHub repository on Replit
3. **Click Run** — the app starts automatically with PostgreSQL provisioned
4. **Visit `/setup`** — the setup wizard creates your organization and admin account
5. **Start enabling modules** in Settings — turn on CRM, Support, Finance, and more

### Path B: DigitalOcean + Claude (Self-Hosted)

Use Claude AI to walk you through a full self-hosted deployment on your own server.

1. **Create a DigitalOcean account** — [Sign up here](https://www.digitalocean.com/?refcode=de537efcf1f1&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge)
2. **Create a droplet** — Recommended: 2 vCPUs, 4 GB RAM, Ubuntu 24.04
3. **Open Claude** ([claude.ai](https://claude.ai) or Claude Code CLI) and paste the prompt below
4. **Claude walks you through**: SSH access, installing Node.js + PostgreSQL, cloning the repo, setting environment variables, running `npm install`, `npm run db:push`, and `npm start`
5. **Claude helps set up** Nginx reverse proxy + SSL with Let's Encrypt
6. **Visit your domain's `/setup` page** to create your org and admin account

#### Copy This Prompt for Claude

```
I just created a DigitalOcean droplet running Ubuntu 24.04. Help me deploy
SaaS Killer from GitHub (https://github.com/your-username/saas-killer).

I need you to walk me through:
1. SSH into the droplet
2. Install Node.js 20+ and PostgreSQL 15+
3. Clone the repo, run npm install
4. Set up DATABASE_URL and SESSION_SECRET environment variables
5. Run npm run db:push to create the database schema
6. Run npm run build && npm start for production
7. Set up Nginx as a reverse proxy on port 80/443
8. Configure SSL with Let's Encrypt using certbot
9. Set up a systemd service so the app runs on reboot

The app runs on port 5000 by default.
```

### After Setup (Both Paths)

Once your instance is running:

- Enable modules in **Settings** — turn on the tools you need
- Create your first **Event Type** for scheduling
- Share your **public booking link** with clients
- Connect **Twilio** for the Phone module (add credentials in Settings)
- Video conferencing works out of the box with **Jitsi** (or configure Zoom links per event)
- Import contacts from **HubSpot** if you have an existing CRM

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Wouter, TanStack Query |
| UI | Shadcn UI, Tailwind CSS, Lucide Icons |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Auth | Passport.js (local strategy), express-session, bcryptjs |
| Build | Vite |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret for signing session cookies |
| `NODE_ENV` | No | Set to `production` for production builds |
| `TWILIO_ACCOUNT_SID` | No | Twilio Account SID (for Phone module) |
| `TWILIO_AUTH_TOKEN` | No | Twilio Auth Token (for Phone module) |
| `HUBSPOT_ACCESS_TOKEN` | No | HubSpot Private App token (for CRM import) |

---

## Development

```bash
npm run dev          # Start dev server (frontend + backend on port 5000)
npm run build        # Production build
npm start            # Start production server
npm run db:push      # Push schema changes to database
npm run check        # TypeScript type checking
```

### Dev Seed Data

In development mode, the app seeds sample data on startup:

- **Tenant**: Acme Consulting
- **Default login**: `alex@acmeconsulting.com` / `password123`
- **Sample data**: Event types, weekday availability, sample bookings

In production, seed data is skipped — use the setup wizard instead.

---

## Project Structure

```
client/src/
  pages/              Page components (landing, auth, HUD modules, public pages)
  hooks/              Auth context, theme, utilities
  components/         App sidebar, theme provider, Shadcn UI components
server/
  index.ts            Express server entry (auto schema push)
  routes.ts           All API routes (auth, setup, admin, public)
  storage.ts          Database storage interface + Drizzle implementation
  auth.ts             Passport config + requireAuth middleware
  db.ts               Database connection
shared/
  schema.ts           Drizzle schema + Zod validation + TypeScript types
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Built By

SaaS Killer is developed by [kencox.com](https://kencox.com).

Need help deploying or integrating SaaS Killer into your company? Visit [vrroom.io](https://vrroom.io) for professional setup, customization, and support.

---

## License

[MIT](LICENSE) — Use it however you want. Fork it, modify it, ship it.
