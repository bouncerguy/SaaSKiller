# SaaSKiller — Complete Fix & Build-Out Prompt

I need you to systematically fix bugs, fill in shell modules, and deepen thin modules across this entire project. Work through each section in order. Do not skip anything. After each section, confirm what you changed before moving to the next.

---

## SECTION 1: Critical Setup Bugs (Fix First)

### 1.1 — Add dotenv support
The app crashes on startup because `.env` files aren't loaded. There's no `dotenv` dependency.
- Install `dotenv` as a dependency
- Add `import 'dotenv/config'` at the very top of `server/index.ts` (before any other imports)
- Verify the `.env.example` instructions match reality

### 1.2 — Fix macOS listen error
`server/index.ts` uses `host: "0.0.0.0"` with `reusePort: true` which fails on macOS with `ENOTSUP`.
- Remove `reusePort: true` from the listen options
- Keep `host: "0.0.0.0"` but make it configurable: `host: process.env.HOST || "0.0.0.0"`

### 1.3 — Fix default port conflict
Port 5000 conflicts with macOS AirPlay Receiver.
- Change the default port from 5000 to 3000: `process.env.PORT || "3000"`
- Update README.md to document the PORT env var

### 1.4 — Make seed data idempotent
The seed script runs on every dev start and doesn't check if data already exists.
- Before seeding, check if the default tenant already exists. If it does, skip seeding entirely.
- Add a console log: `"Seed data already exists, skipping..."` when skipped

### 1.5 — Fix npm audit vulnerabilities
Run `npm audit fix` and update any packages with known vulnerabilities. If a fix requires a major version bump, note it but don't break things.

### 1.6 — Fix console warnings
- Fix the `validateDOMNesting` React error on the Support Tickets page — a `<div>` is likely nested inside a `<p>` or similar invalid nesting
- Add missing `aria-describedby` attributes to all Dialog/Sheet components that trigger the accessibility warning

---

## SECTION 2: Shell Modules — Make Them Real

These three modules are currently CRUD-only with no actual functionality. Each one needs real implementation.

### 2.1 — Email Campaigns: Add Real Email Sending

Currently: Template CRUD and email log table exist, but nothing actually sends email. No SMTP, no Nodemailer, no transport.

Build this:
- Install `nodemailer` as a dependency
- Create `server/email.ts` with:
  - A `createTransport()` function that reads SMTP config from env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
  - A `sendEmail(to, subject, html)` function that sends via the transport
  - A `sendTemplateEmail(templateId, to, variables)` function that loads a template, replaces `{{variable}}` placeholders, and sends
  - Graceful fallback: if SMTP vars aren't set, log a warning and store the email in the log table with status "QUEUED" instead of failing
- Add these API endpoints in routes:
  - `POST /api/admin/email/send` — send a one-off email (to, subject, body)
  - `POST /api/admin/email/send-template` — send using a template (templateId, to, variables object)
  - `POST /api/admin/email/send-bulk` — send a template to multiple recipients (templateId, recipients array)
- Update `hud-email.tsx`:
  - Add a "Compose Email" button that opens a dialog with To, Subject, and a rich text body field
  - Add a "Send" button on each template card that opens a dialog asking for recipient email and variable values
  - Show the email log tab with delivery status (Queued → Sent → Failed → Bounced)
  - Add a "Test Send" button on templates that sends to the logged-in user's email
- Update `.env.example` with the SMTP vars uncommented and documented

### 2.2 — AI Agents: Add Real Execution

Currently: Agent CRUD exists, but the "Run" button creates a fake database record with a hardcoded success message. No LLM integration.

Build this:
- Create `server/ai.ts` with:
  - Support for OpenAI API (since OPENAI_API_KEY is already in .env.example)
  - A `runAgent(agent, input)` function that:
    - Takes the agent's system prompt and configuration from the database
    - Sends it to OpenAI's chat completions API
    - Returns the response
  - Graceful fallback: if OPENAI_API_KEY isn't set, return a mock response with a message saying "AI not configured — set OPENAI_API_KEY in .env"
- Install `openai` as a dependency
- Update the `POST /api/admin/agents/:id/run` route to:
  - Accept an `input` field in the request body
  - Call `runAgent()` with the agent config and input
  - Store the real result in the agent_runs table
  - Return the actual AI response
- Add agent trigger types in the schema/UI:
  - "Manual" — triggered by the Run button with user input
  - "Scheduled" — runs on a cron schedule (store schedule in agent config, but actual cron execution can be a TODO)
  - "Webhook" — add `POST /api/webhooks/agent/:id` public endpoint that triggers the agent
