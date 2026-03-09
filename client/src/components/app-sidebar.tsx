import {
  Calendar,
  Clock,
  LayoutDashboard,
  Settings,
  CalendarCheck,
  Code,
  HelpCircle,
  Users,
  LogOut,
  ChevronDown,
  ContactRound,
  ShoppingBag,
  HeadphonesIcon,
  Timer,
  DollarSign,
  FileText,
  Mail,
  Bot,
  Image,
  HardDrive,
  Database,
  RefreshCw,
  Building2,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  title: string;
  url: string;
  icon: any;
  ownerOnly?: boolean;
  enabled?: boolean;
  subItems?: { title: string; url: string }[];
}

const coreItems: NavItem[] = [
  { title: "Dashboard", url: "/hud", icon: LayoutDashboard, enabled: true },
  {
    title: "Calendar",
    url: "/hud/event-types",
    icon: Calendar,
    enabled: true,
    subItems: [
      { title: "Event Types", url: "/hud/event-types" },
      { title: "Bookings", url: "/hud/bookings" },
      { title: "Availability", url: "/hud/availability" },
    ],
  },
  {
    title: "CRM",
    url: "/hud/crm/customers",
    icon: ContactRound,
    enabled: true,
    subItems: [
      { title: "Customers", url: "/hud/crm/customers" },
      { title: "Leads", url: "/hud/crm/leads" },
    ],
  },
  { title: "Products", url: "/hud/products", icon: ShoppingBag, enabled: true },
];

const operationsItems: NavItem[] = [
  { title: "Support", url: "/hud/support", icon: HeadphonesIcon, enabled: true },
  { title: "Time Tracking", url: "/hud/time-tracking", icon: Timer, enabled: true },
  { title: "Finance", url: "/hud/finance", icon: DollarSign, enabled: true },
];

const toolItems: NavItem[] = [
  { title: "Forms", url: "/hud/forms", icon: FileText, enabled: true },
  { title: "Email", url: "/hud/email", icon: Mail, enabled: true },
  { title: "AI Agents", url: "/hud/agents", icon: Bot, enabled: true },
  { title: "Media", url: "/hud/media", icon: Image, enabled: true },
];

const systemItems: NavItem[] = [
  { title: "Users & Groups", url: "/hud/users", icon: Users, enabled: true, ownerOnly: true },
  { title: "Assets", url: "/hud/assets", icon: HardDrive, enabled: false },
  { title: "Embed", url: "/hud/embed", icon: Code, enabled: true },
  { title: "Settings", url: "/hud/settings", icon: Settings, enabled: true },
  { title: "Backups", url: "/hud/backups", icon: Database, enabled: false },
  { title: "Updates", url: "/hud/updates", icon: RefreshCw, enabled: false },
  { title: "Help", url: "/hud/help", icon: HelpCircle, enabled: true },
];

function NavGroup({ label, items, location, userRole }: { label: string; items: NavItem[]; location: string; userRole?: string }) {
  const visibleItems = items.filter(
    (item) => !item.ownerOnly || userRole === "OWNER",
  );

  if (visibleItems.length === 0) return null;

  const isActive = (url: string) =>
    url === "/hud" ? location === "/hud" : location.startsWith(url);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map((item) => {
            if (!item.enabled) {
              return (
                <SidebarMenuItem key={item.title}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton disabled className="opacity-40 cursor-not-allowed">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Coming Soon</p>
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              );
            }

            if (item.subItems) {
              const isParentActive = item.subItems.some((sub) => isActive(sub.url));
              return (
                <Collapsible key={item.title} defaultOpen={isParentActive} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={isParentActive} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.subItems.map((sub) => (
                          <SidebarMenuSubItem key={sub.url}>
                            <SidebarMenuSubButton asChild isActive={isActive(sub.url)}>
                              <Link href={sub.url} data-testid={`link-nav-${sub.title.toLowerCase().replace(/\s/g, "-")}`}>
                                <span>{sub.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive(item.url)}>
                  <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 pb-2">
        <Link href="/hud">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-tight" data-testid="text-app-name">
                SaaS Killer
              </h2>
              <p className="text-[11px] text-muted-foreground leading-tight">Command Center</p>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <NavGroup label="Core" items={coreItems} location={location} userRole={user?.role} />
        <NavGroup label="Operations" items={operationsItems} location={location} userRole={user?.role} />
        <NavGroup label="Tools" items={toolItems} location={location} userRole={user?.role} />
        <NavGroup label="System" items={systemItems} location={location} userRole={user?.role} />
      </SidebarContent>
      <SidebarFooter className="p-3 space-y-1">
        {user && (
          <>
            <SidebarSeparator />
            <div className="px-2 py-1.5">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium truncate" data-testid="text-sidebar-user-name">{user.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium" data-testid="text-sidebar-user-role">
                  {user.role}
                </span>
              </div>
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
