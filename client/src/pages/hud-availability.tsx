import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Clock, Trash2, Calendar } from "lucide-react";
import type { AvailabilityRule } from "@shared/schema";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};
const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  const label = `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${m} ${h < 12 ? "AM" : "PM"}`;
  return { value: `${String(h).padStart(2, "0")}:${m}`, label };
});

export default function AdminAvailability() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const { data: rules, isLoading } = useQuery<AvailabilityRule[]>({
    queryKey: ["/api/admin/availability"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/admin/availability", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/availability"] });
      setIsOpen(false);
      toast({ title: "Availability rule added" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/availability/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/availability"] });
      toast({ title: "Rule removed" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      dayOfWeek: formData.get("dayOfWeek") as string,
      startTime: formData.get("startTime") as string,
      endTime: formData.get("endTime") as string,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  const groupedRules = DAYS.reduce(
    (acc, day) => {
      acc[day] = rules?.filter((r) => r.dayOfWeek === day) || [];
      return acc;
    },
    {} as Record<string, AvailabilityRule[]>,
  );

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-availability-title">Availability</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Set your weekly availability for bookings
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <Button onClick={() => setIsOpen(true)} data-testid="button-add-availability">
            <Plus className="h-4 w-4 mr-2" />
            Add Time Slot
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Availability</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select name="dayOfWeek" defaultValue="MONDAY">
                  <SelectTrigger data-testid="select-day">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {DAY_LABELS[d]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select name="startTime" defaultValue="09:00">
                    <SelectTrigger data-testid="select-start-time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Select name="endTime" defaultValue="17:00">
                    <SelectTrigger data-testid="select-end-time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-save-availability">
                {createMutation.isPending ? "Saving..." : "Add Availability"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-visible">
          <CardContent className="p-0">
            {DAYS.map((day, idx) => {
              const dayRules = groupedRules[day];
              const isWeekend = day === "SATURDAY" || day === "SUNDAY";
              return (
                <div
                  key={day}
                  className={`flex items-center gap-4 px-5 py-4 ${idx < DAYS.length - 1 ? "border-b" : ""}`}
                  data-testid={`card-day-${day.toLowerCase()}`}
                >
                  <div className="w-14 flex-shrink-0">
                    <span className={`text-sm font-medium ${isWeekend && dayRules.length === 0 ? "text-muted-foreground" : ""}`}>
                      {DAY_SHORT[day]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {dayRules.length === 0 ? (
                      <span className="text-sm text-muted-foreground">Unavailable</span>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        {dayRules.map((rule) => (
                          <div
                            key={rule.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/[0.06] dark:bg-primary/[0.12] text-sm"
                          >
                            <Clock className="h-3 w-3 text-primary flex-shrink-0" />
                            <span className="text-[13px]">
                              {formatTime(rule.startTime)} - {formatTime(rule.endTime)}
                            </span>
                            <button
                              onClick={() => deleteMutation.mutate(rule.id)}
                              className="ml-1 text-muted-foreground/60 hover:text-foreground transition-colors"
                              data-testid={`button-delete-rule-${rule.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}
