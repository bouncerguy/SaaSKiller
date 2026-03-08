import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TimeEntry, Customer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Timer, Plus, Loader2, Trash2, Clock, DollarSign } from "lucide-react";

function formatDuration(mins: number | null) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatRate(cents: number | null) {
  if (!cents) return "";
  return `$${(cents / 100).toFixed(2)}/hr`;
}

export default function HudTimeTracking() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    description: "",
    startAt: "",
    endAt: "",
    billable: true,
    hourlyRate: "",
    customerId: "",
  });

  const entriesQuery = useQuery<TimeEntry[]>({
    queryKey: ["/api/admin/time-entries"],
  });

  const customersQuery = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/admin/time-entries", {
        description: data.description || null,
        startAt: new Date(data.startAt).toISOString(),
        endAt: data.endAt ? new Date(data.endAt).toISOString() : null,
        billable: data.billable,
        hourlyRate: data.hourlyRate ? Math.round(parseFloat(data.hourlyRate) * 100) : null,
        customerId: data.customerId || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/time-entries"] });
      setCreateOpen(false);
      setFormData({ description: "", startAt: "", endAt: "", billable: true, hourlyRate: "", customerId: "" });
      toast({ title: "Time entry created" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/time-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/time-entries"] });
      toast({ title: "Time entry deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const entries = entriesQuery.data || [];
  const customers = customersQuery.data || [];

  const totalMinutes = entries.reduce((s, e) => s + (e.durationMinutes || 0), 0);
  const billableMinutes = entries.filter((e) => e.billable).reduce((s, e) => s + (e.durationMinutes || 0), 0);
  const totalEarnings = entries.filter((e) => e.billable && e.hourlyRate && e.durationMinutes).reduce((s, e) => {
    return s + ((e.durationMinutes! / 60) * (e.hourlyRate! / 100));
  }, 0);

  const customerName = (id: string | null) => {
    if (!id) return null;
    return customers.find((c) => c.id === id)?.name || null;
  };

  const groupedByDate: Record<string, TimeEntry[]> = {};
  entries.forEach((e) => {
    const day = new Date(e.startAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    if (!groupedByDate[day]) groupedByDate[day] = [];
    groupedByDate[day].push(e);
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <Timer className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            Time Tracking
          </h1>
          <p className="text-muted-foreground text-sm mt-1" data-testid="text-page-subtitle">
            Track time spent on tasks and projects
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-time-entry" className="bg-violet-600 hover:bg-violet-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Log Time
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-testid="dialog-create-time-entry">
            <DialogHeader>
              <DialogTitle>Log Time</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Description</Label>
                <Input data-testid="input-time-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="What did you work on?" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start *</Label>
                  <Input type="datetime-local" data-testid="input-time-start" value={formData.startAt} onChange={(e) => setFormData({ ...formData, startAt: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>End</Label>
                  <Input type="datetime-local" data-testid="input-time-end" value={formData.endAt} onChange={(e) => setFormData({ ...formData, endAt: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={formData.customerId} onValueChange={(v) => setFormData({ ...formData, customerId: v })}>
                  <SelectTrigger data-testid="select-time-customer">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-2">
                  <Label>Hourly Rate ($)</Label>
                  <Input type="number" step="0.01" min="0" data-testid="input-time-rate" value={formData.hourlyRate} onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })} placeholder="0.00" />
                </div>
                <div className="flex items-center gap-2 h-10">
                  <Switch id="billable" data-testid="switch-billable" checked={formData.billable} onCheckedChange={(checked) => setFormData({ ...formData, billable: checked })} />
                  <Label htmlFor="billable" className="cursor-pointer text-sm">Billable</Label>
                </div>
              </div>
              <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white" disabled={createMutation.isPending} data-testid="button-submit-time-entry">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Log Time
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total Time</div>
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400" data-testid="text-total-time">{formatDuration(totalMinutes)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Billable Time</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-billable-time">{formatDuration(billableMinutes)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Estimated Earnings</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-total-earnings">${totalEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {entriesQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Timer className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground" data-testid="text-empty-time-entries">No time entries yet. Log your first time entry.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, dayEntries]) => (
            <div key={date} className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">{date}</div>
              {dayEntries.map((entry) => (
                <Card key={entry.id} data-testid={`card-time-entry-${entry.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate" data-testid={`text-time-desc-${entry.id}`}>
                            {entry.description || "No description"}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                            <span>{new Date(entry.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            {entry.endAt && (
                              <>
                                <span>→</span>
                                <span>{new Date(entry.endAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              </>
                            )}
                            {customerName(entry.customerId) && (
                              <span className="text-muted-foreground/70">• {customerName(entry.customerId)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-sm">{formatDuration(entry.durationMinutes)}</span>
                        {entry.billable ? (
                          <Badge variant="outline" className="border-emerald-400 text-emerald-600 dark:text-emerald-400 text-[10px]">
                            <DollarSign className="h-3 w-3" />
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Non-bill</Badge>
                        )}
                        {entry.hourlyRate && (
                          <span className="text-xs text-muted-foreground">{formatRate(entry.hourlyRate)}</span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                          data-testid={`button-delete-time-${entry.id}`}
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(entry.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
