import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Code,
  Globe,
  Link2,
  Settings,
  Video,
  BookOpen,
  Lightbulb,
  HelpCircle,
  ExternalLink,
  Zap,
} from "lucide-react";

const quickStartSteps = [
  {
    icon: Calendar,
    title: "Create an event type",
    description:
      "Go to Event Types and create your first bookable meeting — set the title, duration, and location.",
  },
  {
    icon: Clock,
    title: "Set your availability",
    description:
      "Open Availability and define the days and hours you're free. Time slots are generated automatically.",
  },
  {
    icon: Link2,
    title: "Share your booking link",
    description:
      'Click "Share / Embed" on any event type to get your direct booking URL or an embeddable iframe snippet.',
  },
  {
    icon: Globe,
    title: "Connect your calendar (optional)",
    description:
      "Paste an ICS feed URL in Settings to block off busy times from Google Calendar, Outlook, or Apple Calendar.",
  },
];

const faqItems = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I create my first event type?",
        a: 'Navigate to Event Types in the sidebar, then click "New Event Type." Fill in a title, duration, and meeting location (video link, phone, or in-person address). Toggle it active when you\'re ready.',
      },
      {
        q: "How do people book meetings with me?",
        a: "Each event type has a unique booking URL. Share it directly or embed it on your website. Visitors pick a date, choose an available time slot, and fill in their details to confirm.",
      },
      {
        q: "Can I have multiple event types?",
        a: "Yes — create as many as you need. For example, a 15-minute intro call, a 30-minute consultation, and a 60-minute deep dive. Each gets its own booking page and link.",
      },
    ],
  },
  {
    category: "Availability & Scheduling",
    questions: [
      {
        q: "How does the availability engine work?",
        a: "You define weekly rules (e.g., Monday–Friday, 9 AM–12 PM and 1 PM–5 PM). The engine generates time slots from those rules, then subtracts any existing bookings and external calendar busy times to show only truly open slots.",
      },
      {
        q: "Can I set different hours for different days?",
        a: "Yes. Each availability rule is per day of the week, so you can set Monday 9–5, Tuesday 10–3, and leave weekends off entirely.",
      },
      {
        q: "What timezone are my availability rules in?",
        a: "Rules use the timezone set in your Settings. Visitors see slots converted to their own timezone automatically via the timezone selector on the booking page.",
      },
      {
        q: "How do I block off time (lunch, personal time, etc.)?",
        a: "Create separate availability rules with gaps. For example, set 9 AM–12 PM and 1 PM–5 PM to keep noon–1 PM free. Any time not covered by a rule is automatically unavailable.",
      },
    ],
  },
  {
    category: "Calendar Integration",
    questions: [
      {
        q: "How do I connect my existing calendar?",
        a: 'Go to Settings and paste your calendar\'s ICS/iCal feed URL. Click "Test Connection" to verify it works. Once saved, busy times from that calendar are automatically excluded from your available slots.',
      },
      {
        q: "Where do I find my ICS feed URL?",
        a: "Google Calendar: Settings → select calendar → 'Secret address in iCal format.' Outlook: Calendar settings → Shared calendars → Publish a calendar. Apple Calendar: Share the calendar via a public link. Most calendar apps support ICS feeds — look for 'Subscribe' or 'Share' options.",
      },
      {
        q: "Does this require any API keys or OAuth?",
        a: "No. SaaS Killer uses standard ICS feeds, which are simple URLs that return calendar data. No API keys, no OAuth tokens, no third-party app permissions needed.",
      },
      {
        q: "How often does it check my external calendar?",
        a: "The ICS feed is fetched and cached for 5 minutes. When someone tries to book, it also validates against the latest feed data to prevent conflicts.",
      },
    ],
  },
  {
    category: "Embedding & Sharing",
    questions: [
      {
        q: "How do I embed a booking page on my website?",
        a: 'Click "Share / Embed" on any event type, switch to the "Embed Code" tab, and copy the iframe snippet. Paste it into your website\'s HTML where you want the booking form to appear.',
      },
      {
        q: "Can I customize the look of the embedded booking page?",
        a: "The embed inherits your brand color and logo set in Settings. You can also adjust the iframe dimensions in the snippet to fit your layout.",
      },
      {
        q: "Is there a full embed SDK?",
        a: "Yes — the Embed page in the sidebar offers multiple embed modes: inline, popup, floating widget, and plain iframe. Each generates a ready-to-paste code snippet.",
      },
    ],
  },
  {
    category: "Meetings & Locations",
    questions: [
      {
        q: "How do I set up Zoom meetings?",
        a: "When creating or editing an event type, choose 'Video Call' as the location type, then paste your personal Zoom room link (e.g., https://zoom.us/j/1234567890) in the Location Details field. This link will be shared with the invitee upon booking.",
      },
      {
        q: "What location types are supported?",
        a: "Video Call (Zoom, Google Meet, or any video link), Phone Call (your number or theirs), and In-Person (a physical address). Each booking confirmation includes the location details.",
      },
    ],
  },
  {
    category: "Managing Bookings",
    questions: [
      {
        q: "How do I cancel a booking?",
        a: "Go to Bookings in the sidebar, find the booking, and click Cancel. You can add an optional reason. The invitee's time slot will become available again.",
      },
      {
        q: "Can invitees cancel or reschedule?",
        a: "Currently, cancellation is admin-only through the dashboard. Rescheduling support is on the roadmap.",
      },
      {
        q: "How do I view past bookings?",
        a: 'The Bookings page has tabs for Upcoming, Past, and Canceled bookings so you can review your full history.',
      },
    ],
  },
];

export default function AdminHelp() {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-4xl mx-auto" data-testid="page-help">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-help-title">
          Help & FAQ
        </h1>
        <p className="text-muted-foreground mt-1">
          Everything you need to get started with SaaS Killer
        </p>
      </div>

      <Card data-testid="card-quick-start">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {quickStartSteps.map((step, i) => (
              <div
                key={i}
                className="flex gap-3 p-3 rounded-lg border bg-muted/30"
                data-testid={`card-step-${i}`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <step.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">
                    <span className="text-muted-foreground mr-1.5">{i + 1}.</span>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6" data-testid="section-faq">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        {faqItems.map((section) => (
          <Card key={section.category} data-testid={`card-faq-${section.category.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Badge variant="secondary" className="font-normal text-xs">
                  {section.category}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Accordion type="multiple" className="w-full">
                {section.questions.map((item, i) => (
                  <AccordionItem key={i} value={`${section.category}-${i}`} className="border-b last:border-0">
                    <AccordionTrigger className="text-sm text-left hover:no-underline py-3" data-testid={`faq-question-${section.category.toLowerCase().replace(/\s+/g, "-")}-${i}`}>
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
