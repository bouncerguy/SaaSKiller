import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar, Mail, Clock, X, CalendarCheck } from "lucide-react";
import { format } from "date-fns";
import type { Booking } from "@shared/schema";

export default function AdminBookings() {
  const [cancelId, setCancelId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/admin/bookings/${id}/cancel`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      setCancelId(null);
      toast({ title: "Booking canceled" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const now = new Date();
  const upcoming = bookings?.filter((b) => b.status === "CONFIRMED" && new Date(b.startAt) > now)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()) || [];
  const past = bookings?.filter((b) => b.status === "CONFIRMED" && new Date(b.startAt) <= now)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()) || [];
  const canceled = bookings?.filter((b) => b.status === "CANCELED")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  const renderBookingCard = (booking: Booking, showCancel = false) => (
    <div
      key={booking.id}
      className="flex items-center gap-4 p-4 rounded-md border"
      data-testid={`card-booking-${booking.id}`}
    >
      <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Calendar className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium" data-testid={`text-invitee-${booking.id}`}>
            {booking.inviteeName}
          </p>
          <Badge
            variant={booking.status === "CONFIRMED" ? "secondary" : "destructive"}
            className="text-xs"
          >
            {booking.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            {booking.inviteeEmail}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {format(new Date(booking.startAt), "MMM d, yyyy 'at' h:mm a")}
          </span>
        </div>
        {booking.notes && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {booking.notes}
          </p>
        )}
      </div>
      {showCancel && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCancelId(booking.id)}
          data-testid={`button-cancel-booking-${booking.id}`}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const renderEmpty = (message: string) => (
    <div className="text-center py-12">
      <CalendarCheck className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-bookings-title">Bookings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          View and manage all your bookings
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList data-testid="tabs-booking-filter">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-past">
              Past ({past.length})
            </TabsTrigger>
            <TabsTrigger value="canceled" data-testid="tab-canceled">
              Canceled ({canceled.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {upcoming.length === 0
              ? renderEmpty("No upcoming bookings")
              : upcoming.map((b) => renderBookingCard(b, true))}
          </TabsContent>
          <TabsContent value="past" className="mt-4 space-y-3">
            {past.length === 0
              ? renderEmpty("No past bookings")
              : past.map((b) => renderBookingCard(b))}
          </TabsContent>
          <TabsContent value="canceled" className="mt-4 space-y-3">
            {canceled.length === 0
              ? renderEmpty("No canceled bookings")
              : canceled.map((b) => renderBookingCard(b))}
          </TabsContent>
        </Tabs>
      )}

      <AlertDialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? The invitee will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-dialog-cancel">Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelId && cancelMutation.mutate(cancelId)}
              data-testid="button-confirm-cancel"
            >
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
