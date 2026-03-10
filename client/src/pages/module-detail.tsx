import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowLeft, Calendar, Users, ShoppingBag, HeadphonesIcon, DollarSign,
  Timer, FileText, Mail, Bot, Image, Video, FileCode, GitBranch, Phone,
  FileSignature, Check, Layers, ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ModuleFeature {
  title: string;
  description: string;
}

interface ModuleData {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  borderColor: string;
  features: ModuleFeature[];
  highlights: string[];
  replaces: string;
  replacesCost: string;
}

const moduleData: ModuleData[] = [
  {
    slug: "scheduling",
    title: "Scheduling",
    tagline: "Professional booking, zero friction",
    description: "A complete scheduling system that lets clients book time with you based on your real-time availability. Supports multiple event types, timezone-aware slots, calendar sync, and embeddable widgets you can drop into any website.",
    icon: Calendar,
    color: "text-primary",
    bg: "bg-primary/[0.08] dark:bg-primary/[0.15]",
    borderColor: "border-primary/20",
    features: [
      { title: "Event Types", description: "Create unlimited event types with custom durations (15, 30, 60, 90 min+), locations (in-person, phone, video, custom), descriptions, and slugs for shareable booking links." },
      { title: "Availability Rules", description: "Define your weekly availability per day of the week with start/end times. The system automatically calculates open slots for each day." },
      { title: "Timezone-Aware Booking", description: "Visitors select their timezone and see available slots in their local time. All times are stored in UTC and converted dynamically." },
      { title: "Public Booking Pages", description: "Each event type gets a shareable public URL at /book/:tenant/:event with a date picker, time slot grid, and booking form." },
      { title: "Calendar Sync", description: "Import your existing calendar via ICS feed URL to prevent double-bookings. Busy times from external calendars are automatically blocked." },
      { title: "Embeddable Widgets", description: "Embed your booking calendar on any website with four embed modes: inline, popup, floating button, or iframe. Copy-paste snippet generation included." },
      { title: "Booking Management", description: "View, confirm, and cancel bookings from the admin dashboard. See attendee details, meeting times, and video conference links." },
      { title: "Video Integration", description: "Auto-generate Jitsi Meet rooms or attach Zoom links to video event types. Join Meeting buttons appear on booking confirmations." },
    ],
    highlights: [
      "Unlimited event types and bookings",
      "No per-seat or per-booking fees",
      "White-labeled public booking pages",
      "Works with any ICS-compatible calendar",
    ],
    replaces: "Calendly",
    replacesCost: "$12/mo",
  },
  {
    slug: "crm",
    title: "CRM",
    tagline: "Know every customer, close every deal",
    description: "A full customer relationship management system with separate customer and lead databases, visual kanban pipeline boards, notes, and seamless lead-to-customer conversion. See everything about a contact in one place.",
    icon: Users,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-600/[0.08] dark:bg-emerald-600/[0.15]",
    borderColor: "border-emerald-600/20",
    features: [
      { title: "Customer Management", description: "Store and manage your full customer database with name, email, phone, company, payment status (Current, Past Due 30/60, Collections), and custom notes." },
      { title: "Lead Pipeline", description: "Visual kanban board for managing leads through custom pipeline stages. Drag-and-drop leads between columns to track progress from first contact to close." },
      { title: "Lead-to-Customer Conversion", description: "One-click conversion from lead to customer when a deal closes. All associated data carries over seamlessly." },
      { title: "Cross-Module Linking", description: "View a customer's support tickets, invoices, and time entries directly from their profile. Everything connected, nothing siloed." },
      { title: "Notes System", description: "Add timestamped notes to any customer or lead. Keep your team aligned on communication history and context." },
      { title: "Search & Filter", description: "Find contacts instantly with full-text search across names, emails, companies, and phone numbers." },
      { title: "Payment Status Tracking", description: "Track whether customers are current, 30 days past due, 60 days past due, or in collections. Visual badges make status obvious at a glance." },
      { title: "Pipeline Customization", description: "Create custom pipeline stages that match your sales process. Each pipeline has its own board with drag-and-drop lead management." },
    ],
    highlights: [
      "Unlimited contacts and leads",
      "Visual kanban pipeline boards",
      "Cross-module data linking",
      "One-click lead conversion",
    ],
    replaces: "HubSpot CRM",
    replacesCost: "$20/mo",
  },
  {
    slug: "products",
    title: "Products & Services",
    tagline: "Your complete product catalog",
    description: "Manage your entire product and service catalog with flexible pricing, billing cycles, categories, and active/inactive status controls. Everything your team needs to know about what you sell, in one place.",
    icon: ShoppingBag,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-600/[0.08] dark:bg-orange-600/[0.15]",
    borderColor: "border-orange-600/20",
    features: [
      { title: "Product Catalog", description: "Create and manage products and services with names, descriptions, pricing (stored in cents for precision), and category tagging." },
      { title: "Billing Cycles", description: "Support for one-time, monthly, quarterly, and yearly billing cycles. Perfect for subscription services, retainers, and project-based work." },
      { title: "Category Organization", description: "Organize products into categories for easy browsing. Filter and search across your entire catalog." },
      { title: "Active/Inactive Control", description: "Toggle products on and off without deleting them. Keep historical records while hiding items no longer available." },
      { title: "Price Management", description: "All prices stored in cents for financial precision. Display formatting handles currency presentation automatically." },
      { title: "Search & Filter", description: "Full-text search across product names, descriptions, and categories. Find any item instantly." },
    ],
    highlights: [
      "Unlimited products and services",
      "Flexible billing cycle support",
      "Precise cent-based pricing",
      "Category-based organization",
    ],
    replaces: "Shopify Basic",
    replacesCost: "$39/mo",
  },
  {
    slug: "support",
    title: "Support Tickets",
    tagline: "Never drop the ball on customer issues",
    description: "A ticket management system with priority levels, status workflows, customer linking, and team assignment. Track every support request from open to resolved with full visibility for your team.",
    icon: HeadphonesIcon,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-600/[0.08] dark:bg-rose-600/[0.15]",
    borderColor: "border-rose-600/20",
    features: [
      { title: "Ticket Creation", description: "Create tickets with subject, description, priority level, and optional customer linking. Tickets can be created by team members or generated from other modules." },
      { title: "Priority Levels", description: "Four priority levels: Low, Medium, High, and Urgent. Color-coded badges make it easy to identify what needs attention first." },
      { title: "Status Workflow", description: "Five-stage workflow: Open, In Progress, Waiting, Resolved, and Closed. Track every ticket through its lifecycle." },
      { title: "Customer Linking", description: "Link tickets to existing customers. When viewing a customer profile, see all their associated tickets in one place." },
      { title: "Team Assignment", description: "Assign tickets to specific team members. Keep accountability clear and workload visible." },
      { title: "Search & Filter", description: "Filter tickets by status, priority, and assignee. Search across subjects and descriptions." },
    ],
    highlights: [
      "Unlimited tickets",
      "Four priority levels with visual badges",
      "Five-stage status workflow",
      "Customer and team linking",
    ],
    replaces: "Zendesk",
    replacesCost: "$55/mo",
  },
  {
    slug: "finance",
    title: "Finance & Invoicing",
    tagline: "Professional invoicing, clear financials",
    description: "Create and manage invoices with auto-numbering, status tracking, customer linking, and revenue dashboards. See your outstanding and collected revenue at a glance.",
    icon: DollarSign,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-600/[0.08] dark:bg-emerald-600/[0.15]",
    borderColor: "border-emerald-600/20",
    features: [
      { title: "Invoice Creation", description: "Create professional invoices with auto-generated sequential numbers (INV-0001, INV-0002, etc.), customer linking, line items, and due dates." },
      { title: "Status Tracking", description: "Five invoice statuses: Draft, Sent, Paid, Overdue, and Cancelled. Visual badges and filters make management effortless." },
      { title: "Revenue Dashboard", description: "See total revenue collected and outstanding amounts at a glance. Revenue totals update in real-time as invoice statuses change." },
      { title: "Customer Billing", description: "Link invoices to customers. View all invoices for a customer from their profile page." },
      { title: "Amount Management", description: "All amounts stored in cents for financial precision. Automatic formatting for display." },
      { title: "Search & Filter", description: "Filter invoices by status, search by invoice number or customer name. Find any invoice instantly." },
    ],
    highlights: [
      "Auto-numbered invoices (INV-0001+)",
      "Real-time revenue tracking",
      "Five status stages",
      "Customer-linked billing history",
    ],
    replaces: "FreshBooks",
    replacesCost: "$17/mo",
  },
  {
    slug: "time-tracking",
    title: "Time Tracking",
    tagline: "Track every billable minute",
    description: "Log time entries with start/end times, auto-calculated durations, billable/non-billable flags, hourly rates, and customer linking. See your time grouped by date with running totals.",
    icon: Timer,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-600/[0.08] dark:bg-violet-600/[0.15]",
    borderColor: "border-violet-600/20",
    features: [
      { title: "Time Entry Logging", description: "Log time with descriptions, start/end times, and automatic duration calculation. No mental math required." },
      { title: "Billable vs Non-Billable", description: "Flag each entry as billable or non-billable. See your billable utilization at a glance." },
      { title: "Hourly Rates", description: "Set hourly rates per entry. The system calculates estimated earnings automatically based on duration and rate." },
      { title: "Customer Linking", description: "Link time entries to customers. View all time logged for a customer from their profile." },
      { title: "Date Grouping", description: "Time entries are automatically grouped by date for easy daily review and reporting." },
      { title: "Running Totals", description: "See total hours, billable hours, and estimated earnings across all entries or filtered by customer." },
    ],
    highlights: [
      "Auto-calculated durations",
      "Billable/non-billable tracking",
      "Hourly rate and earnings calculation",
      "Grouped by date for daily review",
    ],
    replaces: "Toggl",
    replacesCost: "$10/mo",
  },
  {
    slug: "forms",
    title: "Forms & Surveys",
    tagline: "Build forms, collect data, grow your list",
    description: "A form builder with multiple field types, public submission links, field validation, and response tracking. Build contact forms, surveys, intake forms, and more without any coding.",
    icon: FileText,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-600/[0.08] dark:bg-cyan-600/[0.15]",
    borderColor: "border-cyan-600/20",
    features: [
      { title: "Form Builder", description: "Visual form builder with support for text, email, phone, number, textarea, select dropdown, checkbox, and URL field types." },
      { title: "Public Form Pages", description: "Each published form gets a shareable public URL at /forms/:tenant/:form with tenant branding and field validation." },
      { title: "Field Validation", description: "Required field validation, email format checking, and custom field labels and placeholders." },
      { title: "Response Tracking", description: "View all form submissions in a clean response viewer. See who submitted what and when." },
      { title: "Status Workflow", description: "Three-stage workflow: Draft, Published, and Archived. Only published forms are accessible via public URLs." },
      { title: "AI Agent Triggers", description: "Form submissions can trigger AI Agent workflows for automated follow-up actions." },
    ],
    highlights: [
      "Eight field types supported",
      "Branded public submission pages",
      "Built-in field validation",
      "Response viewer with timestamps",
    ],
    replaces: "Typeform",
    replacesCost: "$25/mo",
  },
  {
    slug: "email",
    title: "Email Campaigns",
    tagline: "Reach your audience, track results",
    description: "Create and manage email templates with HTML and text body support, category tagging, variable substitution, and a sent log viewer with delivery status tracking.",
    icon: Mail,
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-600/[0.08] dark:bg-pink-600/[0.15]",
    borderColor: "border-pink-600/20",
    features: [
      { title: "Template Management", description: "Create email templates with both HTML and plain text bodies. Design once, use many times for consistent messaging." },
      { title: "Category Tagging", description: "Organize templates by category: transactional, marketing, or notification. Filter quickly by type." },
      { title: "Variable Support", description: "Define template variables (like {{name}}, {{company}}) for dynamic personalization when sending." },
      { title: "Sent Log Viewer", description: "Track every email sent with recipient, subject, template used, and delivery status." },
      { title: "Status Tracking", description: "Monitor email delivery with status tracking: Queued, Sent, Failed, and Bounced." },
      { title: "Active/Inactive Toggle", description: "Enable or disable templates without deleting them. Keep a library of ready-to-use templates." },
    ],
    highlights: [
      "HTML and plain text support",
      "Variable substitution for personalization",
      "Delivery status tracking",
      "Category-based organization",
    ],
    replaces: "Mailchimp",
    replacesCost: "$13/mo",
  },
  {
    slug: "ai-agents",
    title: "AI Agents",
    tagline: "Automate the repetitive, focus on what matters",
    description: "Configure automated workflow agents with triggers, actions, and run history. Agents can fire on schedules, form submissions, new customers, new tickets, or manual triggers.",
    icon: Bot,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-600/[0.08] dark:bg-indigo-600/[0.15]",
    borderColor: "border-indigo-600/20",
    features: [
      { title: "Configurable Triggers", description: "Five trigger types: Manual, Schedule, Form Submission, New Customer, and New Ticket. Agents react to real business events." },
      { title: "Action Definitions", description: "Define agent actions as JSON configurations. Build custom automation logic for any business process." },
      { title: "Manual Execution", description: "Run any agent on-demand with a single click. Test workflows before enabling automatic triggers." },
      { title: "Run History", description: "Full run history with status tracking (Success, Failed, Running), timestamps, and result details for debugging." },
      { title: "Status Workflow", description: "Three-stage lifecycle: Draft, Active, and Paused. Only active agents respond to their configured triggers." },
      { title: "HubSpot Import", description: "Import HubSpot workflows as draft agents. Bring your existing automation into SaaS Killer with one click." },
    ],
    highlights: [
      "Five trigger types",
      "Full run history with status",
      "One-click manual execution",
      "HubSpot workflow import",
    ],
    replaces: "Zapier",
    replacesCost: "$20/mo",
  },
  {
    slug: "media",
    title: "Media Library",
    tagline: "Your digital asset command center",
    description: "A digital asset library for managing images, files, and media with folder organization, tag-based search, metadata editing, and URL-based asset registration.",
    icon: Image,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-600/[0.08] dark:bg-amber-600/[0.15]",
    borderColor: "border-amber-600/20",
    features: [
      { title: "Grid View Gallery", description: "Browse your media assets in a visual grid with image previews, file type icons, and quick metadata display." },
      { title: "Folder Organization", description: "Organize assets into folders for structured file management. Filter by folder to find what you need." },
      { title: "Tag-Based Search", description: "Add tags to assets for flexible categorization. Search across tags, file names, and alt text." },
      { title: "Metadata Editing", description: "Edit alt text, tags, and folder assignments for any asset. Keep your library well-organized and accessible." },
      { title: "URL-Based Registration", description: "Register media assets by URL. Point to existing hosted files without re-uploading." },
      { title: "File Type Support", description: "Support for images (with previews), documents, PDFs, and any file type with appropriate icons." },
    ],
    highlights: [
      "Visual grid with previews",
      "Folder and tag organization",
      "Metadata editing",
      "URL-based asset registration",
    ],
    replaces: "Cloudinary",
    replacesCost: "$89/mo",
  },
  {
    slug: "video",
    title: "Video Conferencing",
    tagline: "Meet face-to-face, no extra subscriptions",
    description: "Built-in video conferencing with Jitsi Meet integration that auto-generates unique meeting rooms per booking, plus support for custom Zoom links per event type.",
    icon: Video,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-600/[0.08] dark:bg-teal-600/[0.15]",
    borderColor: "border-teal-600/20",
    features: [
      { title: "Jitsi Meet Integration", description: "Auto-generate unique Jitsi Meet rooms for each video booking. No accounts required for attendees, works in any browser." },
      { title: "Zoom Link Support", description: "Add custom Zoom meeting links to any event type. Support for teams that prefer Zoom for their video calls." },
      { title: "Provider Configuration", description: "Choose your video provider (Jitsi or Zoom) from the Settings page. Configure your Jitsi server URL for self-hosted instances." },
      { title: "Auto-Generated Rooms", description: "Each booking automatically gets a unique meeting room URL. No manual room creation needed." },
      { title: "Join Meeting Buttons", description: "\"Join Meeting\" buttons appear on booking confirmations and in the admin bookings list. One click to start." },
      { title: "Self-Hosted Option", description: "Point to your own Jitsi server for complete control over your video infrastructure. No third-party dependencies." },
    ],
    highlights: [
      "Free, open-source Jitsi integration",
      "Auto-generated meeting rooms",
      "No attendee accounts required",
      "Self-hostable video infrastructure",
    ],
    replaces: "Zoom",
    replacesCost: "$13/mo",
  },
  {
    slug: "pages",
    title: "Website Pages",
    tagline: "Build and publish pages in minutes",
    description: "A block-based page builder for creating public website pages with hero sections, text content, feature grids, calls-to-action, testimonials, and image blocks. Publish instantly with tenant-branded URLs.",
    icon: FileCode,
    color: "text-lime-600 dark:text-lime-400",
    bg: "bg-lime-600/[0.08] dark:bg-lime-600/[0.15]",
    borderColor: "border-lime-600/20",
    features: [
      { title: "Block-Based Builder", description: "Build pages using six block types: Hero (with background color, title, subtitle, CTA), Text (rich content), Features Grid, CTA, Testimonials, and Image blocks." },
      { title: "Status Workflow", description: "Three-stage workflow: Draft, Published, and Archived. Only published pages are visible at their public URLs." },
      { title: "Homepage Toggle", description: "Designate any page as your homepage. Only one page can be the homepage at a time." },
      { title: "Preview Capability", description: "Preview your page before publishing to see exactly how it will look to visitors." },
      { title: "Public URLs", description: "Published pages are accessible at /s/:tenantSlug/:pageSlug with tenant branding (logo, name, brand color)." },
      { title: "Custom Domain Ready", description: "Pages work with the Website & Domains module for custom domain mapping and DNS configuration." },
    ],
    highlights: [
      "Six block types for flexible layouts",
      "Instant publishing with public URLs",
      "Homepage designation",
      "Tenant-branded public pages",
    ],
    replaces: "Leadpages",
    replacesCost: "$37/mo",
  },
  {
    slug: "funnels",
    title: "Funnels",
    tagline: "Guide visitors from click to conversion",
    description: "Build multi-step sales funnels with opt-in, sales, checkout, thank-you, and custom step types. Each step has its own block-based content. Reorder steps and publish funnels with public URLs.",
    icon: GitBranch,
    color: "text-fuchsia-600 dark:text-fuchsia-400",
    bg: "bg-fuchsia-600/[0.08] dark:bg-fuchsia-600/[0.15]",
    borderColor: "border-fuchsia-600/20",
    features: [
      { title: "Multi-Step Builder", description: "Create funnels with multiple steps, each with its own name, type, and block-based content. Steps render sequentially with navigation." },
      { title: "Step Types", description: "Five step types: Opt-In (email capture), Sales (product pitch), Checkout (payment), Thank You (confirmation), and Custom (anything else)." },
      { title: "Block-Based Content", description: "Each funnel step uses the same block-based content builder as Pages: hero, text, features, CTA, testimonials, and image blocks." },
      { title: "Visual Pipeline", description: "See all your funnel steps in a visual pipeline view. Drag and reorder steps to optimize your conversion flow." },
      { title: "Public URLs", description: "Published funnels are accessible at /f/:tenantSlug/:funnelSlug with step-by-step navigation and tenant branding." },
      { title: "Status Management", description: "Draft and Published statuses. Build your funnel privately, then publish when ready for visitors." },
    ],
    highlights: [
      "Five step types for any funnel",
      "Block-based content per step",
      "Visual step pipeline",
      "Step-by-step public navigation",
    ],
    replaces: "ClickFunnels",
    replacesCost: "$97/mo",
  },
  {
    slug: "phone",
    title: "Phone System",
    tagline: "A virtual PBX in your browser",
    description: "A complete virtual phone system with Twilio integration for managing phone numbers, call routing, voicemail, call logs, and SMS messaging. Configure your own Twilio credentials and manage everything from one dashboard.",
    icon: Phone,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-600/[0.08] dark:bg-teal-600/[0.15]",
    borderColor: "border-teal-600/20",
    features: [
      { title: "Phone Number Management", description: "Search, purchase, and manage phone numbers through Twilio. View capabilities (voice, SMS, MMS) and toggle numbers active/inactive." },
      { title: "Call Forwarding", description: "Configure call forwarding per phone number. Incoming calls ring through to your specified forwarding number." },
      { title: "Voicemail", description: "Enable voicemail per number with custom greeting messages. Voicemail recordings are linked to call log entries." },
      { title: "Call Logs", description: "Full call history with direction (inbound/outbound), duration, status (queued, ringing, in-progress, completed, busy, no-answer, failed), and optional customer linking." },
      { title: "SMS Messaging", description: "Send and receive SMS messages. View message history with direction, delivery status, and customer linking." },
      { title: "Twilio Configuration", description: "Enter your own Twilio Account SID and Auth Token. Test connection before going live. All credentials stored per-tenant." },
      { title: "Webhook Endpoints", description: "Automatic webhook handling for incoming calls and SMS. Status callbacks update call/message records in real-time." },
      { title: "Dashboard Overview", description: "Quick stats showing total calls, messages sent, and active numbers. Recent activity feed for at-a-glance monitoring." },
    ],
    highlights: [
      "Bring your own Twilio account",
      "Call forwarding and voicemail",
      "Full call and SMS logs",
      "Real-time status tracking",
    ],
    replaces: "Grasshopper",
    replacesCost: "$28/mo",
  },
  {
    slug: "documents",
    title: "Documents & Signing",
    tagline: "Send, sign, and seal — no paper needed",
    description: "Create contracts and documents, add signers with role-based access (signer, viewer, approver), define signing order, and capture electronic signatures through a secure public signing page. Full audit trail included.",
    icon: FileSignature,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-600/[0.08] dark:bg-indigo-600/[0.15]",
    borderColor: "border-indigo-600/20",
    features: [
      { title: "Document Creation", description: "Create documents and contracts with title, description, and rich text content. Link documents to customers for organized record-keeping." },
      { title: "Signer Management", description: "Add multiple signers with three roles: Signer (must sign), Viewer (read-only access), and Approver (must approve). Define signing order." },
      { title: "Send for Signing", description: "When ready, send documents to signers. The status changes from Draft to Sent, and signing links become active." },
      { title: "Public Signing Pages", description: "Each signer gets a unique URL at /sign/:tenant/:doc/:signerId with the document content, tenant branding, and signature capture." },
      { title: "Signature Capture", description: "Signers type their name which renders in a signature font. Agreement checkbox for legal consent. IP address logging for audit." },
      { title: "Auto-Completion", description: "When all required signers have signed, the document automatically moves to Completed status. Activity log records every step." },
      { title: "Decline Flow", description: "Signers can decline to sign with an optional reason. Declined status is tracked and logged in the activity trail." },
      { title: "Activity Audit Log", description: "Every action is logged: created, sent, viewed, signed, declined, completed. Includes timestamps, IP addresses, and signer details." },
      { title: "Expiration Dates", description: "Set optional expiration dates on documents. Expired documents cannot be signed, enforced both in UI and server-side." },
      { title: "Signing Progress", description: "Visual progress bar showing how many signers have completed signing out of the total required." },
    ],
    highlights: [
      "Role-based signer management",
      "Secure public signing pages",
      "Full audit trail with IP logging",
      "Auto-completion when all sign",
    ],
    replaces: "DocuSign",
    replacesCost: "$25/mo",
  },
];