- Update `hud-agents.tsx`:
  - The "Run" button should open a dialog with a text input for the user's message/prompt
  - Show the actual AI response in the run history
  - Display the agent's system prompt in the edit view
  - Add a "Test" button that runs the agent and shows the response inline

### 2.3 — Media Library: Add Real File Upload

Currently: The POST endpoint only accepts JSON metadata (URL, filename). There's no file upload, no storage.

Build this:
- Install `multer` as a dependency
- Create `server/uploads.ts` with:
  - Multer configured for local disk storage in an `uploads/` directory
  - File type validation (images: jpg/png/gif/webp/svg, documents: pdf/doc/docx, video: mp4/webm, audio: mp3/wav)
  - Max file size: 50MB
  - A helper to generate the public URL for uploaded files
- Add/update these routes:
  - `POST /api/admin/media/upload` — multipart file upload endpoint using multer, saves file to disk, creates media asset record with real file size, mime type, and local URL
  - Serve uploaded files: `app.use('/uploads', express.static('uploads'))` (with tenant isolation — files should be in `uploads/{tenantId}/`)
  - `DELETE /api/admin/media/:id` — should also delete the file from disk
- Update `hud-media.tsx`:
  - Replace the current "Add Media" form (which asks for a URL) with a real file upload dropzone
  - Show upload progress
  - Display image thumbnails for image files
  - Show file type icons for non-image files
  - Add a "Copy URL" button that copies the public file URL
- Add `uploads/` to `.gitignore`

---

## SECTION 3: Thin Modules — Add Depth

These modules have basic CRUD but are missing the features that make them actually useful.

### 3.1 — Finance / Invoicing: Add Line Items and PDF

Currently: Invoice CRUD with status tracking, but no line items and no PDF generation.

- Add an `invoice_items` table to the schema:
  - `id`, `invoiceId`, `description`, `quantity`, `unitPrice`, `amount`, `createdAt`
- Add API endpoints for managing invoice line items:
  - `GET/POST /api/admin/invoices/:id/items`
  - `PATCH/DELETE /api/admin/invoices/:id/items/:itemId`
- Auto-calculate invoice total from sum of line items
- Install `pdfkit` or `@react-pdf/renderer` and add:
  - `GET /api/admin/invoices/:id/pdf` — generates and returns a PDF with company name, customer details, line items table, totals, and status
- Update `hud-finance.tsx`:
  - Invoice detail view should show an editable line items table
  - Add/remove line item rows
  - "Download PDF" button
  - "Send Invoice" button (uses the email system from 2.1 to email the PDF to the customer)

### 3.2 — Time Tracking: Add Timer and Reports

Currently: CRUD for time entries with rates. No live timer, no reporting.

- Update `hud-time-tracking.tsx`:
  - Add a live start/stop timer at the top of the page with a running clock display
  - When stopped, auto-create a time entry with the elapsed duration
  - Add a weekly timesheet view (table: rows = days, columns = customers/projects)
  - Add summary stats: total hours this week, total billable amount, hours by customer
- The timer state can be client-side only (localStorage for persistence across page refreshes)

### 3.3 — Products: Add Categories View

Currently: Flat product list.

- Add a category filter/tabs at the top of the products page
- Add bulk actions (activate/deactivate multiple products)
- Show a summary card: total products, total active, revenue per product (linked from invoices)

### 3.4 — Forms: Add Visual Field Builder

Currently: Form fields are added through a basic dialog. No drag-and-drop.

- Update `hud-forms.tsx` form editor:
  - Show existing fields as a sortable list (drag handle on the left to reorder)
  - Each field row shows: field type icon, label, required badge, and delete button
  - Inline editing: click a field to expand and edit label, placeholder, options (for select/radio), validation rules
  - Add field type options: text, email, phone, textarea, select dropdown, radio buttons, checkbox, date, number, file upload
  - Add a "Preview" tab that renders the form as a user would see it
