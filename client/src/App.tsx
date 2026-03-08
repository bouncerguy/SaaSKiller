import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import SetupPage from "@/pages/setup-page";
import HudDashboard from "@/pages/hud-dashboard";
import HudEventTypes from "@/pages/hud-event-types";
import HudBookings from "@/pages/hud-bookings";
import HudAvailability from "@/pages/hud-availability";
import HudEmbed from "@/pages/hud-embed";
import HudSettings from "@/pages/hud-settings";
import HudHelp from "@/pages/hud-help";
import HudUsers from "@/pages/hud-users";
import PublicBooking from "@/pages/public-booking";
import PublicTenant from "@/pages/public-tenant";
import { Redirect } from "wouter";

function HudLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "15rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 px-4 h-14 border-b sticky top-0 bg-background/80 backdrop-blur-lg z-[9999]">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function ProtectedHudRouter() {
  const { user, isLoading, needsSetup } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (needsSetup) {
    return <Redirect to="/setup" />;
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <HudLayout>
      <Switch>
        <Route path="/hud" component={HudDashboard} />
        <Route path="/hud/event-types" component={HudEventTypes} />
        <Route path="/hud/bookings" component={HudBookings} />
        <Route path="/hud/availability" component={HudAvailability} />
        <Route path="/hud/embed" component={HudEmbed} />
        <Route path="/hud/settings" component={HudSettings} />
        <Route path="/hud/help" component={HudHelp} />
        <Route path="/hud/users" component={HudUsers} />
        <Route path="/hud/team" component={HudUsers} />
        <Route component={NotFound} />
      </Switch>
    </HudLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/setup" component={SetupPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/book/:tenantSlug/:eventSlug" component={PublicBooking} />
      <Route path="/book/:tenantSlug" component={PublicTenant} />
      <Route path="/hud/:rest*" component={ProtectedHudRouter} />
      <Route path="/hud" component={ProtectedHudRouter} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
