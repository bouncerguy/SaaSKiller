import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { AlertCircle, Download, Search, Building2, Mail, Phone, CheckCircle2, Loader2 } from "lucide-react";

interface HubSpotContact {
  hubspotId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  lifecycleStage: string;
}

interface HubSpotWorkflow {
  id: number;
  name: string;
  type: string;
  enabled: boolean;
  actions: any[];
}

interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
}

function HubSpotNotConfigured() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center space-y-3" data-testid="hubspot-not-configured">
      <AlertCircle className="h-10 w-10 text-amber-500" />
      <p className="font-medium">HubSpot Not Connected</p>
      <p className="text-sm text-muted-foreground max-w-sm">
        Add your HubSpot Private App token as <code className="bg-muted px-1.5 py-0.5 rounded text-xs">HUBSPOT_ACCESS_TOKEN</code> in your environment secrets to enable imports.
      </p>
    </div>
  );
}

export function HubSpotContactImportDialog({
  open,
  onOpenChange,
  mode,
  pipelineId,
  existingEmails = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "customers" | "leads";
  pipelineId?: string;
  existingEmails?: string[];
}) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const statusQuery = useQuery<{ configured: boolean }>({
    queryKey: ["/api/admin/hubspot/status"],
    enabled: open,
  });

  const contactsQuery = useQuery<HubSpotContact[]>({
    queryKey: ["/api/admin/hubspot/contacts"],
    enabled: open && statusQuery.data?.configured === true,
  });

  const importMutation = useMutation({
    mutationFn: async (contacts: HubSpotContact[]) => {
      const endpoint = mode === "customers"
        ? "/api/admin/hubspot/import-customers"
        : "/api/admin/hubspot/import-leads";

      const payload: any = {
        contacts: contacts.map((c) => ({
          name: c.name,
          email: c.email,
          phone: c.phone,
          company: c.company,
          address: c.address,
        })),
      };
      if (mode === "leads" && pipelineId) {
        payload.pipelineId = pipelineId;
      }

      const res = await apiRequest("POST", endpoint, payload);
      return res.json() as Promise<ImportResult>;
    },
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          if (typeof key !== "string") return false;
          return mode === "customers"
            ? key.startsWith("/api/admin/customers")
            : key.startsWith("/api/admin/leads");
        },
      });
      toast({
        title: `Imported ${result.imported} ${mode}`,
        description: result.skipped > 0 ? `${result.skipped} skipped (already exist)` : undefined,
      });
    },
    onError: (e: Error) => {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    },
  });

  const contacts = contactsQuery.data || [];
  const existingEmailSet = new Set(existingEmails.map((e) => e.toLowerCase()));

  const filteredContacts = contacts.filter((c) => {
    const q = searchFilter.toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q)
    );
  });

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const selectable = filteredContacts.filter(
      (c) => !existingEmailSet.has(c.email.toLowerCase())
    );
    if (selectable.every((c) => selectedIds.has(c.hubspotId))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectable.map((c) => c.hubspotId)));
    }
  };

  const handleImport = () => {
    const selected = contacts.filter((c) => selectedIds.has(c.hubspotId));
    importMutation.mutate(selected);
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearchFilter("");
    setImportResult(null);
    onOpenChange(false);
  };

  const isConfigured = statusQuery.data?.configured;
  const allSelectable = filteredContacts.filter(
    (c) => !existingEmailSet.has(c.email.toLowerCase())
  );
  const allSelected = allSelectable.length > 0 && allSelectable.every((c) => selectedIds.has(c.hubspotId));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col" data-testid="dialog-hubspot-import">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="text-hubspot-import-title">
            <Download className="h-5 w-5 text-orange-500" />
            Import {mode === "customers" ? "Customers" : "Leads"} from HubSpot
          </DialogTitle>
          <DialogDescription>
            Select contacts from your HubSpot account to import as {mode}.
          </DialogDescription>
        </DialogHeader>

        {statusQuery.isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isConfigured === false ? (
          <HubSpotNotConfigured />
        ) : importResult ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3" data-testid="hubspot-import-result">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">Import Complete</p>
            <p className="text-sm text-muted-foreground">
              {importResult.imported} {mode} imported
              {importResult.skipped > 0 && `, ${importResult.skipped} skipped (duplicates)`}
            </p>
            <Button onClick={handleClose} data-testid="button-import-done">Done</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9"
                  data-testid="input-hubspot-search"
                />
              </div>
              <Badge variant="secondary" data-testid="badge-hubspot-count">
                {contacts.length} contacts
              </Badge>
            </div>

            {contactsQuery.isLoading ? (
              <div className="space-y-2 py-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-hubspot-contacts">
                No contacts found in your HubSpot account.
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 pb-1">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    data-testid="checkbox-select-all"
                  />
                  <span className="text-sm text-muted-foreground">
                    Select all ({allSelectable.length} available)
                  </span>
                  {selectedIds.size > 0 && (
                    <Badge className="ml-auto" data-testid="badge-selected-count">
                      {selectedIds.size} selected
                    </Badge>
                  )}
                </div>
                <ScrollArea className="flex-1 min-h-0 max-h-[400px] border rounded-md">
                  <div className="divide-y">
                    {filteredContacts.map((contact) => {
                      const isDuplicate = existingEmailSet.has(contact.email.toLowerCase());
                      return (
                        <label
                          key={contact.hubspotId}
                          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors ${isDuplicate ? "opacity-50" : ""}`}
                          data-testid={`row-hubspot-contact-${contact.hubspotId}`}
                        >
                          <Checkbox
                            checked={selectedIds.has(contact.hubspotId)}
                            onCheckedChange={() => handleToggle(contact.hubspotId)}
                            disabled={isDuplicate}
                            data-testid={`checkbox-contact-${contact.hubspotId}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{contact.name}</span>
                              {isDuplicate && (
                                <Badge variant="outline" className="text-[10px] shrink-0">Already exists</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              {contact.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />{contact.email}
                                </span>
                              )}
                              {contact.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />{contact.phone}
                                </span>
                              )}
                              {contact.company && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />{contact.company}
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} data-testid="button-cancel-import">
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedIds.size === 0 || importMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                data-testid="button-import-selected"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Import {selectedIds.size} {mode}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function HubSpotWorkflowImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchFilter, setSearchFilter] = useState("");
  const [importResult, setImportResult] = useState<{ imported: number; total: number } | null>(null);

  const statusQuery = useQuery<{ configured: boolean }>({
    queryKey: ["/api/admin/hubspot/status"],
    enabled: open,
  });

  const workflowsQuery = useQuery<HubSpotWorkflow[]>({
    queryKey: ["/api/admin/hubspot/workflows"],
    enabled: open && statusQuery.data?.configured === true,
  });

  const importMutation = useMutation({
    mutationFn: async (workflows: HubSpotWorkflow[]) => {
      const res = await apiRequest("POST", "/api/admin/hubspot/import-workflows", {
        workflows: workflows.map((wf) => ({
          id: wf.id,
          name: wf.name,
          type: wf.type,
          enabled: wf.enabled,
          actions: wf.actions,
        })),
      });
      return res.json() as Promise<{ imported: number; total: number }>;
    },
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
      toast({ title: `Imported ${result.imported} workflows as agents` });
    },
    onError: (e: Error) => {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    },
  });

  const workflows = workflowsQuery.data || [];
  const filteredWorkflows = workflows.filter((wf) => {
    const q = searchFilter.toLowerCase();
    if (!q) return true;
    return wf.name.toLowerCase().includes(q) || wf.type.toLowerCase().includes(q);
  });

  const handleToggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (filteredWorkflows.every((wf) => selectedIds.has(wf.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredWorkflows.map((wf) => wf.id)));
    }
  };

  const handleImport = () => {
    const selected = workflows.filter((wf) => selectedIds.has(wf.id));
    importMutation.mutate(selected);
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearchFilter("");
    setImportResult(null);
    onOpenChange(false);
  };

  const isConfigured = statusQuery.data?.configured;
  const allSelected = filteredWorkflows.length > 0 && filteredWorkflows.every((wf) => selectedIds.has(wf.id));

  const typeLabels: Record<string, string> = {
    CONTACT_BASED: "Contact",
    TICKET_BASED: "Ticket",
    DEAL_BASED: "Deal",
    FORM_BASED: "Form",
    COMPANY_BASED: "Company",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col" data-testid="dialog-hubspot-workflow-import">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="text-hubspot-workflow-import-title">
            <Download className="h-5 w-5 text-orange-500" />
            Import Workflows from HubSpot
          </DialogTitle>
          <DialogDescription>
            Import HubSpot workflows as AI Agents. They'll be created in Draft status so you can review and configure them.
          </DialogDescription>
        </DialogHeader>

        {statusQuery.isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isConfigured === false ? (
          <HubSpotNotConfigured />
        ) : importResult ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3" data-testid="hubspot-workflow-import-result">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">Import Complete</p>
            <p className="text-sm text-muted-foreground">
              {importResult.imported} workflows imported as Draft agents
            </p>
            <Button onClick={handleClose} data-testid="button-workflow-import-done">Done</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workflows..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9"
                  data-testid="input-hubspot-workflow-search"
                />
              </div>
              <Badge variant="secondary" data-testid="badge-hubspot-workflow-count">
                {workflows.length} workflows
              </Badge>
            </div>

            {workflowsQuery.isLoading ? (
              <div className="space-y-2 py-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-hubspot-workflows">
                No workflows found in your HubSpot account. Make sure your Private App has Automation read access.
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 pb-1">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    data-testid="checkbox-select-all-workflows"
                  />
                  <span className="text-sm text-muted-foreground">
                    Select all ({filteredWorkflows.length})
                  </span>
                  {selectedIds.size > 0 && (
                    <Badge className="ml-auto" data-testid="badge-selected-workflow-count">
                      {selectedIds.size} selected
                    </Badge>
                  )}
                </div>
                <ScrollArea className="flex-1 min-h-0 max-h-[400px] border rounded-md">
                  <div className="divide-y">
                    {filteredWorkflows.map((wf) => (
                      <label
                        key={wf.id}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                        data-testid={`row-hubspot-workflow-${wf.id}`}
                      >
                        <Checkbox
                          checked={selectedIds.has(wf.id)}
                          onCheckedChange={() => handleToggle(wf.id)}
                          data-testid={`checkbox-workflow-${wf.id}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{wf.name}</span>
                            <Badge
                              variant="outline"
                              className={wf.enabled
                                ? "border-green-400 text-green-700 dark:text-green-400 text-[10px]"
                                : "text-[10px]"
                              }
                            >
                              {wf.enabled ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Type: {typeLabels[wf.type] || wf.type}
                            {wf.actions?.length > 0 && ` · ${wf.actions.length} action(s)`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} data-testid="button-cancel-workflow-import">
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedIds.size === 0 || importMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                data-testid="button-import-selected-workflows"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Import {selectedIds.size} workflows
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
