import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Ticket, User, Customer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeadphonesIcon, Plus, Loader2, Trash2, AlertCircle, Clock, CheckCircle2, Circle, Pause } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  OPEN: { label: "Open", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Circle },
  IN_PROGRESS: { label: "In Progress", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  WAITING: { label: "Waiting", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: Pause },
  RESOLVED: { label: "Resolved", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  CLOSED: { label: "Closed", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", icon: CheckCircle2 },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: "Low", color: "border-gray-400 text-gray-600 dark:text-gray-400" },
  MEDIUM: { label: "Medium", color: "border-blue-400 text-blue-600 dark:text-blue-400" },
  HIGH: { label: "High", color: "border-orange-400 text-orange-600 dark:text-orange-400" },
  URGENT: { label: "Urgent", color: "border-red-400 text-red-600 dark:text-red-400" },
};

export default function HudSupport() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "MEDIUM",
    customerId: "",
    assignedUserId: "",
  });

  const ticketsQuery = useQuery<Ticket[]>({
    queryKey: statusFilter !== "all"
      ? [`/api/admin/tickets?status=${statusFilter}`]
      : ["/api/admin/tickets"],
  });

  const ticketDetailQuery = useQuery<Ticket>({
    queryKey: ["/api/admin/tickets", selectedTicketId],
    enabled: !!selectedTicketId,
  });

  const customersQuery = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const teamQuery = useQuery<User[]>({
    queryKey: ["/api/admin/team"],
    enabled: user?.role === "OWNER",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/admin/tickets", {
        subject: data.subject,
        description: data.description || null,
        priority: data.priority,
        customerId: data.customerId || null,
        assignedUserId: data.assignedUserId || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
      setCreateOpen(false);
      setFormData({ subject: "", description: "", priority: "MEDIUM", customerId: "", assignedUserId: "" });
      toast({ title: "Ticket created" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/tickets/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
      toast({ title: "Ticket updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/tickets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
      setSelectedTicketId(null);
      toast({ title: "Ticket deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const tickets = ticketsQuery.data || [];
  const detail = ticketDetailQuery.data;
  const customers = customersQuery.data || [];
  const team = teamQuery.data || [];

  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <HeadphonesIcon className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            Support Tickets
          </h1>
          <p className="text-muted-foreground text-sm mt-1" data-testid="text-page-subtitle">
            Manage customer support requests
            {openCount > 0 && <Badge variant="secondary" className="ml-2 text-[10px]">{openCount} open</Badge>}
            {inProgressCount > 0 && <Badge variant="secondary" className="ml-1 text-[10px]">{inProgressCount} in progress</Badge>}
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-ticket" className="bg-rose-600 hover:bg-rose-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-testid="dialog-create-ticket">
            <DialogHeader>
              <DialogTitle>New Support Ticket</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input data-testid="input-ticket-subject" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea data-testid="input-ticket-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger data-testid="select-ticket-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select value={formData.customerId} onValueChange={(v) => setFormData({ ...formData, customerId: v })}>
                    <SelectTrigger data-testid="select-ticket-customer">
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
              </div>
              {team.length > 0 && (
                <div className="space-y-2">
                  <Label>Assign to</Label>
                  <Select value={formData.assignedUserId} onValueChange={(v) => setFormData({ ...formData, assignedUserId: v })}>
                    <SelectTrigger data-testid="select-ticket-assignee">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {team.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white" disabled={createMutation.isPending} data-testid="button-submit-ticket">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Ticket
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="OPEN" data-testid="tab-open">Open</TabsTrigger>
          <TabsTrigger value="IN_PROGRESS" data-testid="tab-in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="WAITING" data-testid="tab-waiting">Waiting</TabsTrigger>
          <TabsTrigger value="RESOLVED" data-testid="tab-resolved">Resolved</TabsTrigger>
          <TabsTrigger value="CLOSED" data-testid="tab-closed">Closed</TabsTrigger>
        </TabsList>
      </Tabs>

      {ticketsQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <HeadphonesIcon className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground" data-testid="text-empty-tickets">
              {statusFilter !== "all" ? "No tickets with this status" : "No support tickets yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => {
            const sc = statusConfig[ticket.status];
            const pc = priorityConfig[ticket.priority];
            const StatusIcon = sc?.icon || Circle;
            return (
              <Card
                key={ticket.id}
                className="cursor-pointer hover:border-rose-300 dark:hover:border-rose-700 transition-colors"
                data-testid={`card-ticket-${ticket.id}`}
                onClick={() => setSelectedTicketId(ticket.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <StatusIcon className={`h-5 w-5 mt-0.5 shrink-0 ${sc?.color.includes("blue") ? "text-blue-500" : sc?.color.includes("yellow") ? "text-yellow-500" : sc?.color.includes("green") ? "text-green-500" : sc?.color.includes("purple") ? "text-purple-500" : "text-gray-500"}`} />
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate" data-testid={`text-ticket-subject-${ticket.id}`}>{ticket.subject}</div>
                        {ticket.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{ticket.description}</p>
                        )}
                        <div className="text-[11px] text-muted-foreground mt-1">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={pc?.color || ""}>
                        {ticket.priority === "URGENT" && <AlertCircle className="h-3 w-3 mr-1" />}
                        {pc?.label}
                      </Badge>
                      <Badge className={`${sc?.color || ""} border-0`}>
                        {sc?.label}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={!!selectedTicketId} onOpenChange={(open) => { if (!open) setSelectedTicketId(null); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto" data-testid="sheet-ticket-detail">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <HeadphonesIcon className="h-5 w-5 text-rose-600" />
              Ticket Details
            </SheetTitle>
          </SheetHeader>
          {ticketDetailQuery.isLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : detail ? (
            <div className="space-y-4 mt-6">
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input
                  data-testid="input-edit-ticket-subject"
                  defaultValue={detail.subject}
                  onBlur={(e) => {
                    if (e.target.value !== detail.subject) {
                      updateMutation.mutate({ id: detail.id, data: { subject: e.target.value } });
                    }
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  data-testid="input-edit-ticket-description"
                  defaultValue={detail.description || ""}
                  rows={4}
                  onBlur={(e) => {
                    if (e.target.value !== (detail.description || "")) {
                      updateMutation.mutate({ id: detail.id, data: { description: e.target.value || null } });
                    }
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    defaultValue={detail.status}
                    onValueChange={(v) => updateMutation.mutate({ id: detail.id, data: { status: v } })}
                  >
                    <SelectTrigger data-testid="select-edit-ticket-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="WAITING">Waiting</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select
                    defaultValue={detail.priority}
                    onValueChange={(v) => updateMutation.mutate({ id: detail.id, data: { priority: v } })}
                  >
                    <SelectTrigger data-testid="select-edit-ticket-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Customer</Label>
                <Select
                  defaultValue={detail.customerId || "none"}
                  onValueChange={(v) => updateMutation.mutate({ id: detail.id, data: { customerId: v === "none" ? null : v } })}
                >
                  <SelectTrigger data-testid="select-edit-ticket-customer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {team.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Assigned to</Label>
                  <Select
                    defaultValue={detail.assignedUserId || "none"}
                    onValueChange={(v) => updateMutation.mutate({ id: detail.id, data: { assignedUserId: v === "none" ? null : v } })}
                  >
                    <SelectTrigger data-testid="select-edit-ticket-assignee">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {team.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {detail.resolvedAt && (
                <div className="text-xs text-muted-foreground p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                  Resolved on {new Date(detail.resolvedAt).toLocaleString()}
                </div>
              )}
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                data-testid="button-delete-ticket"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (selectedTicketId) {
                    deleteMutation.mutate(selectedTicketId);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Ticket
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
