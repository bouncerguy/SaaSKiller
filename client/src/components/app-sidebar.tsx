import {
  Calendar,
  Clock,
  LayoutDashboard,
  Settings,
  CalendarCheck,
  Code,
  ExternalLink,
  HelpCircle,
  Users,
  LogOut,
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Event Types", url: "/admin/event-types", icon: Calendar },
  { title: "Bookings", url: "/admin/bookings", icon: CalendarCheck },
  { title: "Availability", url: "/admin/availability", icon: Clock },
  { title: "Team", url: "/admin/team", icon: Users, ownerOnly: true },
];

const toolItems = [
  { title: "Embed", url: "/admin/embed", icon: Code },
  { title: "Settings", url: "/admin/settings", icon: Settings },
  { title: "Help & FAQ", url: "/admin/help", icon: HelpCircle },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (url: string) =>
    url === "/admin" ? location === "/admin" : location.startsWith(url);

  const visibleMainItems = mainItems.filter(
    (item) => !item.ownerOnly || user?.role === "OWNER",
  );

  return (
    <Sidebar>
      <SidebarHeader className="p-4 pb-2">
        <Link href="/admin">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-tight" data-testid="text-app-name">
                Calendar Core
              </h2>
              <p className="text-[11px] text-muted-foreground leading-tight">Admin</p>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Scheduling</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3 space-y-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/book/default" target="_blank" rel="noopener noreferrer" data-testid="link-view-booking-page">
                <ExternalLink className="h-4 w-4" />
                <span>View Booking Page</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {user && (
          <>
            <SidebarSeparator />
            <div className="px-2 py-1.5">
              <p className="text-xs font-medium truncate" data-testid="text-sidebar-user-name">{user.name}</p>
              <p className="text-[11px] text-muted-foreground truncate" data-testid="text-sidebar-user-email">{user.email}</p>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => logout()}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
