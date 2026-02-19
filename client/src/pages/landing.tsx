import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Code, Globe, Zap, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold" data-testid="text-brand">CalendaLite</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/book/default">
              <Button variant="ghost" size="sm" data-testid="button-book-demo">
                Book Demo
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="sm" data-testid="button-admin">
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight" data-testid="text-hero-title">
              Scheduling made
              <span className="text-primary"> simple</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              An open-source, embeddable scheduling engine. Create event types,
              set availability, and let people book time with you.
            </p>
            <div className="mt-8 flex items-center gap-3 justify-center flex-wrap">
              <Link href="/book/default">
                <Button size="lg" data-testid="button-try-booking">
                  Try Booking Flow
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" size="lg" data-testid="button-open-admin">
                  Open Admin
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 border-t">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-10" data-testid="text-features-title">
              Everything you need
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  icon: Calendar,
                  title: "Event Types",
                  desc: "Create different meeting types with custom durations, locations, and questions.",
                },
                {
                  icon: Clock,
                  title: "Availability Rules",
                  desc: "Set your weekly schedule and let the system calculate open time slots.",
                },
                {
                  icon: Globe,
                  title: "Timezone Smart",
                  desc: "Automatic timezone detection so bookings work across the world.",
                },
                {
                  icon: Code,
                  title: "Embed Anywhere",
                  desc: "Inline, popup, floating widget, or iframe. Embed booking on any website.",
                },
                {
                  icon: Shield,
                  title: "Multi-Tenant",
                  desc: "Built for teams. Tenant isolation, branding, and role-based access.",
                },
                {
                  icon: Zap,
                  title: "Open Source",
                  desc: "Self-hostable, modular, and designed to integrate into existing platforms.",
                },
              ].map((feature) => (
                <Card key={feature.title} className="overflow-visible">
                  <CardContent className="p-5">
                    <feature.icon className="h-5 w-5 text-primary mb-3" />
                    <h3 className="font-medium text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-muted-foreground">
            CalendaLite - Open source scheduling engine
          </p>
        </div>
      </footer>
    </div>
  );
}