export default function ModuleDetail() {
  const params = useParams<{ moduleSlug: string }>();
  const mod = moduleData.find((m) => m.slug === params.moduleSlug);

  if (!mod) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Module not found</h1>
          <Link href="/">
            <Button variant="outline" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const Icon = mod.icon;
  const currentIndex = moduleData.findIndex((m) => m.slug === mod.slug);
  const prevModule = currentIndex > 0 ? moduleData[currentIndex - 1] : null;
  const nextModule = currentIndex < moduleData.length - 1 ? moduleData[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-landing">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-semibold text-sm">SaaS Killer</span>
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-5 mb-8">
            <div className={`w-14 h-14 rounded-xl ${mod.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`h-7 w-7 ${mod.color}`} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" data-testid="text-module-title">
                {mod.title}
              </h1>
              <p className="text-lg text-muted-foreground mt-1" data-testid="text-module-tagline">
                {mod.tagline}
              </p>
            </div>
          </div>

          <p className="text-base text-muted-foreground leading-relaxed max-w-3xl" data-testid="text-module-description">
            {mod.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Badge variant="outline" className={`${mod.color} border-current/20`}>
              Replaces {mod.replaces} ({mod.replacesCost})
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              Self-hosted
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              MIT Licensed
            </Badge>
          </div>
        </div>
      </section>

      <section className="pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-6">Key Highlights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mod.highlights.map((h) => (
              <div key={h} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className={`w-6 h-6 rounded-full ${mod.bg} flex items-center justify-center flex-shrink-0`}>
                  <Check className={`h-3.5 w-3.5 ${mod.color}`} />
                </div>
                <span className="text-sm font-medium">{h}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-6">Features & Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mod.features.map((feature, i) => (
              <Card key={i} className="overflow-visible" data-testid={`card-feature-${i}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${mod.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Layers className={`h-4 w-4 ${mod.color}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-[15px]">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 px-6 border-t pt-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-3">Ready to get started?</h2>
          <p className="text-muted-foreground mb-3 max-w-lg mx-auto">
            Stop paying {mod.replacesCost} for {mod.replaces}. Get {mod.title} and 14 other modules with SaaS Killer — free and self-hosted.
          </p>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Every module is off by default. Enable only what you need — your dashboard stays clean until you say otherwise.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/auth">
              <Button size="lg" data-testid="button-get-started">
                Get Started Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg" data-testid="button-view-all-modules">
                View All Modules
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {(prevModule || nextModule) && (
        <section className="pb-16 px-6 border-t pt-12">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">Explore other modules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevModule && (
                <Link href={`/modules/${prevModule.slug}`}>
                  <Card className="overflow-visible hover-elevate transition-colors cursor-pointer" data-testid={`link-prev-module-${prevModule.slug}`}>
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-md ${prevModule.bg} flex items-center justify-center flex-shrink-0`}>
                        <prevModule.icon className={`h-5 w-5 ${prevModule.color}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Previous</p>
                        <p className="font-medium text-sm">{prevModule.title}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
              {nextModule && (
                <Link href={`/modules/${nextModule.slug}`}>
                  <Card className="overflow-visible hover-elevate transition-colors cursor-pointer" data-testid={`link-next-module-${nextModule.slug}`}>
                    <CardContent className="p-5 flex items-center gap-4 justify-end text-right">
                      <div>
                        <p className="text-xs text-muted-foreground">Next</p>
                        <p className="font-medium text-sm">{nextModule.title}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-md ${nextModule.bg} flex items-center justify-center flex-shrink-0`}>
                        <nextModule.icon className={`h-5 w-5 ${nextModule.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        SaaS Killer — Open Source Business Operating System. MIT Licensed.
      </footer>
    </div>
  );
}
