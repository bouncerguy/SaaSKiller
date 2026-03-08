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
import HudCrmCustomers from "@/pages/hud-crm-customers";
import HudCrmLeads from "@/pages/hud-crm-leads";
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

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
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
      <Component />
    </HudLayout>
  );
}

function CrmRedirect() {
  return <Redirect to="/hud/crm/customers" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/setup" component={SetupPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/book/:tenantSlug/:eventSlug" component={PublicBooking} />
      <Route path="/book/:tenantSlug" component={PublicTenant} />
      <Route path="/hud">{() => <ProtectedRoute component={HudDashboard} />}</Route>
      <Route path="/hud/event-types">{() => <ProtectedRoute component={HudEventTypes} />}</Route>
      <Route path="/hud/bookings">{() => <ProtectedRoute component={HudBookings} />}</Route>
      <Route path="/hud/availability">{() => <ProtectedRoute component={HudAvailability} />}</Route>
      <Route path="/hud/embed">{() => <ProtectedRoute component={HudEmbed} />}</Route>
      <Route path="/hud/settings">{() => <ProtectedRoute component={HudSettings} />}</Route>
      <Route path="/hud/help">{() => <ProtectedRoute component={HudHelp} />}</Route>
      <Route path="/hud/users">{() => <ProtectedRoute component={HudUsers} />}</Route>
      <Route path="/hud/team">{() => <ProtectedRoute component={HudUsers} />}</Route>
      <Route path="/hud/crm/customers">{() => <ProtectedRoute component={HudCrmCustomers} />}</Route>
      <Route path="/hud/crm/leads">{() => <ProtectedRoute component={HudCrmLeads} />}</Route>
      <Route path="/hud/crm">{() => <ProtectedRoute component={CrmRedirect} />}</Route>
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
