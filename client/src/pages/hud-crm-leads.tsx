import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead, Pipeline, Note } from "@shared/schema";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Target, Plus, Loader2, Trash2, StickyNote, UserCheck, ChevronLeft, ChevronRight,
  Mail, Phone, Globe, Settings2, ArrowRightLeft
} from "lucide-react";

function timeAgo(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export default function HudCrmLeads() {
  const { toast } = useToast();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [pipelineManageOpen, setPipelineManageOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: "",
  });

  const [editData, setEditData] = useState<Partial<Lead>>({});

  const [newPipelineName, setNewPipelineName] = useState("");
  const [newPipelineStages, setNewPipelineStages] = useState("New Lead, Contacted, Qualified, Proposal, Won, Lost");

  const pipelinesQuery = useQuery<Pipeline[]>({
    queryKey: ["/api/admin/pipelines"],
  });

  const pipelines = pipelinesQuery.data || [];
  const activePipelineId = selectedPipelineId || pipelines[0]?.id;
  const activePipeline = pipelines.find((p) => p.id === activePipelineId);

  const leadsQuery = useQuery<Lead[]>({
    queryKey: activePipelineId
      ? [`/api/admin/leads?pipelineId=${activePipelineId}`]
      : ["/api/admin/leads"],
    enabled: !!activePipelineId,
  });

  const leadDetailQuery = useQuery<{ lead: Lead; notes: Note[]; activity: any[] }>({
    queryKey: ["/api/admin/leads", selectedLeadId],
    enabled: !!selectedLeadId,
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/admin/leads", {
        ...data,
        pipelineId: activePipelineId,
        email: data.email || null,
        phone: data.phone || null,
        source: data.source || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      setCreateOpen(false);
      setFormData({ name: "", email: "", phone: "", source: "" });
      toast({ title: "Lead created" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/leads/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      toast({ title: "Lead updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      setSelectedLeadId(null);
      toast({ title: "Lead deleted" });
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/leads/${id}/convert`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      setSelectedLeadId(null);
      toast({ title: "Lead converted to customer" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const createPipelineMutation = useMutation({
    mutationFn: async () => {
      const stages = newPipelineStages.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await apiRequest("POST", "/api/admin/pipelines", {
        name: newPipelineName,
        stages: JSON.stringify(stages),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pipelines"] });
      setNewPipelineName("");
      setNewPipelineStages("New Lead, Contacted, Qualified, Proposal, Won, Lost");
      toast({ title: "Pipeline created" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deletePipelineMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/pipelines/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pipelines"] });
      if (selectedPipelineId) setSelectedPipelineId(null);
      toast({ title: "Pipeline deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ entityId, content }: { entityId: string; content: string }) => {
      const res = await apiRequest("POST", "/api/admin/notes", {
        entityType: "lead",
        entityId,
        content,
      });
      return res.json();
    },
    onSuccess: () => {
      if (selectedLeadId) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/leads", selectedLeadId] });
      }
      setNewNote("");
      toast({ title: "Note added" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await apiRequest("DELETE", `/api/admin/notes/${noteId}`);
    },
    onSuccess: () => {
      if (selectedLeadId) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/leads", selectedLeadId] });
      }
    },
  });

  const leads = leadsQuery.data || [];
  const stages: string[] = activePipeline ? JSON.parse(activePipeline.stages) : [];
  const detail = leadDetailQuery.data;

  function moveLeadToStage(lead: Lead, newStage: string) {
    updateLeadMutation.mutate({ id: lead.id, data: { stage: newStage } });
  }

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Leads
          </h1>
          <p className="text-muted-foreground text-sm mt-1" data-testid="text-page-subtitle">
            Track and manage your sales pipeline
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {pipelines.length > 0 && (
            <Select value={activePipelineId || ""} onValueChange={(v) => setSelectedPipelineId(v)}>
              <SelectTrigger className="w-[200px]" data-testid="select-pipeline">
                <SelectValue placeholder="Select pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="icon" data-testid="button-manage-pipelines" onClick={() => setPipelineManageOpen(true)}>
            <Settings2 className="h-4 w-4" />
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-lead" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" data-testid="dialog-create-lead">
              <DialogHeader>
                <DialogTitle>New Lead</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createLeadMutation.mutate(formData);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="leadName">Name *</Label>
                  <Input id="leadName" data-testid="input-lead-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadEmail">Email</Label>
                  <Input id="leadEmail" type="email" data-testid="input-lead-email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadPhone">Phone</Label>
                  <Input id="leadPhone" data-testid="input-lead-phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadSource">Source</Label>
                  <Select value={formData.source || "none"} onValueChange={(v) => setFormData({ ...formData, source: v === "none" ? "" : v })}>
                    <SelectTrigger data-testid="select-lead-source">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Social Media">Social Media</SelectItem>
                      <SelectItem value="Cold Call">Cold Call</SelectItem>
                      <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                      <SelectItem value="Event">Event</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={createLeadMutation.isPending} data-testid="button-submit-lead">
                  {createLeadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Lead
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {pipelinesQuery.isLoading || leadsQuery.isLoading ? (
        <div className="flex gap-4 overflow-x-auto flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[260px] w-[260px]">
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-24 w-full mb-2" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : stages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground" data-testid="text-empty-leads">No pipeline configured yet. Loading will create a default one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-3 overflow-x-auto flex-1 pb-4">
          {stages.map((stage, stageIdx) => {
            const stageLeads = leads.filter((l) => l.stage === stage);
            return (
              <div key={stage} className="min-w-[250px] w-[250px] flex flex-col shrink-0" data-testid={`column-stage-${stage.replace(/\s+/g, "-").toLowerCase()}`}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stage}</h3>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{stageLeads.length}</Badge>
                </div>
                <ScrollArea className="flex-1 min-h-0">
                  <div className="space-y-2 pr-2">
                    {stageLeads.map((lead) => (
                      <Card
                        key={lead.id}
                        className="cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                        data-testid={`card-lead-${lead.id}`}
                        onClick={() => {
                          setSelectedLeadId(lead.id);
                          setEditData(lead);
                        }}
                      >
                        <CardContent className="p-3 space-y-2">
                          <div className="font-medium text-sm truncate" data-testid={`text-lead-name-${lead.id}`}>{lead.name}</div>
                          {lead.email && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                          )}
                          {lead.source && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {lead.source}
                            </div>
                          )}
                          <div className="text-[10px] text-muted-foreground/70">{timeAgo(lead.updatedAt)}</div>
                          <div className="flex gap-1 pt-1">
                            {stageIdx > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px]"
                                data-testid={`button-move-left-${lead.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveLeadToStage(lead, stages[stageIdx - 1]);
                                }}
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </Button>
                            )}
                            {stageIdx < stages.length - 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px]"
                                data-testid={`button-move-right-${lead.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveLeadToStage(lead, stages[stageIdx + 1]);
                                }}
                              >
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={!!selectedLeadId} onOpenChange={(open) => { if (!open) setSelectedLeadId(null); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto" data-testid="sheet-lead-detail">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Lead Details
            </SheetTitle>
          </SheetHeader>
          {leadDetailQuery.isLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : detail ? (
            <div className="space-y-6 mt-6">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input
                    data-testid="input-edit-lead-name"
                    value={editData.name || ""}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    data-testid="input-edit-lead-email"
                    value={editData.email || ""}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    data-testid="input-edit-lead-phone"
                    value={editData.phone || ""}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Source</Label>
                  <Select value={editData.source || "none"} onValueChange={(v) => setEditData({ ...editData, source: v === "none" ? null : v })}>
                    <SelectTrigger data-testid="select-edit-lead-source">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Social Media">Social Media</SelectItem>
                      <SelectItem value="Cold Call">Cold Call</SelectItem>
                      <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                      <SelectItem value="Event">Event</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Stage</Label>
                  <Select value={editData.stage || ""} onValueChange={(v) => setEditData({ ...editData, stage: v })}>
                    <SelectTrigger data-testid="select-edit-lead-stage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-save-lead"
                  disabled={updateLeadMutation.isPending}
                  onClick={() => {
                    if (selectedLeadId) {
                      updateLeadMutation.mutate({
                        id: selectedLeadId,
                        data: {
                          name: editData.name,
                          email: editData.email || null,
                          phone: editData.phone || null,
                          source: editData.source || null,
                          stage: editData.stage,
                        },
                      });
                    }
                  }}
                >
                  {updateLeadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
                <div className="flex gap-2">
                  {detail.lead.email && detail.lead.stage !== "Won" && (
                    <Button
                      variant="outline"
                      className="flex-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      data-testid="button-convert-lead"
                      disabled={convertMutation.isPending}
                      onClick={() => convertMutation.mutate(detail.lead.id)}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      {convertMutation.isPending ? "Converting..." : "Convert to Customer"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    data-testid="button-delete-lead"
                    disabled={deleteLeadMutation.isPending}
                    onClick={() => deleteLeadMutation.mutate(detail.lead.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <StickyNote className="h-4 w-4" />
                  Notes ({detail.notes.length})
                </h3>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a note..."
                    data-testid="input-lead-note"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <Button
                    size="sm"
                    data-testid="button-add-lead-note"
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                    onClick={() => {
                      if (selectedLeadId && newNote.trim()) {
                        addNoteMutation.mutate({ entityId: selectedLeadId, content: newNote.trim() });
                      }
                    }}
                  >
                    {addNoteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Add Note
                  </Button>
                  {detail.notes.map((note: Note) => (
                    <div key={note.id} className="p-3 rounded-md bg-muted/50 text-sm" data-testid={`note-${note.id}`}>
                      <p className="whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                          data-testid={`button-delete-note-${note.id}`}
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {detail.activity.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3">Activity</h3>
                  <div className="space-y-2">
                    {detail.activity.map((a: any) => (
                      <div key={a.id} className="text-xs text-muted-foreground flex items-start gap-2" data-testid={`activity-${a.id}`}>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <div>
                          <span className="font-medium text-foreground capitalize">{a.action.replace(/_/g, " ")}</span>
                          <span className="ml-2">{new Date(a.createdAt).toLocaleString()}</span>
                          {a.details && a.action === "stage_changed" && (() => {
                            try {
                              const d = JSON.parse(a.details);
                              return <span className="ml-1 text-muted-foreground">{d.from} → {d.to}</span>;
                            } catch { return null; }
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={pipelineManageOpen} onOpenChange={setPipelineManageOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-manage-pipelines">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Manage Pipelines
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              {pipelines.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-md border" data-testid={`pipeline-item-${p.id}`}>
                  <div>
                    <span className="text-sm font-medium">{p.name}</span>
                    {p.isDefault && <Badge variant="secondary" className="ml-2 text-[10px]">Default</Badge>}
                  </div>
                  {!p.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-destructive hover:text-destructive"
                      data-testid={`button-delete-pipeline-${p.id}`}
                      onClick={() => deletePipelineMutation.mutate(p.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-medium">Create Pipeline</h4>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  data-testid="input-pipeline-name"
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                  placeholder="e.g. Enterprise Sales"
                />
              </div>
              <div className="space-y-2">
                <Label>Stages (comma-separated)</Label>
                <Textarea
                  data-testid="input-pipeline-stages"
                  value={newPipelineStages}
                  onChange={(e) => setNewPipelineStages(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
              <Button
                className="w-full"
                data-testid="button-create-pipeline"
                disabled={!newPipelineName.trim() || createPipelineMutation.isPending}
                onClick={() => createPipelineMutation.mutate()}
              >
                {createPipelineMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Pipeline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
