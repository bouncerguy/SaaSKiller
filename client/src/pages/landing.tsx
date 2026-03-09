import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, ShoppingBag, HeadphonesIcon, DollarSign, Timer, Code, Shield, Zap, ArrowRight, Check, Layers, FileText, Mail, Bot, Image } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const modules = [
  {
    icon: Calendar,
    title: "Scheduling",
    desc: "Event types, availability rules, timezone-aware booking, and embeddable widgets for any site.",
    color: "text-primary",
    bg: "bg-primary/[0.08] dark:bg-primary/[0.15]",
  },
  {
    icon: Users,
    title: "CRM",
    desc: "Customer management, lead pipelines with kanban boards, notes, and lead-to-customer conversion.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-600/[0.08] dark:bg-emerald-600/[0.15]",
  },
  {
    icon: ShoppingBag,
    title: "Products & Services",
    desc: "Product catalog with pricing, billing cycles, categories, and active/inactive management.",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-600/[0.08] dark:bg-orange-600/[0.15]",
  },
  {
    icon: HeadphonesIcon,
    title: "Support Tickets",
    desc: "Ticket management with priority levels, status workflow, customer linking, and team assignment.",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-600/[0.08] dark:bg-rose-600/[0.15]",
  },
  {
    icon: DollarSign,
    title: "Finance & Invoicing",
    desc: "Invoice management with auto-numbering, status tracking, revenue dashboards, and customer billing.",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-600/[0.08] dark:bg-emerald-600/[0.15]",
  },
  {
    icon: Timer,
    title: "Time Tracking",
    desc: "Log billable and non-billable hours, set rates, link to customers, and track estimated earnings.",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-600/[0.08] dark:bg-violet-600/[0.15]",
  },
  {
    icon: FileText,
    title: "Forms & Surveys",
    desc: "Drag-and-drop form builder with public links, field validation, and submission tracking.",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-600/[0.08] dark:bg-cyan-600/[0.15]",
  },
  {
    icon: Mail,
    title: "Email Campaigns",
    desc: "Email templates, campaign management, and audience targeting to reach your customers directly.",
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-600/[0.08] dark:bg-pink-600/[0.15]",
  },
  {
    icon: Bot,
    title: "AI Agents",
    desc: "Configurable AI assistants that automate workflows, answer questions, and handle repetitive tasks.",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-600/[0.08] dark:bg-indigo-600/[0.15]",
  },
  {
    icon: Image,
    title: "Media Library",
    desc: "Upload, organize, and manage images, documents, and files with tagging and search.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-600/[0.08] dark:bg-amber-600/[0.15]",
  },
];

const platformFeatures = [
  "Multi-tenant architecture with full data isolation",
  "Team management with OWNER and MEMBER roles",
  "Group-based permissions with per-user overrides",
  "Self-hostable on Replit, Docker, or any VPS",
  "Embeddable booking widgets (inline, popup, floating, iframe)",
  "Dark mode and custom branding per organization",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-[9999] border-b bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <Layers className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-[15px]" data-testid="text-brand">SaaS Killer</span>
            </div>
          </Link>
          <div className="flex items-center gap-1 flex-wrap">
            <ThemeToggle />
            <Link href="/auth">
              <Button variant="ghost" size="sm" data-testid="button-login">
                Log In
              </Button>
            </Link>
            <Link href="/hud">
              <Button size="sm" data-testid="button-dashboard">
                Dashboard
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent dark:from-primary/[0.08]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/[0.03] dark:bg-primary/[0.06] rounded-full blur-3xl -translate-y-1/2" />
          <div className="relative max-w-3xl mx-auto text-center px-6 pt-24 pb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/[0.08] dark:bg-primary/[0.15] text-primary text-xs font-medium mb-6">
              <Zap className="h-3 w-3" />
              Open-source business operating system
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-bold leading-[1.1]" data-testid="text-hero-title">
              Your business, your terms.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              SaaS Killer replaces the stack of SaaS tools eating your margins. Scheduling, CRM, invoicing, support, time tracking, forms, email, AI agents, media, and products — all in one self-hosted platform you actually own.
            </p>
            <div className="mt-8 flex items-center gap-3 justify-center flex-wrap">
              <Link href="/hud">
                <Button size="lg" data-testid="button-explore">
                  Explore the HUD
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/auth">
                <Button variant="outline" size="lg" data-testid="button-get-started">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-3xl font-semibold" data-testid="text-modules-title">
                Ten modules. One platform. Zero SaaS fees.
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Each module works on its own or together. Add what you need, skip what you don't.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((mod) => (
                <Card key={mod.title} className="overflow-visible hover-elevate transition-colors">
                  <CardContent className="p-6">
                    <div className={`w-10 h-10 rounded-md ${mod.bg} flex items-center justify-center mb-4`}>
                      <mod.icon className={`h-5 w-5 ${mod.color}`} />
                    </div>
                    <h3 className="font-medium text-[15px]">{mod.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{mod.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-6 border-t">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold">
                  Built for independence
                </h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  SaaS Killer is a modular business operating system designed for small businesses, freelancers, and agencies who are tired of paying monthly for five different tools. Self-host it, own your data, and run your business on your terms.
                </p>
                <ul className="mt-6 space-y-3">
                  {platformFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-chart-2/10 dark:bg-chart-2/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-chart-2" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center">
                <Card className="w-full max-w-sm overflow-visible">
                  <CardContent className="p-6">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">What you're replacing</div>
                    <div className="space-y-3">
                      {[
                        { name: "Calendly", cost: "$12/mo", module: "Scheduling" },
                        { name: "HubSpot CRM", cost: "$20/mo", module: "CRM" },
                        { name: "Shopify", cost: "$29/mo", module: "Products" },
                        { name: "FreshBooks", cost: "$17/mo", module: "Finance" },
                        { name: "Zendesk", cost: "$19/mo", module: "Support" },
                        { name: "Toggl", cost: "$9/mo", module: "Time Tracking" },
                        { name: "Typeform", cost: "$25/mo", module: "Forms" },
                        { name: "Mailchimp", cost: "$13/mo", module: "Email" },
                        { name: "Zapier", cost: "$20/mo", module: "AI Agents" },
                        { name: "Cloudinary", cost: "$89/mo", module: "Media" },
                      ].map((item) => (
                        <div key={item.name} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
                          <div>
                            <span className="text-sm line-through text-muted-foreground">{item.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">{item.cost}</span>
                          </div>
                          <span className="text-xs text-primary font-medium">{item.module}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <span className="text-sm font-medium">SaaS Killer</span>
                      <span className="text-sm font-bold text-primary">$0/mo</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 border-t">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-semibold">Ready to take control?</h2>
            <p className="mt-3 text-muted-foreground">
              Log in to the HUD and see every module in action. No credit card, no trial expiration, no strings.
            </p>
            <div className="mt-6 flex items-center gap-3 justify-center flex-wrap">
              <Link href="/hud">
                <Button size="lg" data-testid="button-cta-hud">
                  Open the HUD
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/auth">
                <Button variant="outline" size="lg" data-testid="button-cta-login">
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-6" data-testid="footer">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Layers className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">SaaS Killer</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Open-source business operating system. MIT Licensed.
          </p>
        </div>
      </footer>
    </div>
  );
}
