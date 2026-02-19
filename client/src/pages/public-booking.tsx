import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Clock,
  Video,
  Phone,
  MapPin,
  Globe,
  Check,
  ArrowLeft,
  CalendarIcon,
} from "lucide-react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import type { EventType, Tenant } from "@shared/schema";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const locationIcons: Record<string, typeof Video> = {
  VIDEO: Video,
  PHONE: Phone,
  IN_PERSON: MapPin,
  CUSTOM: Globe,
};

const locationLabels: Record<string, string> = {
  VIDEO: "Video Call",
  PHONE: "Phone Call",
  IN_PERSON: "In Person",
  CUSTOM: "Custom Location",
};

type BookingStep = "select-time" | "enter-details" | "confirmed";

interface SlotData {
  date: string;
  slots: string[];
}

export default function PublicBooking() {
  const { tenantSlug, eventSlug } = useParams<{ tenantSlug: string; eventSlug: string }>();
  const [step, setStep] = useState<BookingStep>("select-time");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const { toast } = useToast();

  const { data: eventData, isLoading: loadingEvent } = useQuery<{
    eventType: EventType;
    tenant: Tenant;
  }>({
    queryKey: ["/api/public", tenantSlug, eventSlug],
  });

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  const { data: slotsData, isLoading: loadingSlots } = useQuery<SlotData>({
    queryKey: ["/api/public", tenantSlug, eventSlug, "slots", dateStr, timezone],
    enabled: !!dateStr && !!eventData,
  });

  const bookMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest(
        "POST",
        `/api/public/${tenantSlug}/${eventSlug}/book`,
        data,
      );
      return res.json();
    },
    onSuccess: (data) => {
      setConfirmedBooking(data);
      setStep("confirmed");
    },
    onError: (err: Error) => {
      toast({
        title: "Booking failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleBooking = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    bookMutation.mutate({
      inviteeName: formData.get("inviteeName") as string,
      inviteeEmail: formData.get("inviteeEmail") as string,
      notes: formData.get("notes") as string || undefined,
      date: dateStr,
      time: selectedTime,
      timezone,
    });
  };

  const eventType = eventData?.eventType;
  const tenant = eventData?.tenant;
  const brandColor = tenant?.brandColor || "#1d4ed8";

  if (loadingEvent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl">
          <CardContent className="p-8 space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!eventType) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold" data-testid="text-not-found">Event Not Found</h2>
            <p className="text-muted-foreground text-sm mt-2">
              This event type doesn't exist or is not available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const LocationIcon = locationIcons[eventType.locationType] || Video;

  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: brandColor + "20" }}
            >
              <Check className="h-8 w-8" style={{ color: brandColor }} />
            </div>
            <h2 className="text-xl font-semibold" data-testid="text-confirmed">
              Booking Confirmed
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              You're all set! A confirmation has been recorded.
            </p>

            <div className="mt-6 p-4 rounded-md bg-muted/50 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>{eventType.title}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")} at{" "}
                  {formatTimeSlot(selectedTime)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <LocationIcon className="h-4 w-4 text-muted-foreground" />
                <span>{locationLabels[eventType.locationType]}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>{timezone}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl overflow-visible">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
            <div
              className="p-6 border-b md:border-b-0 md:border-r"
              style={{ borderColor: brandColor + "15" }}
            >
              {tenant?.logoUrl && (
                <img
                  src={tenant.logoUrl}
                  alt={tenant.name}
                  className="h-8 mb-4 object-contain"
                  data-testid="img-tenant-logo"
                />
              )}
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {tenant?.name}
              </p>
              <h1 className="text-xl font-semibold mt-1" data-testid="text-event-title">
                {eventType.title}
              </h1>
              {eventType.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {eventType.description}
                </p>
              )}

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{eventType.durationMinutes} minutes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LocationIcon className="h-4 w-4" />
                  <span>{locationLabels[eventType.locationType]}</span>
                </div>
              </div>

              <div className="mt-4">
                <Label className="text-xs text-muted-foreground">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="mt-1" data-testid="select-timezone">
                    <Globe className="h-3 w-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-6">
              {step === "select-time" && (
                <div className="space-y-4">
                  <h2 className="text-sm font-medium" data-testid="text-select-date">
                    Select a Date & Time
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-4">
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setSelectedTime("");
                        }}
                        disabled={(date) => isBefore(date, startOfDay(new Date()))}
                        className="rounded-md"
                        data-testid="calendar-date-picker"
                      />
                    </div>

                    {selectedDate && (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        <p className="text-xs text-muted-foreground font-medium sticky top-0 bg-background pb-1">
                          {format(selectedDate, "EEEE, MMM d")}
                        </p>
                        {loadingSlots ? (
                          <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Skeleton key={i} className="h-9 w-full" />
                            ))}
                          </div>
                        ) : slotsData?.slots.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4 text-center" data-testid="text-no-slots">
                            No available times
                          </p>
                        ) : (
                          slotsData?.slots.map((slot) => (
                            <Button
                              key={slot}
                              variant={selectedTime === slot ? "default" : "outline"}
                              className="w-full justify-center text-sm"
                              onClick={() => setSelectedTime(slot)}
                              style={
                                selectedTime === slot
                                  ? { backgroundColor: brandColor, borderColor: brandColor }
                                  : {}
                              }
                              data-testid={`button-slot-${slot}`}
                            >
                              {formatTimeSlot(slot)}
                            </Button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {selectedTime && (
                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={() => setStep("enter-details")}
                        style={{ backgroundColor: brandColor, borderColor: brandColor }}
                        data-testid="button-continue"
                      >
                        Continue
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {step === "enter-details" && (
                <div className="space-y-4">
                  <button
                    onClick={() => setStep("select-time")}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover-elevate rounded-md px-2 py-1"
                    data-testid="button-back"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back
                  </button>

                  <div className="p-3 rounded-md bg-muted/50">
                    <p className="text-sm font-medium">
                      {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatTimeSlot(selectedTime)} ({timezone.replace(/_/g, " ")})
                    </p>
                  </div>

                  <form onSubmit={handleBooking} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="inviteeName">Your Name</Label>
                      <Input
                        id="inviteeName"
                        name="inviteeName"
                        placeholder="John Doe"
                        required
                        data-testid="input-invitee-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inviteeEmail">Email Address</Label>
                      <Input
                        id="inviteeEmail"
                        name="inviteeEmail"
                        type="email"
                        placeholder="john@example.com"
                        required
                        data-testid="input-invitee-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Any additional information..."
                        data-testid="input-notes"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={bookMutation.isPending}
                      style={{ backgroundColor: brandColor, borderColor: brandColor }}
                      data-testid="button-confirm-booking"
                    >
                      {bookMutation.isPending ? "Scheduling..." : "Schedule Event"}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatTimeSlot(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}
