import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminEventTypes from "@/pages/admin-event-types";
import AdminBookings from "@/pages/admin-bookings";
import AdminAvailability from "@/pages/admin-availability";
import AdminEmbed from "@/pages/admin-embed";
import AdminSettings from "@/pages/admin-settings";
import PublicBooking from "@/pages/public-booking";
import PublicTenant from "@/pages/public-tenant";

function AdminLayout({ children }: { children: React.ReactNode }) {
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

function AdminRouter() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/event-types" component={AdminEventTypes} />
        <Route path="/admin/bookings" component={AdminBookings} />
        <Route path="/admin/availability" component={AdminAvailability} />
        <Route path="/admin/embed" component={AdminEmbed} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/book/:tenantSlug/:eventSlug" component={PublicBooking} />
      <Route path="/book/:tenantSlug" component={PublicTenant} />
      <Route path="/admin/:rest*" component={AdminRouter} />
      <Route path="/admin" component={AdminRouter} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
