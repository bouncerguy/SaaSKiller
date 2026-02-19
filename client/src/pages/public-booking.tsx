import { useState } from "react";
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
import { format, isBefore, startOfDay } from "date-fns";
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
  const brandColor = tenant?.brandColor || "#5b4cdb";

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
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold" data-testid="text-not-found">Event Not Found</h2>
          <p className="text-muted-foreground text-sm mt-2">
            This event type doesn't exist or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  const LocationIcon = locationIcons[eventType.locationType] || Video;

  if (step === "confirmed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: brandColor + "15" }}
          >
            <Check className="h-8 w-8" style={{ color: brandColor }} />
          </div>
          <h2 className="text-xl font-semibold" data-testid="text-confirmed">
            Booking Confirmed
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            You're all set! A confirmation has been recorded.
          </p>

          <Card className="mt-8 text-left overflow-visible">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium">{eventType.title}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>
                  {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")} at{" "}
                  {formatTimeSlot(selectedTime)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <LocationIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{locationLabels[eventType.locationType]}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{timezone.replace(/_/g, " ")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl overflow-visible">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
            <div className="p-6 border-b md:border-b-0 md:border-r bg-muted/20 dark:bg-muted/10 md:rounded-l-[inherit]">
              {tenant?.logoUrl && (
                <img
                  src={tenant.logoUrl}
                  alt={tenant.name}
                  className="h-7 mb-4 object-contain"
                  data-testid="img-tenant-logo"
                />
              )}
              <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">
                {tenant?.name}
              </p>
              <h1 className="text-lg font-semibold mt-1" data-testid="text-event-title">
                {eventType.title}
              </h1>
              {eventType.description && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {eventType.description}
                </p>
              )}

              <div className="mt-5 space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>{eventType.durationMinutes} minutes</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <LocationIcon className="h-4 w-4 flex-shrink-0" />
                  <span>{locationLabels[eventType.locationType]}</span>
                </div>
              </div>

              <div className="mt-5">
                <Label className="text-xs text-muted-foreground">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="mt-1.5" data-testid="select-timezone">
                    <Globe className="h-3.5 w-3.5 mr-1.5 text-muted-foreground flex-shrink-0" />
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
                <div className="space-y-5">
                  <h2 className="text-sm font-medium" data-testid="text-select-date">
                    Select a Date & Time
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-5">
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
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium sticky top-0 bg-background pb-1.5">
                          {format(selectedDate, "EEEE, MMM d")}
                        </p>
                        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                          {loadingSlots ? (
                            <div className="space-y-1.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-9 w-full rounded-md" />
                              ))}
                            </div>
                          ) : slotsData?.slots.length === 0 ? (
                            <div className="py-8 text-center">
                              <p className="text-sm text-muted-foreground" data-testid="text-no-slots">
                                No available times
                              </p>
                            </div>
                          ) : (
                            slotsData?.slots.map((slot) => {
                              const isSelected = selectedTime === slot;
                              return (
                                <Button
                                  key={slot}
                                  variant={isSelected ? "default" : "outline"}
                                  className="w-full justify-center font-normal"
                                  onClick={() => setSelectedTime(slot)}
                                  style={
                                    isSelected
                                      ? { backgroundColor: brandColor, borderColor: brandColor }
                                      : {}
                                  }
                                  data-testid={`button-slot-${slot}`}
                                >
                                  {formatTimeSlot(slot)}
                                </Button>
                              );
                            })
                          )}
                        </div>
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
                <div className="space-y-5">
                  <button
                    onClick={() => setStep("select-time")}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover-elevate rounded-md px-2.5 py-1.5 -ml-2.5"
                    data-testid="button-back"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>

                  <div className="p-4 rounded-md bg-muted/40 space-y-0.5">
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
                        placeholder="Jane Smith"
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
                        placeholder="jane@example.com"
                        required
                        data-testid="input-invitee-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Anything you'd like us to know beforehand..."
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