- Install `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop (these are lightweight and work well with React)

### 3.5 — Pages Builder: Add Visual Editing

Currently: 6 block types can be added but there's no reordering, no inline editing, and no live preview.

- Update the Blocks tab in the page editor:
  - Make blocks reorderable via drag-and-drop (use `@dnd-kit` from 3.4)
  - Each block should be expandable to edit its content inline:
    - Hero: title, subtitle, CTA text, CTA URL, background image URL
    - Text: rich text content (use a textarea with markdown support)
    - Features Grid: array of features, each with icon, title, description
    - CTA: heading, description, button text, button URL
    - Testimonials: array of testimonials with quote, author, role
    - Image: image URL, alt text, caption
  - Add a delete button on each block
- Update the Preview tab to actually render the blocks as HTML (show a real preview of the page)
- Make the public page route (`/p/:tenantSlug/:pageSlug`) render the saved blocks as a real webpage

### 3.6 — Funnels: Same Treatment as Pages

Apply the same block editing, reordering, and preview improvements from 3.5 to funnels and funnel steps.

---

## SECTION 4: Code Quality & Architecture

### 4.1 — Split routes.ts

The 3,667-line `server/routes.ts` monolith needs to be split into separate files:

Create a `server/routes/` directory with these files:
- `auth.routes.ts` — register, login, logout, user profile
- `booking.routes.ts` — event types, availability, bookings, time slots
- `crm.routes.ts` — customers, leads, pipelines, notes
- `finance.routes.ts` — invoices, invoice items
- `support.routes.ts` — tickets
- `time-tracking.routes.ts` — time entries
- `forms.routes.ts` — forms, form responses
- `email.routes.ts` — email templates, logs, sending
- `agents.routes.ts` — AI agents, runs
- `media.routes.ts` — media assets, upload
- `pages.routes.ts` — pages, blocks
- `funnels.routes.ts` — funnels, steps
- `phone.routes.ts` — phone numbers, calls, SMS, Twilio webhooks
- `documents.routes.ts` — documents, signers, signing
- `admin.routes.ts` — tenant, team, settings, domains, groups, features
- `public.routes.ts` — all public/unauthenticated endpoints

Each file should export a function like `export function registerCrmRoutes(app: Express) { ... }` and the main `routes.ts` should import and call all of them.

### 4.2 — Split schema.ts

Split `shared/schema.ts` into domain files under `shared/schema/`:
- `index.ts` (re-exports everything)
- `core.ts` (tenants, users, groups, features, settings)
- `booking.ts` (event types, availability, bookings)
- `crm.ts` (pipelines, customers, leads, notes)
- `finance.ts` (invoices, invoice items)
- `support.ts` (tickets)
- `forms.ts` (forms, responses)
- `email.ts` (templates, logs)
- `agents.ts` (agents, runs)
- `media.ts` (assets)
- `content.ts` (pages, funnels, steps)
- `phone.ts` (numbers, calls, SMS)
- `documents.ts` (documents, signers, activity log)

### 4.3 — Add basic tests

Create a `tests/` directory with at least:
- `tests/auth.test.ts` — test register, login, logout, session persistence
- `tests/booking.test.ts` — test time slot generation algorithm with various availability rules, conflicts, and edge cases
- `tests/crm.test.ts` — test customer and lead CRUD, pipeline stage progression
- Use Vitest as the test runner (add `vitest` as a devDependency, add a `test` script to package.json)

### 4.4 — Add GitHub Actions CI

Create `.github/workflows/ci.yml`:
- Run on push and PR to main
- Steps: checkout, setup Node, install deps, typecheck (`npm run check`), run tests (`npm test`)

---

## SECTION 5: README & First Impressions

### 5.1 — Add screenshots to README
After completing the above, take screenshots of:
- Landing page
- Dashboard
- CRM Customers with detail panel open
- Leads pipeline (kanban)
- Finance with invoices
- Page builder with blocks
- Dark mode

Add them to a `docs/screenshots/` folder and embed them in README.md in a grid layout.

### 5.2 — Fix README inconsistencies
- The `.env.example` still says "Calendar Core" at the top — rename to "SaaS Killer"
- Document the default port (3000 after fix)
- Add a "Quick Start" section that's copy-paste-able:
```
git clone https://github.com/bouncerguy/SaaSKiller.git
cd SaaSKiller
npm install
cp .env.example .env  # edit DATABASE_URL and SESSION_SECRET
npm run db:push
npm run dev
# Open http://localhost:3000
# Login: alex@acmeconsulting.com / password123
```

---

## Order of Operations

Do these in this exact order:
1. Section 1 (bugs) — everything else depends on the app running correctly
2. Section 4.1 and 4.2 (split routes and schema) — makes all subsequent work cleaner
3. Section 2 (shell modules) — biggest impact on credibility
4. Section 3 (thin modules) — depth improvements
5. Section 4.3 and 4.4 (tests and CI) — lock in quality
6. Section 5 (README and screenshots) — final polish

After each section, run the app and verify nothing is broken before proceeding.
