import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarCheck, Clock, Users, ArrowRight, TrendingUp, XCircle, ShoppingBag, HeadphonesIcon, DollarSign, Timer, FileText, Mail, Bot, ImageIcon, Video, FileCode, GitBranch, Phone, FileSignature } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import type { Booking, EventType, Customer, Product, Ticket, Invoice, TimeEntry, Form, EmailTemplate, Agent, MediaAsset, Page, Funnel, PhoneNumber, Document } from "@shared/schema";

interface VideoSettings {
  videoProvider: "none" | "jitsi" | "zoom";
  jitsiServerUrl: string;
}

export default function AdminDashboard() {
  const { data: bookings, isLoading: loadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const { data: eventTypes, isLoading: loadingEvents } = useQuery<EventType[]>({
    queryKey: ["/api/admin/event-types"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
  });

  const { data: ticketsData } = useQuery<Ticket[]>({
    queryKey: ["/api/admin/tickets"],
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/admin/invoices"],
  });

  const { data: timeEntriesData } = useQuery<TimeEntry[]>({
    queryKey: ["/api/admin/time-entries"],
  });

  const { data: formsData } = useQuery<Form[]>({
    queryKey: ["/api/admin/forms"],
  });

  const { data: emailTemplatesData } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email-templates"],
  });

  const { data: agentsData } = useQuery<Agent[]>({
    queryKey: ["/api/admin/agents"],
  });

  const { data: mediaData } = useQuery<MediaAsset[]>({
    queryKey: ["/api/admin/media"],
  });

  const { data: videoSettings } = useQuery<VideoSettings>({
    queryKey: ["/api/admin/video-settings"],
  });

  const { data: pagesData } = useQuery<Page[]>({
    queryKey: ["/api/admin/pages"],
  });

  const { data: funnelsData } = useQuery<Funnel[]>({
    queryKey: ["/api/admin/funnels"],
  });

  const { data: phoneNumbersData } = useQuery<PhoneNumber[]>({
    queryKey: ["/api/admin/phone-numbers"],
  });

  const { data: documentsData } = useQuery<Document[]>({
    queryKey: ["/api/admin/documents"],
  });

  const upcomingBookings = bookings
    ?.filter((b) => b.status === "CONFIRMED" && new Date(b.startAt) > new Date())
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 5) || [];

  const totalBookings = bookings?.length || 0;
  const confirmedBookings = bookings?.filter((b) => b.status === "CONFIRMED").length || 0;
  const canceledBookings = bookings?.filter((b) => b.status === "CANCELED").length || 0;
  const activeEventTypes = eventTypes?.filter((e) => e.isActive).length || 0;
  const totalCustomers = customers?.length || 0;
  const totalProducts = products?.filter((p) => p.isActive).length || 0;
  const openTickets = ticketsData?.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length || 0;
  const paidRevenue = invoices?.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0) || 0;
  const totalTimeMinutes = timeEntriesData?.reduce((s, e) => s + (e.durationMinutes || 0), 0) || 0;
  const totalForms = formsData?.length || 0;
  const totalEmailTemplates = emailTemplatesData?.length || 0;
  const activeAgents = agentsData?.filter((a) => a.status === "ACTIVE").length || 0;
  const totalMedia = mediaData?.length || 0;
  const publishedPages = pagesData?.filter((p) => p.status === "PUBLISHED").length || 0;
  const totalFunnels = funnelsData?.length || 0;
  const activePhoneNumbers = phoneNumbersData?.filter((p) => p.isActive).length || 0;
  const totalDocuments = documentsData?.length || 0;

  const isLoading = loadingBookings || loadingEvents;

  const stats = [
    {
      label: "Bookings",
      value: totalBookings,
      icon: CalendarCheck,
      testId: "text-total-bookings",
    },
    {
      label: "Confirmed",
      value: confirmedBookings,
      icon: TrendingUp,
      testId: "text-confirmed-bookings",
      valueClass: "text-chart-2",
    },
    {
      label: "Canceled",
      value: canceledBookings,
      icon: XCircle,
      testId: "text-canceled-bookings",
      valueClass: "text-destructive",
    },
    {
      label: "Event Types",
      value: activeEventTypes,
      icon: Users,
      testId: "text-active-events",
    },
  ];

  const moduleStats = [
    {
      label: "Customers",
      value: totalCustomers,
      icon: Users,
      testId: "text-total-customers",
      href: "/hud/crm/customers",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-600/[0.08] dark:bg-emerald-600/[0.15]",
    },
    {
      label: "Products",
      value: totalProducts,
      icon: ShoppingBag,
      testId: "text-total-products",
      href: "/hud/products",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-600/[0.08] dark:bg-orange-600/[0.15]",
    },
    {
      label: "Open Tickets",
      value: openTickets,
      icon: HeadphonesIcon,
      testId: "text-open-tickets",
      href: "/hud/support",
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-600/[0.08] dark:bg-rose-600/[0.15]",
    },
    {
      label: "Revenue",
      value: `$${(paidRevenue / 100).toFixed(0)}`,
      icon: DollarSign,
      testId: "text-paid-revenue",
      href: "/hud/finance",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-600/[0.08] dark:bg-emerald-600/[0.15]",
    },
    {
      label: "Time Logged",
      value: totalTimeMinutes > 0 ? `${Math.floor(totalTimeMinutes / 60)}h` : "0h",
      icon: Timer,
      testId: "text-time-logged",
      href: "/hud/time-tracking",
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-600/[0.08] dark:bg-violet-600/[0.15]",
    },
    {
      label: "Forms",
      value: totalForms,
      icon: FileText,
      testId: "text-total-forms",
      href: "/hud/forms",
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-600/[0.08] dark:bg-sky-600/[0.15]",
    },
    {
      label: "Templates",
      value: totalEmailTemplates,
      icon: Mail,
      testId: "text-total-templates",
      href: "/hud/email",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-600/[0.08] dark:bg-amber-600/[0.15]",
    },
    {
      label: "Active Agents",
      value: activeAgents,
      icon: Bot,
      testId: "text-active-agents",
      href: "/hud/agents",
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-600/[0.08] dark:bg-cyan-600/[0.15]",
    },
    {
      label: "Media",
      value: totalMedia,
      icon: ImageIcon,
      testId: "text-total-media",
      href: "/hud/media",
      color: "text-pink-600 dark:text-pink-400",
      bg: "bg-pink-600/[0.08] dark:bg-pink-600/[0.15]",
    },
    {
      label: "Video",
      value: videoSettings?.videoProvider === "jitsi" ? "Jitsi" : videoSettings?.videoProvider === "zoom" ? "Zoom" : "Off",
      icon: Video,
      testId: "text-video-status",
      href: "/hud/settings",
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-600/[0.08] dark:bg-teal-600/[0.15]",
    },
    {
      label: "Pages",
      value: publishedPages,
      icon: FileCode,
      testId: "text-published-pages",
      href: "/hud/pages",
      color: "text-lime-600 dark:text-lime-400",
      bg: "bg-lime-600/[0.08] dark:bg-lime-600/[0.15]",
    },
    {
      label: "Funnels",
      value: totalFunnels,
      icon: GitBranch,
      testId: "text-total-funnels",
      href: "/hud/funnels",
      color: "text-fuchsia-600 dark:text-fuchsia-400",
      bg: "bg-fuchsia-600/[0.08] dark:bg-fuchsia-600/[0.15]",
    },
    {
      label: "Phone Lines",
      value: activePhoneNumbers,
      icon: Phone,
      testId: "text-active-phone-numbers",
      href: "/hud/phone",
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-600/[0.08] dark:bg-teal-600/[0.15]",
    },
    {
      label: "Documents",
      value: totalDocuments,
      icon: FileSignature,
      testId: "text-total-documents",
      href: "/hud/documents",
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-600/[0.08] dark:bg-indigo-600/[0.15]",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your business activity
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))
          : stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {stat.label}
                    </span>
                    <div className="w-8 h-8 rounded-md bg-primary/[0.08] dark:bg-primary/[0.15] flex items-center justify-center">
                      <stat.icon className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${stat.valueClass || ""}`} data-testid={stat.testId}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Modules</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {moduleStats.map((ms) => (
            <Link key={ms.label} href={ms.href}>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className={`w-10 h-10 rounded-md ${ms.bg} flex items-center justify-center mx-auto mb-2`}>
                    <ms.icon className={`h-5 w-5 ${ms.color}`} />
                  </div>
                  <div className={`text-xl font-bold ${ms.color}`} data-testid={ms.testId}>{ms.value}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{ms.label}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
          <CardTitle className="text-base font-medium">Upcoming Bookings</CardTitle>
          <Link href="/hud/bookings">
            <Button variant="ghost" size="sm" data-testid="link-all-bookings">
              View All
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingBookings ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <CalendarCheck className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium" data-testid="text-no-upcoming">No upcoming bookings</p>
              <p className="text-xs text-muted-foreground mt-1">
                Bookings will appear here once confirmed
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-3 rounded-md bg-muted/40"
                  data-testid={`card-booking-${booking.id}`}
                >
                  <div className="w-10 h-10 rounded-md bg-primary/[0.08] dark:bg-primary/[0.15] flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{booking.inviteeName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(booking.startAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0 text-[11px]">
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
