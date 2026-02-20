import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Code, Globe, Zap, Shield, ArrowRight, Check, Github } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: Calendar,
    title: "Event Types",
    desc: "Create meeting types with custom durations, locations, and intake questions.",
  },
  {
    icon: Clock,
    title: "Smart Availability",
    desc: "Define weekly schedules. The engine calculates open slots in real time.",
  },
  {
    icon: Globe,
    title: "Timezone Aware",
    desc: "Automatic detection ensures bookings work seamlessly across every timezone.",
  },
  {
    icon: Code,
    title: "Embed Anywhere",
    desc: "Inline, popup, floating widget, or iframe. Drop scheduling into any site.",
  },
  {
    icon: Shield,
    title: "Multi-Tenant",
    desc: "Built for platforms with tenant isolation, branding, and role-based access.",
  },
  {
    icon: Zap,
    title: "Self-Hostable",
    desc: "Run it on your own infrastructure. No vendor lock-in, no external dependencies.",
  },
];

const useCases = [
  "Author websites with coaching session booking",
  "Consultant platforms with discovery call scheduling",
  "Small business sites with appointment management",
  "Personal brands with event and session booking",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-[9999] border-b bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-[15px]" data-testid="text-brand">CalendaLite</span>
            </div>
          </Link>
          <div className="flex items-center gap-1 flex-wrap">
            <ThemeToggle />
            <Link href="/book/default">
              <Button variant="ghost" size="sm" data-testid="button-live-demo">
                Live Demo
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="sm" data-testid="button-admin">
                Admin Panel
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
              Open-source scheduling for personal platforms
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-bold leading-[1.1]" data-testid="text-hero-title">
              The scheduling engine
              <br />
              <span className="text-primary">for your platform</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Add booking and scheduling to any website. Built for authors, coaches, and
              consultants who need a self-hosted calendar that just works.
            </p>
            <div className="mt-8 flex items-center gap-3 justify-center flex-wrap">
              <Link href="/book/default">
                <Button size="lg" data-testid="button-try-booking">
                  See It In Action
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" size="lg" data-testid="button-open-admin">
                  Explore Admin
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-3xl font-semibold" data-testid="text-features-title">
                Everything your platform needs
              </h2>
              <p className="mt-3 text-muted-foreground max-w-md mx-auto">
                A complete scheduling toolkit you embed into your site, from availability rules to booking widgets.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature) => (
                <Card key={feature.title} className="overflow-visible hover-elevate transition-colors">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-md bg-primary/[0.08] dark:bg-primary/[0.15] flex items-center justify-center mb-4">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-medium text-[15px]">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{feature.desc}</p>
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
                  Built for personal platforms
                </h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  CalendaLite is designed to be the scheduling layer in websites you build for individuals and small companies. It handles availability, conflicts, timezones, and embeds so you can focus on the rest of the platform.
                </p>
                <ul className="mt-6 space-y-3">
                  {useCases.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-chart-2/10 dark:bg-chart-2/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-chart-2" />
                      </div>
                      <span className="text-sm">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center">
                <Card className="w-full max-w-sm overflow-visible">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Strategy Consultation</p>
                        <p className="text-xs text-muted-foreground">45 min / Video Call</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:30 PM"].map((t) => (
                        <div
                          key={t}
                          className="flex items-center justify-between py-2.5 px-3 rounded-md bg-muted/50 text-sm"
                        >
                          <span className="text-muted-foreground">{t}</span>
                          <span className="text-xs text-primary font-medium">Available</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 border-t">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-semibold">See how it works</h2>
            <p className="mt-3 text-muted-foreground">
              Try the public booking flow or explore the admin dashboard to see what your clients get.
            </p>
            <div className="mt-6 flex items-center gap-3 justify-center flex-wrap">
              <Link href="/book/default">
                <Button size="lg" data-testid="button-cta-book">
                  Public Booking Page
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" size="lg" data-testid="button-cta-admin">
                  Admin Dashboard
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
              <Calendar className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">CalendaLite</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Open-source scheduling engine for personal platforms
          </p>
        </div>
      </footer>
    </div>
  );
}
