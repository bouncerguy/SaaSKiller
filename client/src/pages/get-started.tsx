import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  Github,
  Code2,
  Database,
  Key,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Package,
  Globe,
  Share2,
  MonitorSmartphone,
  Cpu,
  HardDrive,
} from "lucide-react";

const GITHUB_REPO = "https://github.com/bouncerguy/SaaSKiller";

const claudePrompt = `I just created a DigitalOcean droplet running Ubuntu 24.04. Help me deploy SaaS Killer from GitHub (${GITHUB_REPO}).

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

function CopyButton({ text, label, testId }: { text: string; label: string; testId: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} data-testid={testId}>
      {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function CodeBlock({ code, testId }: { code: string; testId: string }) {
  return (
    <div className="relative rounded-md border bg-muted/50 p-4 mt-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Terminal</span>
        </div>
        <CopyButton text={code} label="Copy" testId={`button-copy-${testId}`} />
      </div>
      <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed font-mono" data-testid={`text-code-${testId}`}>
        {code}
      </pre>
    </div>
  );
}

function StepCard({ step, title, description, children, testId }: { step: number; title: string; description: string; children?: React.ReactNode; testId: string }) {
  return (
    <Card className="overflow-visible" data-testid={testId}>
      <CardContent className="p-5 flex gap-4">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
          <span className="text-sm font-bold text-primary">{step}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-[15px]">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

function EnvVarRow({ name, description, required }: { name: string; description: string; required: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded shrink-0">{name}</code>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {required ? (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 shrink-0">Required</Badge>
      ) : (
        <Badge variant="outline" className="shrink-0">Optional</Badge>
      )}
    </div>
  );
}

export default function GetStarted() {
  const { toast } = useToast();
  const [envVarsOpen, setEnvVarsOpen] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(claudePrompt);
      setCopiedPrompt(true);
      toast({ title: "Copied to clipboard", description: "Paste this prompt into Claude to get started." });
      setTimeout(() => setCopiedPrompt(false), 2000);
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
            <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" data-testid="button-header-github">
                <Github className="h-3.5 w-3.5 mr-1" />
                GitHub
              </Button>
            </a>
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
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent dark:from-primary/[0.08]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/[0.03] dark:bg-primary/[0.06] rounded-full blur-3xl -translate-y-1/2" />
          <div className="relative max-w-3xl mx-auto text-center px-6 pt-20 pb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/[0.08] dark:bg-primary/[0.15] text-primary text-xs font-medium mb-6">
              <Zap className="h-3 w-3" />
              Step-by-step installation guide
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1]" data-testid="text-get-started-title">
              Install SaaS Killer
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Go from zero to a running business operating system in minutes. Pick your path and follow the steps.
            </p>
          </div>
        </section>

        {/* GitHub Callout */}
        <section className="px-6 pb-10">
          <div className="max-w-4xl mx-auto">
            <Card className="border-primary/20 bg-gradient-to-r from-primary/[0.04] to-transparent dark:from-primary/[0.08]" data-testid="card-github-callout">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-5">
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center">
                  <Github className="h-7 w-7 text-white dark:text-gray-900" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                    <h2 className="text-lg font-semibold" data-testid="text-github-title">Source Code on GitHub</h2>
                    <img
                      src="https://img.shields.io/github/stars/bouncerguy/SaaSKiller?style=social"
                      alt="GitHub stars"
                      className="h-5"
                      data-testid="img-github-stars"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    MIT licensed. Clone, fork, or download. Everything you need is in one repository.
                  </p>
                  <code className="text-xs font-mono text-muted-foreground mt-1 block" data-testid="text-github-url">
                    {GITHUB_REPO}
                  </code>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
                    <Button data-testid="button-view-github">
                      <Github className="h-4 w-4 mr-2" />
                      View on GitHub
                    </Button>
                  </a>
                  <CopyButton text={`git clone ${GITHUB_REPO}.git`} label="Copy Clone URL" testId="button-copy-clone" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Reference: Tech Stack + Requirements */}
        <section className="px-6 pb-10">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card data-testid="card-tech-stack">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-primary" />
                    Tech Stack
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                    {[
                      { label: "Frontend", value: "React 18 + Vite" },
                      { label: "Backend", value: "Express + TypeScript" },
                      { label: "Database", value: "PostgreSQL + Drizzle" },
                      { label: "UI", value: "Shadcn + Tailwind CSS" },
                      { label: "Auth", value: "Passport.js (sessions)" },
                      { label: "Icons", value: "Lucide React" },
                    ].map((item) => (
                      <div key={item.label}>
                        <span className="text-muted-foreground text-xs">{item.label}</span>
                        <p className="font-medium text-xs">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-requirements">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    System Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {[
                      { icon: Package, label: "Node.js 20+", note: "Runtime" },
                      { icon: Database, label: "PostgreSQL 15+", note: "Database" },
                      { icon: HardDrive, label: "1 GB RAM minimum", note: "2+ GB recommended" },
                      { icon: Globe, label: "Port 5000", note: "Default app port" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-xs">
                        <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{item.label}</span>
                        <span className="text-muted-foreground">({item.note})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* What You Need — Prerequisites */}
        <section className="px-6 pb-16" data-testid="section-prerequisites">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/[0.08] dark:bg-primary/[0.15] text-primary text-xs font-medium mb-4">
                <CheckCircle2 className="h-3 w-3" />
                Before you begin
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold" data-testid="text-prerequisites-title">What You Need</h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Gather these before starting. Replit users can skip to the next section — everything is provided automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card data-testid="card-prereqs-required">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {[
                    { icon: Github, name: "GitHub account", detail: "To clone or fork the repository" },
                    { icon: Package, name: "Node.js 20+", detail: "JavaScript runtime" },
                    { icon: Database, name: "PostgreSQL 15+", detail: "Application database" },
                    { icon: Terminal, name: "npm 9+", detail: "Package manager (bundled with Node.js)" },
                  ].map((item) => (
                    <div key={item.name} className="flex items-start gap-3">
                      <item.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <span className="text-sm font-medium">{item.name}</span>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card data-testid="card-prereqs-optional">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Optional Services (BYOK)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {[
                    { icon: Phone, name: "Twilio account", detail: "For phone numbers, calls, SMS, and voicemail" },
                    { icon: Share2, name: "Social media API keys", detail: "Twitter/X, Facebook, LinkedIn, Instagram — configured per-account in the UI" },
                    { icon: Video, name: "Jitsi server or Zoom", detail: "Video conferencing — configured in Settings" },
                    { icon: Link2, name: "HubSpot Private App token", detail: "Import contacts and workflows from HubSpot" },
                  ].map((item) => (
                    <div key={item.name} className="flex items-start gap-3">
                      <item.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="text-sm font-medium">{item.name}</span>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">All optional services use a Bring Your Own Key (BYOK) model. You only pay the providers you choose.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Deployment Tabs */}
        <section className="px-6 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-semibold" data-testid="text-choose-path">Choose Your Installation Path</h2>
              <p className="mt-3 text-muted-foreground">Three ways to run SaaS Killer. Same app, different hosting.</p>
            </div>

            <Tabs defaultValue="replit" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="replit" data-testid="tab-replit" className="gap-1.5 text-xs sm:text-sm">
                  <Cloud className="h-4 w-4" />
                  <span className="hidden sm:inline">Replit</span>
                  <span className="sm:hidden">Replit</span>
                </TabsTrigger>
                <TabsTrigger value="vps" data-testid="tab-vps" className="gap-1.5 text-xs sm:text-sm">
                  <Server className="h-4 w-4" />
                  <span className="hidden sm:inline">Self-Hosted (VPS)</span>
                  <span className="sm:hidden">VPS</span>
                </TabsTrigger>
                <TabsTrigger value="local" data-testid="tab-local" className="gap-1.5 text-xs sm:text-sm">
                  <MonitorSmartphone className="h-4 w-4" />
                  <span className="hidden sm:inline">Local Dev</span>
                  <span className="sm:hidden">Local</span>
                </TabsTrigger>
              </TabsList>

              {/* === Replit Tab === */}
              <TabsContent value="replit" data-testid="content-replit">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Easiest</Badge>
                    <p className="text-sm text-muted-foreground">No server setup, no SSH, no config files. Click and run.</p>
                  </div>

                  <StepCard step={1} title="Create a Replit account" description="Sign up for a free Replit account. Replit provides a cloud IDE with built-in hosting and PostgreSQL — everything SaaS Killer needs." testId="card-replit-step-1">
                    <a href="https://replit.com/refer/kenpcox" target="_blank" rel="noopener noreferrer" className="inline-block mt-3">
                      <Button size="sm" data-testid="button-replit-signup">
                        Create Replit Account
                        <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </a>
                  </StepCard>

                  <StepCard step={2} title="Import from GitHub" description="In Replit, click 'Create Repl' and choose 'Import from GitHub'. Paste the repository URL below." testId="card-replit-step-2">
                    <CodeBlock code={GITHUB_REPO} testId="replit-repo-url" />
                  </StepCard>

                  <StepCard step={3} title="Click Run" description="Hit the Run button. Replit automatically provisions a PostgreSQL database, installs all dependencies, and starts the application. The preview pane will show your app." testId="card-replit-step-3" />

                  <StepCard step={4} title="Run the Setup Wizard" description="Open your app's URL and navigate to /setup. Create your organization name and admin account. This only runs once." testId="card-replit-step-4" />

                  <StepCard step={5} title="You're live" description="Log in with your admin account. Go to Settings to enable the modules you need. Your business operating system is ready." testId="card-replit-step-5">
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-md border border-green-200 dark:border-green-800">
                      <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Replit handles hosting, SSL, and database backups for you.
                      </p>
                    </div>
                  </StepCard>
                </div>
              </TabsContent>

              {/* === Self-Hosted VPS Tab === */}
              <TabsContent value="vps" data-testid="content-vps">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Self-Hosted</Badge>
                    <p className="text-sm text-muted-foreground">Full control on your own server. We recommend DigitalOcean + Claude AI as your setup assistant.</p>
                  </div>

                  <StepCard step={1} title="Get a server" description="Create a DigitalOcean Droplet (or any VPS). Recommended: 2 vCPUs, 4 GB RAM, Ubuntu 24.04. New DigitalOcean accounts get $200 in free credits for 60 days." testId="card-vps-step-1">
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      <a href="https://www.digitalocean.com/?refcode=de537efcf1f1&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge" target="_blank" rel="noopener noreferrer">
                        <Button size="sm" data-testid="button-do-signup">
                          Create DigitalOcean Account
                          <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                        </Button>
                      </a>
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
                    </div>
                  </StepCard>

                  <StepCard step={2} title="SSH into your server" description="Use your terminal to connect. You'll need your server's IP address." testId="card-vps-step-2">
                    <CodeBlock code="ssh root@YOUR_SERVER_IP" testId="vps-ssh" />
                  </StepCard>

                  <StepCard step={3} title="Install Node.js and PostgreSQL" description="Install the runtime and database. These commands work on Ubuntu 24.04." testId="card-vps-step-3">
                    <CodeBlock code={`curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -\nsudo apt-get install -y nodejs postgresql postgresql-contrib\nsudo systemctl start postgresql\nsudo systemctl enable postgresql`} testId="vps-install" />
                  </StepCard>

                  <StepCard step={4} title="Clone the repo and install dependencies" description="Pull the code from GitHub and install packages." testId="card-vps-step-4">
                    <CodeBlock code={`git clone ${GITHUB_REPO}.git\ncd SaaSKiller\nnpm install`} testId="vps-clone" />
                  </StepCard>

                  <StepCard step={5} title="Set up the database" description="Create a PostgreSQL database and user, then set your environment variables." testId="card-vps-step-5">
                    <CodeBlock code={`sudo -u postgres createuser --createdb saaskiller\nsudo -u postgres createdb -O saaskiller saaskiller\n\n# Create your .env file\ncat > .env << 'EOF'\nDATABASE_URL=postgresql://saaskiller@localhost:5432/saaskiller\nSESSION_SECRET=$(openssl rand -hex 32)\nEOF`} testId="vps-db" />
                  </StepCard>

                  <StepCard step={6} title="Push the schema and build" description="Create the database tables and build the production bundle." testId="card-vps-step-6">
                    <CodeBlock code={`npm run db:push\nnpm run build\nnpm start`} testId="vps-build" />
                  </StepCard>

                  <StepCard step={7} title="Set up Nginx + SSL (optional)" description="For a custom domain with HTTPS, configure Nginx as a reverse proxy and use Let's Encrypt for free SSL certificates." testId="card-vps-step-7">
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-md border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-2">Need help with this step?</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400/80">Copy the ready-made prompt below and paste it into Claude. It will walk you through Nginx, SSL, and systemd service setup step by step.</p>
                    </div>
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
                            {copiedPrompt ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                            {copiedPrompt ? "Copied" : "Copy Prompt"}
                          </Button>
                        </div>
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed font-mono" data-testid="text-claude-prompt">
                          {claudePrompt}
                        </pre>
                      </div>
                    </div>
                  </StepCard>

                  <StepCard step={8} title="Run the Setup Wizard" description="Visit your-domain.com/setup (or YOUR_IP:5000/setup) to create your organization and admin account." testId="card-vps-step-8" />
                </div>
              </TabsContent>

              {/* === Local Development Tab === */}
              <TabsContent value="local" data-testid="content-local">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">Developer</Badge>
                    <p className="text-sm text-muted-foreground">Run locally for development, testing, or contributing to the project.</p>
                  </div>

                  <StepCard step={1} title="Prerequisites" description="Make sure you have these installed on your machine before starting." testId="card-local-step-1">
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { name: "Node.js 20+", check: "node --version" },
                        { name: "npm 9+", check: "npm --version" },
                        { name: "PostgreSQL 15+", check: "psql --version" },
                      ].map((item) => (
                        <div key={item.name} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <p className="text-muted-foreground font-mono">{item.check}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </StepCard>

                  <StepCard step={2} title="Clone the repository" description="Clone the SaaS Killer repo to your local machine." testId="card-local-step-2">
                    <CodeBlock code={`git clone ${GITHUB_REPO}.git\ncd SaaSKiller`} testId="local-clone" />
                  </StepCard>

                  <StepCard step={3} title="Install dependencies" description="Install all Node.js packages." testId="card-local-step-3">
                    <CodeBlock code="npm install" testId="local-install" />
                  </StepCard>

                  <StepCard step={4} title="Set up your database" description="Create a local PostgreSQL database and set your environment variables." testId="card-local-step-4">
                    <CodeBlock code={`# Create a database (if not using an existing one)\ncreatedb saaskiller\n\n# Create a .env file in the project root\necho 'DATABASE_URL=postgresql://localhost:5432/saaskiller' > .env\necho 'SESSION_SECRET=local-dev-secret-change-me' >> .env`} testId="local-db" />
                  </StepCard>

                  <StepCard step={5} title="Push the database schema" description="Create all tables in your local database using Drizzle." testId="card-local-step-5">
                    <CodeBlock code="npm run db:push" testId="local-schema" />
                  </StepCard>

                  <StepCard step={6} title="Start the dev server" description="Run the development server with hot reload. The app starts on port 5000." testId="card-local-step-6">
                    <CodeBlock code="npm run dev" testId="local-dev" />
                  </StepCard>

                  <StepCard step={7} title="Open the Setup Wizard" description="Open your browser and navigate to the setup page to create your first organization and admin account." testId="card-local-step-7">
                    <CodeBlock code="http://localhost:5000/setup" testId="local-setup-url" />
                    <div className="mt-3 p-3 bg-violet-50 dark:bg-violet-900/10 rounded-md border border-violet-200 dark:border-violet-800">
                      <p className="text-xs text-violet-700 dark:text-violet-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Dev mode includes seed data with demo login: alex@acmeconsulting.com / password123
                      </p>
                    </div>
                  </StepCard>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Environment Variables Reference */}
        <section className="px-6 pb-16" data-testid="section-env-vars">
          <div className="max-w-4xl mx-auto">
            <Collapsible open={envVarsOpen} onOpenChange={setEnvVarsOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-primary" />
                        Environment Variables Reference
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">2 required, 8+ optional</Badge>
                        {envVarsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </div>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 mt-2">Required</p>
                      <EnvVarRow name="DATABASE_URL" description="PostgreSQL connection string. Format: postgresql://user:password@host:5432/dbname" required={true} />
                      <EnvVarRow name="SESSION_SECRET" description="Random string for encrypting session cookies. Generate with: openssl rand -hex 32" required={true} />

                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 mt-6">Optional — BYOK Services</p>
                      <EnvVarRow name="HUBSPOT_ACCESS_TOKEN" description="HubSpot Private App token for importing contacts and workflows." required={false} />

                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 mt-4">Twilio (Phone Module)</p>
                      <EnvVarRow name="TWILIO_ACCOUNT_SID" description="Twilio Account SID for phone numbers, calls, and SMS." required={false} />
                      <EnvVarRow name="TWILIO_AUTH_TOKEN" description="Twilio Auth Token. Pair with Account SID." required={false} />

                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 mt-4">Social Media (configured per-account in the UI)</p>
                      <div className="p-3 bg-muted/30 rounded text-xs text-muted-foreground">
                        <p>Social media API keys (Twitter, Facebook, LinkedIn, Instagram) are configured per-platform inside the Social Media module's Accounts tab — not as server environment variables. Each platform has a step-by-step setup guide built into the UI.</p>
                      </div>

                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 mt-4">Video Conferencing (configured in Settings UI)</p>
                      <div className="p-3 bg-muted/30 rounded text-xs text-muted-foreground">
                        <p>Jitsi server URL and Zoom links are configured per-event in the HUD Settings page, not via environment variables.</p>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        </section>

        {/* First Run Checklist */}
        <section className="py-16 px-6 border-t" data-testid="section-first-run">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/[0.08] dark:bg-primary/[0.15] text-primary text-xs font-medium mb-4">
                <Shield className="h-3 w-3" />
                First Run Checklist
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold" data-testid="text-first-run-title">
                After Installation
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Your app is running. Here's how to set up your business and start using it.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Shield,
                  title: "1. Run the Setup Wizard",
                  description: "Visit /setup to create your organization name and admin account. This is a one-time step that initializes the system.",
                  accent: "text-primary",
                },
                {
                  icon: Settings,
                  title: "2. Enable your modules",
                  description: "All 16 modules are off by default. Go to Settings and toggle on only what you need. Your sidebar updates automatically.",
                  accent: "text-primary",
                },
                {
                  icon: Calendar,
                  title: "3. Create your first event type",
                  description: "Set up a bookable meeting with a title, duration, and location. Share the public booking link or embed it on your site.",
                  accent: "text-primary",
                },
                {
                  icon: Link2,
                  title: "4. Share your booking link",
                  description: "Each event type gets a public URL. Share it directly, or use the embed SDK for inline, popup, or widget embedding.",
                  accent: "text-primary",
                },
                {
                  icon: Phone,
                  title: "5. Connect Twilio (optional)",
                  description: "Add your Twilio credentials in Phone settings to enable phone numbers, call forwarding, voicemail, and SMS messaging.",
                  accent: "text-teal-500",
                },
                {
                  icon: Share2,
                  title: "6. Connect social accounts (optional)",
                  description: "In the Social Media module, add your API keys for Twitter/X, Facebook, LinkedIn, or Instagram. Each platform has a built-in setup guide.",
                  accent: "text-rose-500",
                },
                {
                  icon: Video,
                  title: "7. Set up video conferencing (optional)",
                  description: "Configure your Jitsi server URL in Settings for free, self-hosted video meetings. Or paste Zoom links per event type.",
                  accent: "text-blue-500",
                },
                {
                  icon: Headphones,
                  title: "8. Explore the HUD",
                  description: "The HUD is your unified control center. Everything — bookings, CRM, invoices, time tracking, and more — lives in one dashboard.",
                  accent: "text-primary",
                },
              ].map((item, i) => (
                <Card key={i} className="overflow-visible" data-testid={`card-checklist-${i}`}>
                  <CardContent className="p-5 flex gap-4">
                    <div className="flex-shrink-0 w-9 h-9 rounded-md bg-primary/[0.08] dark:bg-primary/[0.15] flex items-center justify-center">
                      <item.icon className={`h-4 w-4 ${item.accent}`} />
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

        {/* CTA */}
        <section className="py-16 px-6 border-t">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-semibold" data-testid="text-cta-title">Ready to go?</h2>
            <p className="mt-3 text-muted-foreground">
              Pick an installation path above and follow the steps. No credit card required.
            </p>
            <div className="mt-6 flex items-center gap-3 justify-center flex-wrap">
              <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
                <Button size="lg" data-testid="button-cta-github">
                  <Github className="h-4 w-4 mr-1.5" />
                  View on GitHub
                </Button>
              </a>
              <Link href="/hud">
                <Button variant="outline" size="lg" data-testid="button-cta-explore">
                  Explore the HUD
                  <ArrowRight className="h-4 w-4 ml-1.5" />
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
