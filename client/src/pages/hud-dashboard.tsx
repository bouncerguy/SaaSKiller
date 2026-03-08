import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarCheck, Clock, Users, ArrowRight, TrendingUp, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import type { Booking, EventType } from "@shared/schema";

export default function AdminDashboard() {
  const { data: bookings, isLoading: loadingBookings } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const { data: eventTypes, isLoading: loadingEvents } = useQuery<EventType[]>({
    queryKey: ["/api/admin/event-types"],
  });

  const upcomingBookings = bookings
    ?.filter((b) => b.status === "CONFIRMED" && new Date(b.startAt) > new Date())
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 5) || [];

  const totalBookings = bookings?.length || 0;
  const confirmedBookings = bookings?.filter((b) => b.status === "CONFIRMED").length || 0;
  const canceledBookings = bookings?.filter((b) => b.status === "CANCELED").length || 0;
  const activeEventTypes = eventTypes?.filter((e) => e.isActive).length || 0;

  const isLoading = loadingBookings || loadingEvents;

  const stats = [
    {
      label: "Total Bookings",
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

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your scheduling activity
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
