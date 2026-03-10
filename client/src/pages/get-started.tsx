import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import {
  Layers,
  ArrowRight,
  ArrowLeft,
  Zap,
  Cloud,
  Server,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Shield,
  Settings,
  Calendar,
  Link2,
  Headphones,
  Video,
  Phone,
} from "lucide-react";

const claudePrompt = `I just created a DigitalOcean droplet running Ubuntu 24.04. Help me deploy SaaS Killer from GitHub (https://github.com/bouncerguy/SaaSKiller).

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

My droplet IP is: [PASTE YOUR IP HERE]
My domain is: [PASTE YOUR DOMAIN HERE]

Please walk me through each step one at a time.`;

export default function GetStarted() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(claudePrompt);
      setCopied(true);
      toast({ title: "Copied to clipboard", description: "Paste this prompt into Claude to get started." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", description: "Please select and copy the text manually.", variant: "destructive" });
    }
  };

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
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back-home">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Home
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="sm" data-testid="button-login">
                Log In
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
          <div className="relative max-w-3xl mx-auto text-center px-6 pt-20 pb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/[0.08] dark:bg-primary/[0.15] text-primary text-xs font-medium mb-6">
              <Zap className="h-3 w-3" />
              Deploy in minutes
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1]" data-testid="text-get-started-title">
              Get Started with SaaS Killer
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Choose your deployment path. Run instantly on Replit with zero configuration, or self-host on your own server with Claude as your setup assistant.
            </p>
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="replit" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="replit" data-testid="tab-replit" className="gap-2">
                  <Cloud className="h-4 w-4" />
                  Replit (Zero-Config)
                </TabsTrigger>
                <TabsTrigger value="digitalocean" data-testid="tab-digitalocean" className="gap-2">
                  <Server className="h-4 w-4" />
                  DigitalOcean + Claude
                </TabsTrigger>
              </TabsList>

              <TabsContent value="replit" data-testid="content-replit">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <Badge variant="secondary" className="no-default-active-elevate">Easiest</Badge>
                    <p className="text-sm text-muted-foreground">No server management, no SSH, no configuration files.</p>
                  </div>

                  {[
                    {
                      step: 1,
                      title: "Create a Replit account",
                      description: "Sign up for a free Replit account. Replit provides a cloud development environment with built-in hosting and PostgreSQL.",
                      link: { url: "https://replit.com/refer/kenpcox", label: "Create Replit Account" },
                    },
                    {
                      step: 2,
                      title: "Fork the GitHub repo on Replit",
                      description: "Import the SaaS Killer repository into Replit. Click 'Create Repl' and select 'Import from GitHub', then paste the repository URL.",
                    },
                    {
                      step: 3,
                      title: "Click Run",
                      description: "Hit the Run button. Replit automatically provisions a PostgreSQL database, installs dependencies, and starts the application. That's it.",
                    },
                    {
                      step: 4,
                      title: "Visit the Setup Wizard",
                      description: "Navigate to /setup in your browser to create your organization and admin account. This is a one-time setup step.",
                    },
                    {
                      step: 5,
                      title: "Enable modules in Settings",
                      description: "All modules are off by default. Go to Settings and toggle on the modules you need — Scheduling, CRM, Invoicing, or any of the 15 available modules.",
                    },
                  ].map((item) => (
                    <Card key={item.step} className="overflow-visible" data-testid={`card-replit-step-${item.step}`}>
                      <CardContent className="p-5 flex gap-4">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{item.step}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-[15px]">{item.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                          {item.link && (
                            <a href={item.link.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-3">
                              <Button size="sm" data-testid={`button-replit-step-${item.step}-link`}>
                                {item.link.label}
                                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="digitalocean" data-testid="content-digitalocean">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <Badge variant="secondary" className="no-default-active-elevate">Self-Hosted</Badge>
                    <p className="text-sm text-muted-foreground">Full control over your infrastructure. Let Claude AI guide you through setup.</p>
                  </div>

                  {[
                    {
                      step: 1,
                      title: "Create a DigitalOcean account",
                      description: "Sign up for DigitalOcean. New accounts get $200 in free credits for 60 days — more than enough to test and deploy SaaS Killer.",
                      link: {
                        url: "https://www.digitalocean.com/?refcode=de537efcf1f1&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge",
                        label: "Create DigitalOcean Account",
                      },
                      badge: true,
                    },
                    {
                      step: 2,
                      title: "Create a Droplet",
                      description: "Create a new Droplet with the recommended specs: 2 vCPUs, 4 GB RAM, Ubuntu 24.04. This handles 5-25 concurrent users comfortably at $24/month.",
                    },
                    {
                      step: 3,
                      title: "Open Claude and paste the setup prompt",
                      description: "Go to claude.ai or use the Claude Code CLI. Paste the ready-made prompt below — Claude will walk you through every step of the deployment process.",
                      hasPrompt: true,
                    },
                    {
                      step: 4,
                      title: "Claude helps you deploy",
                      description: "Claude will guide you through: SSH access, installing Node.js 20+ and PostgreSQL 15+, cloning the repo, setting environment variables (DATABASE_URL, SESSION_SECRET), running npm install, db:push, and building for production.",
                    },
                    {
                      step: 5,
                      title: "Claude sets up Nginx + SSL",
                      description: "Claude walks you through configuring Nginx as a reverse proxy and setting up free SSL certificates with Let's Encrypt. Your app will be live at your custom domain with HTTPS.",
                    },
                    {
                      step: 6,
                      title: "Visit /setup on your domain",
                      description: "Navigate to yourdomain.com/setup to create your organization and admin account. You're now running SaaS Killer on your own server.",
                    },
                  ].map((item) => (
                    <Card key={item.step} className="overflow-visible" data-testid={`card-do-step-${item.step}`}>
                      <CardContent className="p-5 flex gap-4">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{item.step}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-[15px]">{item.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                          {item.link && (
                            <div className="mt-3 flex items-center gap-3 flex-wrap">
                              <a href={item.link.url} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" data-testid={`button-do-step-${item.step}-link`}>
                                  {item.link.label}
                                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                                </Button>
                              </a>
                              {item.badge && (
                                <a
                                  href="https://www.digitalocean.com/?refcode=de537efcf1f1&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  data-testid="link-do-referral-badge"
                                >
                                  <img
                                    src="https://web-platforms.sfo2.cdn.digitaloceanspaces.com/WWW/Badge%201.svg"
                                    alt="DigitalOcean Referral Badge"
                                    className="h-10"
                                  />
                                </a>
                              )}
                            </div>
                          )}
                          {item.hasPrompt && (
                            <div className="mt-4">
                              <div className="relative rounded-md border bg-muted/50 p-4">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                  <div className="flex items-center gap-2">
                                    <Terminal className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs font-medium text-muted-foreground">Prompt for Claude</span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopyPrompt}
                                    data-testid="button-copy-prompt"
                                  >
                                    {copied ? (
                                      <>
                                        <Check className="h-3.5 w-3.5 mr-1.5" />
                                        Copied
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                                        Copy Prompt
                                      </>
                                    )}
                                  </Button>
                                </div>
                                <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed font-mono" data-testid="text-claude-prompt">
                                  {claudePrompt}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        <section className="py-16 px-6 border-t" data-testid="section-post-setup">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/[0.08] dark:bg-primary/[0.15] text-primary text-xs font-medium mb-4">
                <Shield className="h-3 w-3" />
                After Setup
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold" data-testid="text-post-setup-title">
                What to do next
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Once your instance is running and you've created your admin account, here's how to get the most out of SaaS Killer.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Settings,
                  title: "Enable modules in Settings",
                  description: "All 15 modules are off by default. Go to Settings and toggle on only the ones you need. Your sidebar and dashboard update automatically.",
                },
                {
                  icon: Calendar,
                  title: "Create your first event type",
                  description: "Set up a bookable meeting with a title, duration, and location. Choose video call, phone, or in-person.",
                },
                {
                  icon: Link2,
                  title: "Share your booking link",
                  description: "Each event type gets a public booking URL. Share it directly or embed it on your website with the built-in embed widget.",
                },
                {
                  icon: Headphones,
                  title: "Connect external services",
                  description: "Set up Twilio for the Phone module (calls, SMS, voicemail). Configure Jitsi or Zoom for Video Conferencing.",
                },
                {
                  icon: Video,
                  title: "Set up video conferencing",
                  description: "Configure your Jitsi server URL in Settings for free, self-hosted video meetings. Or paste Zoom links per event type.",
                },
                {
                  icon: Phone,
                  title: "Configure your phone system",
                  description: "Add your Twilio credentials in Settings to enable phone numbers, call forwarding, voicemail, and SMS messaging.",
                },
              ].map((item, i) => (
                <Card key={i} className="overflow-visible" data-testid={`card-next-step-${i}`}>
                  <CardContent className="p-5 flex gap-4">
                    <div className="flex-shrink-0 w-9 h-9 rounded-md bg-primary/[0.08] dark:bg-primary/[0.15] flex items-center justify-center">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-[15px]">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-6 border-t">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-semibold" data-testid="text-cta-title">Ready to go?</h2>
            <p className="mt-3 text-muted-foreground">
              Pick a path above and deploy in minutes. No credit card required for either option.
            </p>
            <div className="mt-6 flex items-center gap-3 justify-center flex-wrap">
              <Link href="/hud">
                <Button size="lg" data-testid="button-cta-explore">
                  Explore the HUD
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="lg" data-testid="button-cta-home">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-6" data-testid="footer">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
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
          <div className="flex items-center justify-between gap-4 flex-wrap border-t pt-4">
            <p className="text-xs text-muted-foreground" data-testid="text-developer-credit">
              Built by <a href="https://kencox.com" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary underline underline-offset-2">kencox.com</a>
            </p>
            <p className="text-xs text-muted-foreground" data-testid="text-consulting-link">
              Need help deploying or integrating SaaS Killer? Visit <a href="https://vrroom.io" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary underline underline-offset-2">vrroom.io</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
