# SaaS Killer — Open Source Self-Hosted Business Operating System

## Overview
SaaS Killer is a modular, open-source, and self-hosted business operating system designed to provide a comprehensive alternative to proprietary SaaS solutions. It aims to unify various business functions into a single platform, offering modules for public booking, customer relationship management (CRM), product catalog, support ticketing, finance (invoicing), time tracking, form building, email templating, AI-driven automation, media asset management, video conferencing integration, website & domain management, page and funnel builders, phone system integration, document signing, social media management, and secure messaging. The project's vision is to empower businesses with full control over their data and operations through a flexible, extensible, and cost-effective solution.

## User Preferences
Clear, concise, structured. Explain "why" not just "what." Iterative development with small commits. Ask before major architectural changes. Do not modify `shared/schema.ts` without explicit instruction.

## System Architecture
The platform is built with a multi-tenant architecture, allowing for isolated environments and branding per tenant. It features a modular design, enabling scalable and independent development of functionalities.

**Backend Structure (Domain-Split):**
- `shared/schema.ts` — thin re-export barrel; actual schema lives in `shared/schema/*.ts` (18 domain files: core, booking, groups, crm, products, support, finance, forms, email, agents, media, domains, pages, phone, documents, social, secure-messaging, and barrel index.ts)
- `server/routes.ts` — thin orchestrator (~11 lines); actual route handlers live in `server/routes/*.ts` (22 domain files: setup, auth, admin, pages, funnels, phone, documents, hubspot, booking, hud, crm, products, support, finance, forms, email, agents, media, social, secure-messages, helpers, and barrel index.ts)
- `server/storage.ts` — storage interface (IStorage) with all CRUD operations
- `server/auth.ts` — Passport.js session auth setup

**UI/UX Decisions:**
- **Design System:** Utilizes a warm indigo primary color, the Inter font, and Shadcn UI components with Tailwind CSS for a modern, consistent aesthetic.
- **Dark Mode:** Full support implemented via a `ThemeProvider` for user preference.
- **Module Accents:** Each core module is assigned a distinct accent color (e.g., CRM: emerald, Products: orange, Support: rose) for visual differentiation and improved user navigation.
- **Block-based Builders:** Pages, Funnels, and Documents leverage a block-based content editing system for flexible and intuitive content creation.

**Technical Implementations & Feature Specifications:**
- **Authentication:** Email/password login with session-based authentication using Passport.js (local strategy) and `express-session`.
- **Multi-user & Permissions:** Supports team management with group-based feature access and per-user overrides.
- **Booking System:** Public booking pages with date/time pickers, timezone selection, and customizable booking forms.
- **CRM:** Comprehensive customer and lead management, including Kanban boards for lead pipelines, and cross-module linking for a unified customer view.
- **Support:** Ticket management with priority levels, status workflows, and team assignment.
- **Finance:** Automated invoice numbering, status tracking, revenue reporting, invoice line items editor (JSON-based), PDF export via pdfkit (`GET /api/admin/invoices/:id/pdf`), and send invoice by email (`POST /api/admin/invoices/:id/send`). Prices stored in cents.
- **Email System:** Real email sending via nodemailer/SMTP with graceful QUEUED fallback when SMTP not configured. Compose dialog, template-based sending with `{{variable}}` interpolation, test send, and full sent log with status tracking. Backend: `server/email.ts`.
- **AI Agents:** Real OpenAI-powered agent execution (gpt-4o-mini) with graceful fallback when API key not set. Prompt dialog for interactive runs, webhook endpoint (`POST /api/webhooks/agent/:id`), and rich run history with AI response display. Backend: `server/ai.ts`.
- **Media Management:** Digital asset library with grid view, previews, folder organization, tag-based search, and real file upload via multer (drag-and-drop + button). Files stored under `uploads/{tenantId}/` with static serving. Backend: `server/uploads.ts`.
- **Video Conferencing:** Integration with Jitsi Meet (auto-generated rooms) and Zoom (link support) for event types.
- **Website & Domains:** Custom domain management with DNS setup instructions.
- **Time Tracking:** Live start/stop timer (localStorage-persisted) with auto-creation on stop, weekly summary stats, grouped-by-date view with day totals, billable tracking, and customer association.
- **Products:** Category filter tabs (auto-generated from product categories), checkbox-based bulk select with Activate/Deactivate actions, summary cards (total count, active, monthly recurring revenue).
- **Forms:** Visual field builder with 10 field types (text, email, phone, number, textarea, select, radio, checkbox, date, url), reordering, and Preview tab showing rendered form preview with disabled inputs.
- **Pages & Funnels:** Block-based page builder and multi-step sales funnel builder with customizable content and public URLs.
- **Phone System:** Virtual PBX capabilities via Twilio, including phone number management, call forwarding, voicemail, call logs, and SMS messaging.
- **Documents & Signing:** Block-based document creation with multi-role signer management, signing order, public signing pages, and activity logging.
- **Social Media:** BYOK (Bring Your Own Key) multi-platform management for scheduling and publishing posts across Twitter/X, Facebook, LinkedIn, and Instagram.
- **Secure Messaging:** Bank-portal style secure message delivery with email verification and activity audit trails.
- **Embed SDK:** Provides snippets for inline, popup, floating widget, and iframe embedding.
- **First-run Setup:** Includes a wizard for initial organization creation, admin setup, and feature seeding.

## External Dependencies
- **Database:** PostgreSQL (managed with Drizzle ORM)
- **Frontend Framework:** React 18
- **UI Toolkit:** Shadcn UI
- **Styling:** Tailwind CSS
- **Routing:** Wouter
- **Data Fetching:** TanStack Query
- **Backend Framework:** Express.js
- **Authentication:** Passport.js, `express-session`, `connect-pg-simple`, `bcryptjs`
- **Build Tool:** Vite
- **Icons:** Lucide React
- **Video Conferencing:** Jitsi Meet (integration), Zoom (link support)
- **SMS/Voice:** Twilio
- **Social Media APIs:** Twitter/X API, Facebook Graph API, LinkedIn API, Instagram API
- **CRM Integration:** HubSpot API
- **Email:** nodemailer (SMTP transport)
- **AI:** OpenAI SDK (gpt-4o-mini)
- **File Upload:** multer (disk storage)
- **PDF Generation:** pdfkit (invoice PDF export)