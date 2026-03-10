import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Agent, AgentRun } from "@shared/schema";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Plus,
  Loader2,
  Trash2,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  Calendar,
  FileText,
  UserPlus,
  HeadphonesIcon,
  RotateCw,
  Download,
} from "lucide-react";
import { HubSpotWorkflowImportDialog } from "@/components/hubspot-import-dialog";

const statusConfig: Record<string, { label: string; badgeClass: string }> = {
  ACTIVE: { label: "Active", badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0" },
  PAUSED: { label: "Paused", badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0" },
  DRAFT: { label: "Draft", badgeClass: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-0" },
};

const triggerConfig: Record<string, { label: string; icon: any; badgeClass: string }> = {
  manual: { label: "Manual", icon: Play, badgeClass: "border-cyan-400 text-cyan-700 dark:text-cyan-400" },
  schedule: { label: "Schedule", icon: Calendar, badgeClass: "border-violet-400 text-violet-700 dark:text-violet-400" },
  form_submission: { label: "Form Submission", icon: FileText, badgeClass: "border-sky-400 text-sky-700 dark:text-sky-400" },
  new_customer: { label: "New Customer", icon: UserPlus, badgeClass: "border-emerald-400 text-emerald-700 dark:text-emerald-400" },
  new_ticket: { label: "New Ticket", icon: HeadphonesIcon, badgeClass: "border-rose-400 text-rose-700 dark:text-rose-400" },
};

const runStatusConfig: Record<string, { label: string; icon: any; className: string }> = {
  success: { label: "Success", icon: CheckCircle2, className: "text-green-600 dark:text-green-400" },
  failed: { label: "Failed", icon: XCircle, className: "text-red-600 dark:text-red-400" },
  running: { label: "Running", icon: RotateCw, className: "text-blue-600 dark:text-blue-400" },
};

function formatTimeAgo(date: Date | string | null): string {
  if (!date) return "Never";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default function HudAgents() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("config");
  const [hubspotImportOpen, setHubspotImportOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    triggerType: "manual",
  });

  const [editData, setEditData] = useState({
    name: "",
    description: "",
    triggerType: "manual",
    triggerConfig: "{}",
    status: "DRAFT",
    actionsJson: "[]",
  });

  const agentsQuery = useQuery<Agent[]>({
    queryKey: ["/api/admin/agents"],
  });

  const agentDetailQuery = useQuery<Agent>({
    queryKey: ["/api/admin/agents", selectedAgentId],
    enabled: !!selectedAgentId,
  });

  const runsQuery = useQuery<AgentRun[]>({
    queryKey: ["/api/admin/agents", selectedAgentId, "runs"],
    enabled: !!selectedAgentId && activeTab === "runs",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/admin/agents", {
        name: data.name,
        description: data.description || null,
        triggerType: data.triggerType,
        triggerConfig: "{}",
        actionsJson: "[]",
        status: "DRAFT",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
      setCreateOpen(false);
      setFormData({ name: "", description: "", triggerType: "manual" });
      toast({ title: "Agent created" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/agents/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
      toast({ title: "Agent updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/agents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
      setSelectedAgentId(null);
      toast({ title: "Agent deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const runMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/agents/${id}/run`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
      if (selectedAgentId) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/agents", selectedAgentId, "runs"] });
      }
      toast({ title: "Agent triggered successfully" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const openDetail = useCallback((agent: Agent) => {
    setSelectedAgentId(agent.id);
    setActiveTab("config");
    setEditData({
      name: agent.name,
      description: agent.description || "",
      triggerType: agent.triggerType,
      triggerConfig: agent.triggerConfig || "{}",
      status: agent.status,
      actionsJson: agent.actionsJson || "[]",
    });
  }, []);

  const handleSaveConfig = () => {
    if (!selectedAgentId) return;
    updateMutation.mutate({
      id: selectedAgentId,
      data: {
        name: editData.name,
        description: editData.description || null,
        triggerType: editData.triggerType,
        triggerConfig: editData.triggerConfig,
        status: editData.status,
        actionsJson: editData.actionsJson,
      },
    });
  };

  const agents = agentsQuery.data || [];
  const detail = agentDetailQuery.data;
  const runs = runsQuery.data || [];

  const activeCount = agents.filter((a) => a.status === "ACTIVE").length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <Bot className="h-6 w-6 text-cyan-500 dark:text-cyan-400" />
            AI Agents
          </h1>
          <p className="text-muted-foreground text-sm mt-1" data-testid="text-page-subtitle">
            Workflow automations with triggers and actions
            {activeCount > 0 && <Badge variant="secondary" className="ml-2 text-[10px]">{activeCount} active</Badge>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setHubspotImportOpen(true)}
            data-testid="button-import-hubspot-workflows"
          >
            <Download className="h-4 w-4 mr-2" />
            Import from HubSpot
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-agent" className="bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-600">
              <Plus className="h-4 w-4 mr-2" />
              New Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-testid="dialog-create-agent">
            <DialogHeader>
              <DialogTitle>Create Agent</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  data-testid="input-agent-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Welcome Email Sender"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  data-testid="input-agent-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What does this agent do?"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <Select value={formData.triggerType} onValueChange={(v) => setFormData({ ...formData, triggerType: v })}>
                  <SelectTrigger data-testid="select-agent-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="schedule">Schedule</SelectItem>
                    <SelectItem value="form_submission">Form Submission</SelectItem>
                    <SelectItem value="new_customer">New Customer</SelectItem>
                    <SelectItem value="new_ticket">New Ticket</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-600"
                disabled={createMutation.isPending}
                data-testid="button-submit-agent"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Agent
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <HubSpotWorkflowImportDialog
        open={hubspotImportOpen}
        onOpenChange={setHubspotImportOpen}
      />

      {agentsQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground" data-testid="text-empty-agents">
              No agents yet. Create your first automation agent to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const sc = statusConfig[agent.status];
            const tc = triggerConfig[agent.triggerType] || triggerConfig.manual;
            const TriggerIcon = tc.icon;
            return (
              <Card
                key={agent.id}
                className="cursor-pointer hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors"
                data-testid={`card-agent-${agent.id}`}
                onClick={() => openDetail(agent)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate" data-testid={`text-agent-name-${agent.id}`}>
                        {agent.name}
                      </div>
                      {agent.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{agent.description}</p>
                      )}
                    </div>
                    <Badge className={sc?.badgeClass || ""} data-testid={`badge-agent-status-${agent.id}`}>
                      {sc?.label || agent.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={tc.badgeClass}>
                      <TriggerIcon className="h-3 w-3 mr-1" />
                      {tc.label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1" data-testid={`text-agent-runs-${agent.id}`}>
                      <Zap className="h-3 w-3" />
                      {agent.runCount} run{agent.runCount !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1" data-testid={`text-agent-last-run-${agent.id}`}>
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(agent.lastRunAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet
        open={!!selectedAgentId}
        onOpenChange={(open) => {
          if (!open) setSelectedAgentId(null);
        }}
      >
        <SheetContent className="sm:max-w-2xl overflow-y-auto" data-testid="sheet-agent-detail">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyan-500" />
              Agent Details
            </SheetTitle>
          </SheetHeader>

          {agentDetailQuery.isLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : detail ? (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={statusConfig[detail.status]?.badgeClass || ""}>
                    {statusConfig[detail.status]?.label || detail.status}
                  </Badge>
                  {(() => {
                    const tc = triggerConfig[detail.triggerType] || triggerConfig.manual;
                    const TIcon = tc.icon;
                    return (
                      <Badge variant="outline" className={tc.badgeClass}>
                        <TIcon className="h-3 w-3 mr-1" />
                        {tc.label}
                      </Badge>
                    );
                  })()}
                </div>
                <Button
                  data-testid="button-run-agent"
                  className="bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-600"
                  disabled={runMutation.isPending}
                  onClick={() => {
                    if (selectedAgentId) runMutation.mutate(selectedAgentId);
                  }}
                >
                  {runMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run Now
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="config" data-testid="tab-config" className="flex-1">
                    Config
                  </TabsTrigger>
                  <TabsTrigger value="runs" data-testid="tab-runs" className="flex-1">
                    Runs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="config" className="space-y-4 mt-4">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input
                      data-testid="input-edit-agent-name"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea
                      data-testid="input-edit-agent-description"
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Trigger Type</Label>
                      <Select
                        value={editData.triggerType}
                        onValueChange={(v) => setEditData({ ...editData, triggerType: v })}
                      >
                        <SelectTrigger data-testid="select-edit-agent-trigger">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="schedule">Schedule</SelectItem>
                          <SelectItem value="form_submission">Form Submission</SelectItem>
                          <SelectItem value="new_customer">New Customer</SelectItem>
                          <SelectItem value="new_ticket">New Ticket</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <Select
                        value={editData.status}
                        onValueChange={(v) => setEditData({ ...editData, status: v })}
                      >
                        <SelectTrigger data-testid="select-edit-agent-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="PAUSED">Paused</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Trigger Config (JSON)</Label>
                    <Textarea
                      data-testid="input-edit-agent-trigger-config"
                      value={editData.triggerConfig}
                      onChange={(e) => setEditData({ ...editData, triggerConfig: e.target.value })}
                      rows={3}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Actions (JSON)</Label>
                    <Textarea
                      data-testid="input-edit-agent-actions"
                      value={editData.actionsJson}
                      onChange={(e) => setEditData({ ...editData, actionsJson: e.target.value })}
                      rows={5}
                      className="font-mono text-xs"
                    />
                  </div>
                  <Button
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-600"
                    data-testid="button-save-agent"
                    disabled={updateMutation.isPending}
                    onClick={handleSaveConfig}
                  >
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Config
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-red-300 text-red-600"
                    data-testid="button-delete-agent"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (selectedAgentId) deleteMutation.mutate(selectedAgentId);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Agent
                  </Button>
                </TabsContent>

                <TabsContent value="runs" className="space-y-3 mt-4">
                  {runsQuery.isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : runs.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <Zap className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground" data-testid="text-empty-runs">
                          No runs yet. Trigger the agent to see run history.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    runs.map((run) => {
                      const rc = runStatusConfig[run.status] || runStatusConfig.running;
                      const RunIcon = rc.icon;
                      return (
                        <Card key={run.id} data-testid={`card-run-${run.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <RunIcon className={`h-5 w-5 mt-0.5 shrink-0 ${rc.className}`} />
                                <div className="min-w-0">
                                  <div className="font-medium text-sm" data-testid={`text-run-status-${run.id}`}>
                                    {rc.label}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    Started {new Date(run.startedAt).toLocaleString()}
                                  </div>
                                  {run.completedAt && (
                                    <div className="text-xs text-muted-foreground">
                                      Completed {new Date(run.completedAt).toLocaleString()}
                                    </div>
                                  )}
                                  {run.errorMessage && (
                                    <div className="text-xs text-red-600 dark:text-red-400 mt-1" data-testid={`text-run-error-${run.id}`}>
                                      {run.errorMessage}
                                    </div>
                                  )}
                                  {run.resultJson && run.status === "success" && (
                                    <div className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 p-2 rounded-md" data-testid={`text-run-result-${run.id}`}>
                                      {run.resultJson}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Badge className={run.status === "success" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0" : run.status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0"}>
                                {rc.label}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
