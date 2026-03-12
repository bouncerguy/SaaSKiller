import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { EmailTemplate, EmailLog } from "@shared/schema";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Mail, Plus, Loader2, Trash2, Send, CheckCircle2, XCircle, Clock, AlertTriangle, FileText, Wifi, WifiOff } from "lucide-react";

const emailStatusConfig: Record<string, { label: string; color: string }> = {
  QUEUED: { label: "Queued", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
  SENT: { label: "Sent", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  BOUNCED: { label: "Bounced", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
};

const categoryLabels: Record<string, string> = {
  transactional: "Transactional",
  marketing: "Marketing",
  notification: "Notification",
};

export default function HudEmail() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("templates");
  const [createOpen, setCreateOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    category: "transactional",
    bodyHtml: "",
    bodyText: "",
  });

  const [composeData, setComposeData] = useState({
    to: "",
    toName: "",
    subject: "",
    html: "",
    text: "",
  });

  const statusQuery = useQuery<{ smtpConfigured: boolean }>({
    queryKey: ["/api/admin/email/status"],
  });

  const templatesQuery = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email-templates"],
  });

  const templateDetailQuery = useQuery<EmailTemplate>({
    queryKey: ["/api/admin/email-templates", selectedTemplateId],
    enabled: !!selectedTemplateId,
  });

  const logsQuery = useQuery<EmailLog[]>({
    queryKey: ["/api/admin/email-logs"],
    enabled: activeTab === "sent",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/admin/email-templates", {
        name: data.name,
        subject: data.subject,
        category: data.category,
        bodyHtml: data.bodyHtml || "",
        bodyText: data.bodyText || "",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setCreateOpen(false);
      setFormData({ name: "", subject: "", category: "transactional", bodyHtml: "", bodyText: "" });
      toast({ title: "Template created" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/email-templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      toast({ title: "Template updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/email-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      setSelectedTemplateId(null);
      toast({ title: "Template deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: typeof composeData) => {
      const res = await apiRequest("POST", "/api/admin/email/send", data);
      return res.json();
    },
    onSuccess: (result: { status: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-logs"] });
      setComposeOpen(false);
      setComposeData({ to: "", toName: "", subject: "", html: "", text: "" });
      toast({
        title: result.status === "SENT" ? "Email sent" : "Email queued",
        description: result.status === "QUEUED" ? "SMTP not configured — email saved to queue" : undefined,
      });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const sendTestMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) throw new Error("Template not found");
      const res = await apiRequest("POST", "/api/admin/email/send-template", {
        templateId,
        to: user?.email || "",
        toName: user?.name || "",
        variables: {},
      });
      return res.json();
    },
    onSuccess: (result: { status: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-logs"] });
      toast({
        title: result.status === "SENT" ? "Test email sent" : "Test email queued",
        description: result.status === "QUEUED" ? "SMTP not configured — email saved to queue" : undefined,
      });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const templates = templatesQuery.data || [];
  const logs = logsQuery.data || [];
  const detail = templateDetailQuery.data;
  const smtpConfigured = statusQuery.data?.smtpConfigured ?? false;

  const activeCount = templates.filter((t) => t.isActive).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <Mail className="h-6 w-6 text-amber-500 dark:text-amber-400" />
            Email
          </h1>
          <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2" data-testid="text-page-subtitle">
            Manage email templates and view sent logs
            {activeCount > 0 && <Badge variant="secondary" className="text-[10px]">{activeCount} active</Badge>}
            <Badge
              variant="outline"
              className={`text-[10px] ${smtpConfigured ? "border-green-400 text-green-600 dark:text-green-400" : "border-gray-300 text-gray-500"}`}
              data-testid="badge-smtp-status"
            >
              {smtpConfigured ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              {smtpConfigured ? "SMTP Connected" : "SMTP Not Configured"}
            </Badge>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-compose-email">
                <Send className="h-4 w-4 mr-2" />
                Compose
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" data-testid="dialog-compose-email">
              <DialogHeader>
                <DialogTitle>Compose Email</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMutation.mutate(composeData);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>To Email *</Label>
                    <Input data-testid="input-compose-to" type="email" value={composeData.to} onChange={(e) => setComposeData({ ...composeData, to: e.target.value })} required placeholder="user@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Recipient Name</Label>
                    <Input data-testid="input-compose-to-name" value={composeData.toName} onChange={(e) => setComposeData({ ...composeData, toName: e.target.value })} placeholder="John Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Input data-testid="input-compose-subject" value={composeData.subject} onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })} required placeholder="Subject line" />
                </div>
                <div className="space-y-2">
                  <Label>Body (HTML)</Label>
                  <Textarea data-testid="input-compose-html" value={composeData.html} onChange={(e) => setComposeData({ ...composeData, html: e.target.value })} rows={6} placeholder="<p>Hello!</p>" />
                </div>
                <div className="space-y-2">
                  <Label>Body (Plain Text)</Label>
                  <Textarea data-testid="input-compose-text" value={composeData.text} onChange={(e) => setComposeData({ ...composeData, text: e.target.value })} rows={3} placeholder="Hello!" />
                </div>
                {!smtpConfigured && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    SMTP not configured — email will be queued in the database
                  </p>
                )}
                <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white" disabled={sendMutation.isPending} data-testid="button-send-email">
                  {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  {smtpConfigured ? "Send Email" : "Queue Email"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {activeTab === "templates" && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-template" className="bg-amber-500 hover:bg-amber-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" data-testid="dialog-create-template">
                <DialogHeader>
                  <DialogTitle>New Email Template</DialogTitle>
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
                    <Input data-testid="input-template-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Welcome Email" />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Input data-testid="input-template-subject" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required placeholder="Welcome to {{company}}" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger data-testid="select-template-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transactional">Transactional</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Body (HTML)</Label>
                    <Textarea data-testid="input-template-body-html" value={formData.bodyHtml} onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })} rows={6} placeholder="<h1>Hello {{name}}</h1>" />
                  </div>
                  <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white" disabled={createMutation.isPending} data-testid="button-submit-template">
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Template
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates" data-testid="tab-templates">Templates</TabsTrigger>
          <TabsTrigger value="sent" data-testid="tab-sent">Sent</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-4 space-y-2">
          {templatesQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground" data-testid="text-empty-templates">
                  No email templates yet. Create your first template to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                  data-testid={`card-template-${template.id}`}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate" data-testid={`text-template-name-${template.id}`}>{template.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{template.subject}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {new Date(template.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {categoryLabels[template.category] || template.category}
                        </Badge>
                        <Badge className={`border-0 ${template.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500"}`}>
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-4 space-y-2">
          {logsQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : logs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Send className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground" data-testid="text-empty-logs">
                  No emails sent yet. Sent emails will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const sc = emailStatusConfig[log.status];
                return (
                  <Card key={log.id} data-testid={`card-log-${log.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {log.status === "SENT" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          ) : log.status === "FAILED" ? (
                            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                          ) : log.status === "BOUNCED" ? (
                            <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate" data-testid={`text-log-subject-${log.id}`}>{log.subject}</div>
                            <div className="text-xs text-muted-foreground truncate" data-testid={`text-log-to-${log.id}`}>
                              To: {log.toName ? `${log.toName} <${log.toEmail}>` : log.toEmail}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {log.sentAt ? new Date(log.sentAt).toLocaleString() : new Date(log.createdAt).toLocaleString()}
                            </div>
                            {log.errorMessage && (
                              <div className="text-[11px] text-red-500 mt-0.5">{log.errorMessage}</div>
                            )}
                          </div>
                        </div>
                        <Badge className={`${sc?.color || ""} border-0 shrink-0`}>
                          {sc?.label || log.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Sheet open={!!selectedTemplateId} onOpenChange={(open) => { if (!open) setSelectedTemplateId(null); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto" data-testid="sheet-template-detail">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-amber-500" />
              Template Details
            </SheetTitle>
          </SheetHeader>
          {templateDetailQuery.isLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : detail ? (
            <div className="space-y-4 mt-6">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  data-testid="input-edit-template-name"
                  defaultValue={detail.name}
                  onBlur={(e) => {
                    if (e.target.value !== detail.name) {
                      updateMutation.mutate({ id: detail.id, data: { name: e.target.value } });
                    }
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input
                  data-testid="input-edit-template-subject"
                  defaultValue={detail.subject}
                  onBlur={(e) => {
                    if (e.target.value !== detail.subject) {
                      updateMutation.mutate({ id: detail.id, data: { subject: e.target.value } });
                    }
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  defaultValue={detail.category}
                  onValueChange={(v) => updateMutation.mutate({ id: detail.id, data: { category: v } })}
                >
                  <SelectTrigger data-testid="select-edit-template-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label>Active</Label>
                <Switch
                  data-testid="switch-edit-template-active"
                  checked={detail.isActive}
                  onCheckedChange={(checked) => updateMutation.mutate({ id: detail.id, data: { isActive: checked } })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Body (HTML)</Label>
                <Textarea
                  data-testid="input-edit-template-body-html"
                  defaultValue={detail.bodyHtml || ""}
                  rows={8}
                  onBlur={(e) => {
                    if (e.target.value !== (detail.bodyHtml || "")) {
                      updateMutation.mutate({ id: detail.id, data: { bodyHtml: e.target.value } });
                    }
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Body (Plain Text)</Label>
                <Textarea
                  data-testid="input-edit-template-body-text"
                  defaultValue={detail.bodyText || ""}
                  rows={4}
                  onBlur={(e) => {
                    if (e.target.value !== (detail.bodyText || "")) {
                      updateMutation.mutate({ id: detail.id, data: { bodyText: e.target.value } });
                    }
                  }}
                />
              </div>
              {detail.bodyHtml && (
                <div className="space-y-1.5">
                  <Label>Preview</Label>
                  <Card>
                    <CardContent className="p-4">
                      <iframe
                        data-testid="text-template-preview"
                        sandbox=""
                        srcDoc={detail.bodyHtml}
                        className="w-full min-h-[200px] border-0 rounded"
                        title="Email preview"
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
              {detail.variablesJson && detail.variablesJson !== "[]" && (
                <div className="space-y-1.5">
                  <Label>Variables</Label>
                  <div className="flex flex-wrap gap-1">
                    {(() => {
                      try {
                        const vars = JSON.parse(detail.variablesJson);
                        return Array.isArray(vars) ? vars.map((v: string, i: number) => (
                          <Badge key={i} variant="secondary" data-testid={`badge-variable-${i}`}>
                            {`{{${v}}}`}
                          </Badge>
                        )) : null;
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                </div>
              )}
              <div className="text-[11px] text-muted-foreground">
                Created {new Date(detail.createdAt).toLocaleDateString()}
                {detail.updatedAt && ` · Updated ${new Date(detail.updatedAt).toLocaleDateString()}`}
              </div>
              <Button
                variant="outline"
                className="w-full border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                data-testid="button-test-send"
                disabled={sendTestMutation.isPending || !detail.isActive}
                onClick={() => sendTestMutation.mutate(detail.id)}
              >
                {sendTestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send Test to {user?.email || "me"}
              </Button>
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-600"
                data-testid="button-delete-template"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (selectedTemplateId) {
                    deleteMutation.mutate(selectedTemplateId);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Template
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
