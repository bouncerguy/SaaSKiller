import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Document as DocType, DocumentSigner, DocumentActivity, Customer } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  FileSignature, Plus, Loader2, Trash2, Search, Send, Eye, Edit2, X,
  Users, CheckCircle2, Clock, XCircle, AlertCircle, FileText, ArrowLeft, LayoutTemplate
} from "lucide-react";
import { format } from "date-fns";

interface DocWithSigners extends DocType {
  signers: DocumentSigner[];
}

interface DocDetail extends DocType {
  signers: DocumentSigner[];
  activity: DocumentActivity[];
}

function statusBadge(status: string) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="outline" className="border-gray-400 text-gray-600 dark:text-gray-400">Draft</Badge>;
    case "SENT":
      return <Badge variant="outline" className="border-blue-400 text-blue-600 dark:text-blue-400">Sent</Badge>;
    case "COMPLETED":
      return <Badge variant="outline" className="border-green-400 text-green-600 dark:text-green-400">Completed</Badge>;
    case "CANCELLED":
      return <Badge variant="outline" className="border-red-400 text-red-600 dark:text-red-400">Cancelled</Badge>;
    case "EXPIRED":
      return <Badge variant="outline" className="border-amber-400 text-amber-600 dark:text-amber-400">Expired</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function signerStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return <Badge variant="secondary" className="text-xs">Pending</Badge>;
    case "VIEWED":
      return <Badge variant="outline" className="border-blue-400 text-blue-600 dark:text-blue-400 text-xs">Viewed</Badge>;
    case "SIGNED":
      return <Badge variant="outline" className="border-green-400 text-green-600 dark:text-green-400 text-xs">Signed</Badge>;
    case "DECLINED":
      return <Badge variant="outline" className="border-red-400 text-red-600 dark:text-red-400 text-xs">Declined</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>;
  }
}

function signerRoleBadge(role: string) {
  switch (role) {
    case "SIGNER":
      return <Badge variant="secondary" className="text-xs">Signer</Badge>;
    case "VIEWER":
      return <Badge variant="secondary" className="text-xs">Viewer</Badge>;
    case "APPROVER":
      return <Badge variant="secondary" className="text-xs">Approver</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">{role}</Badge>;
  }
}

function signingProgress(signers: DocumentSigner[]) {
  const signerOnly = signers.filter(s => s.role === "SIGNER" || s.role === "APPROVER");
  if (signerOnly.length === 0) return null;
  const signed = signerOnly.filter(s => s.status === "SIGNED").length;
  return (
    <span className="text-xs text-muted-foreground" data-testid="text-signing-progress">
      {signed} of {signerOnly.length} signed
    </span>
  );
}

export default function HudDocuments() {
  const [activeTab, setActiveTab] = useState("documents");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-documents-title">Documents & Signing</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create documents, manage signers, and track signatures
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-documents">
          <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          {selectedDocId ? (
            <DocumentDetail docId={selectedDocId} onBack={() => setSelectedDocId(null)} />
          ) : (
            <DocumentsList onSelect={setSelectedDocId} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardContent className="py-12 text-center">
              <LayoutTemplate className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium" data-testid="text-templates-placeholder">Templates Coming Soon</p>
              <p className="text-xs text-muted-foreground mt-1">
                Save and reuse document templates for common contracts and agreements
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DocumentsList({ onSelect, searchQuery, setSearchQuery }: {
  onSelect: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");

  const { data: docs, isLoading } = useQuery<DocWithSigners[]>({
    queryKey: ["/api/admin/documents"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/documents", {
        title: formTitle,
        description: formDescription || null,
        content: formContent || null,
        customerId: formCustomerId || null,
        expiresAt: formExpiresAt || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      setCreateOpen(false);
      setFormTitle("");
      setFormDescription("");
      setFormContent("");
      setFormCustomerId("");
      setFormExpiresAt("");
      toast({ title: "Document created" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      toast({ title: "Document deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const filtered = (docs || []).filter(doc => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return doc.title.toLowerCase().includes(q) || (doc.description || "").toLowerCase().includes(q);
  });

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-documents"
          />
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-document">
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Document</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  placeholder="Service Agreement"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  data-testid="input-doc-title"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="Brief description of the document..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="resize-y min-h-[80px]"
                  data-testid="input-doc-description"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Content</Label>
                <Textarea
                  placeholder="Enter document content here..."
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  className="resize-y min-h-[120px]"
                  data-testid="input-doc-content"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Link to Customer (optional)</Label>
                <Select value={formCustomerId} onValueChange={setFormCustomerId}>
                  <SelectTrigger data-testid="select-doc-customer">
                    <SelectValue placeholder="Select customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No customer</SelectItem>
                    {(customers || []).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Expires At (optional)</Label>
                <Input
                  type="date"
                  value={formExpiresAt}
                  onChange={e => setFormExpiresAt(e.target.value)}
                  data-testid="input-doc-expires"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createMutation.mutate()}
                disabled={!formTitle.trim() || createMutation.isPending}
                data-testid="button-save-document"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Document
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileSignature className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium" data-testid="text-no-documents">No documents yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first document to get started with signing</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => (
            <Card key={doc.id} className="hover-elevate cursor-pointer" data-testid={`card-document-${doc.id}`}>
              <CardContent className="p-4 flex items-center gap-4" onClick={() => onSelect(doc.id)}>
                <div className="w-10 h-10 rounded-md bg-indigo-600/[0.08] dark:bg-indigo-600/[0.15] flex items-center justify-center flex-shrink-0">
                  <FileSignature className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" data-testid={`text-doc-title-${doc.id}`}>{doc.title}</span>
                    {statusBadge(doc.status)}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    {doc.description && <span className="truncate max-w-[200px]">{doc.description}</span>}
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {doc.signers.length} signer{doc.signers.length !== 1 ? "s" : ""}
                    </span>
                    {signingProgress(doc.signers)}
                    <span>{format(new Date(doc.createdAt), "MMM d, yyyy")}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this document?")) deleteMutation.mutate(doc.id);
                  }}
                  data-testid={`button-delete-doc-${doc.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentDetail({ docId, onBack }: { docId: string; onBack: () => void }) {
  const { toast } = useToast();
  const [detailTab, setDetailTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [addSignerOpen, setAddSignerOpen] = useState(false);

  const { data: doc, isLoading } = useQuery<DocDetail>({
    queryKey: ["/api/admin/documents", docId],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/documents/${docId}/send`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents", docId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      toast({ title: "Document sent for signing" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  if (isLoading || !doc) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const signedCount = doc.signers.filter(s => s.status === "SIGNED").length;
  const totalSigners = doc.signers.filter(s => s.role === "SIGNER" || s.role === "APPROVER").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-documents">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold" data-testid="text-detail-title">{doc.title}</h2>
            {statusBadge(doc.status)}
          </div>
          {doc.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{doc.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setEditOpen(true)} data-testid="button-edit-document">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {doc.status === "DRAFT" && (
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending || doc.signers.length === 0}
              data-testid="button-send-document"
            >
              {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send for Signing
            </Button>
          )}
        </div>
      </div>

      {totalSigners > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-medium">Signing Progress</span>
              <div className="flex-1 min-w-[120px]">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-300"
                    style={{ width: `${totalSigners > 0 ? (signedCount / totalSigners) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <span className="text-sm text-muted-foreground" data-testid="text-progress-count">
                {signedCount} of {totalSigners} signed
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={detailTab} onValueChange={setDetailTab}>
        <TabsList data-testid="tabs-detail">
          <TabsTrigger value="overview" data-testid="tab-overview">Content</TabsTrigger>
          <TabsTrigger value="signers" data-testid="tab-signers">Signers ({doc.signers.length})</TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-sm font-medium">Document Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {doc.content ? (
                  doc.content.split("\n").map((line, i) => <p key={i} className="mb-1">{line}</p>)
                ) : (
                  <p className="text-muted-foreground italic" data-testid="text-no-content">No content yet. Edit the document to add content.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Slug</span>
                  <p className="font-medium" data-testid="text-doc-slug">{doc.slug}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created</span>
                  <p className="font-medium">{format(new Date(doc.createdAt), "MMM d, yyyy h:mm a")}</p>
                </div>
                {doc.expiresAt && (
                  <div>
                    <span className="text-muted-foreground">Expires</span>
                    <p className="font-medium">{format(new Date(doc.expiresAt), "MMM d, yyyy")}</p>
                  </div>
                )}
                {doc.customerId && (
                  <div>
                    <span className="text-muted-foreground">Customer</span>
                    <p className="font-medium">{customers?.find(c => c.id === doc.customerId)?.name || doc.customerId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signers" className="mt-4">
          <SignersSection doc={doc} onAddSigner={() => setAddSignerOpen(true)} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ActivitySection activity={doc.activity} />
        </TabsContent>
      </Tabs>

      {editOpen && (
        <EditDocumentSheet doc={doc} customers={customers || []} onClose={() => setEditOpen(false)} />
      )}

      {addSignerOpen && (
        <AddSignerDialog docId={docId} tenantId={doc.tenantId} open={addSignerOpen} onClose={() => setAddSignerOpen(false)} />
      )}
    </div>
  );
}

function SignersSection({ doc, onAddSigner }: { doc: DocDetail; onAddSigner: () => void }) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (signerId: string) => {
      await apiRequest("DELETE", `/api/admin/documents/${doc.id}/signers/${signerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents", doc.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      toast({ title: "Signer removed" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium">Signers</h3>
        <Button variant="outline" onClick={onAddSigner} data-testid="button-add-signer">
          <Plus className="h-4 w-4 mr-2" />
          Add Signer
        </Button>
      </div>

      {doc.signers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium" data-testid="text-no-signers">No signers added</p>
            <p className="text-xs text-muted-foreground mt-1">Add signers before sending the document</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {doc.signers
            .sort((a, b) => a.order - b.order)
            .map(signer => (
              <Card key={signer.id} data-testid={`card-signer-${signer.id}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/[0.08] dark:bg-indigo-600/[0.15] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {signer.order}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm" data-testid={`text-signer-name-${signer.id}`}>{signer.name}</span>
                      {signerRoleBadge(signer.role)}
                      {signerStatusBadge(signer.status)}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      <span data-testid={`text-signer-email-${signer.id}`}>{signer.email}</span>
                      {signer.signedAt && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          Signed {format(new Date(signer.signedAt), "MMM d, yyyy h:mm a")}
                        </span>
                      )}
                    </div>
                  </div>
                  {doc.status === "DRAFT" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Remove this signer?")) deleteMutation.mutate(signer.id);
                      }}
                      data-testid={`button-remove-signer-${signer.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}

function AddSignerDialog({ docId, tenantId, open, onClose }: {
  docId: string; tenantId: string; open: boolean; onClose: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("SIGNER");
  const [order, setOrder] = useState("1");

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/documents/${docId}/signers`, {
        tenantId,
        documentId: docId,
        name,
        email,
        role,
        order: parseInt(order) || 1,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents", docId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      onClose();
      setName("");
      setEmail("");
      setRole("SIGNER");
      setOrder("1");
      toast({ title: "Signer added" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Signer</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              placeholder="John Smith"
              value={name}
              onChange={e => setName(e.target.value)}
              data-testid="input-signer-name"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              data-testid="input-signer-email"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger data-testid="select-signer-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SIGNER">Signer</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
                <SelectItem value="APPROVER">Approver</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Signing Order</Label>
            <Input
              type="number"
              min="1"
              value={order}
              onChange={e => setOrder(e.target.value)}
              data-testid="input-signer-order"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => addMutation.mutate()}
            disabled={!name.trim() || !email.trim() || addMutation.isPending}
            data-testid="button-save-signer"
          >
            {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Add Signer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditDocumentSheet({ doc, customers, onClose }: {
  doc: DocDetail; customers: Customer[]; onClose: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(doc.title);
  const [description, setDescription] = useState(doc.description || "");
  const [content, setContent] = useState(doc.content || "");
  const [customerId, setCustomerId] = useState(doc.customerId || "");
  const [expiresAt, setExpiresAt] = useState(doc.expiresAt ? format(new Date(doc.expiresAt), "yyyy-MM-dd") : "");
  const [status, setStatus] = useState<string>(doc.status);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/admin/documents/${doc.id}`, {
        title,
        description: description || null,
        content: content || null,
        customerId: customerId && customerId !== "none" ? customerId : null,
        expiresAt: expiresAt || null,
        status,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents", doc.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      onClose();
      toast({ title: "Document updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Document</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} data-testid="input-edit-doc-title" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="resize-y min-h-[80px]"
              data-testid="input-edit-doc-description"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="resize-y min-h-[160px]"
              data-testid="input-edit-doc-content"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-testid="select-edit-doc-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Customer (optional)</Label>
            <Select value={customerId || "none"} onValueChange={setCustomerId}>
              <SelectTrigger data-testid="select-edit-doc-customer">
                <SelectValue placeholder="Select customer..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No customer</SelectItem>
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Expires At (optional)</Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              data-testid="input-edit-doc-expires"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => updateMutation.mutate()}
            disabled={!title.trim() || updateMutation.isPending}
            data-testid="button-save-edit-document"
          >
            {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ActivitySection({ activity }: { activity: DocumentActivity[] }) {
  if (activity.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium" data-testid="text-no-activity">No activity yet</p>
        </CardContent>
      </Card>
    );
  }

  function activityIcon(action: string) {
    switch (action) {
      case "created": return <FileText className="h-4 w-4 text-indigo-500" />;
      case "sent": return <Send className="h-4 w-4 text-blue-500" />;
      case "viewed": return <Eye className="h-4 w-4 text-amber-500" />;
      case "signed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "declined": return <XCircle className="h-4 w-4 text-red-500" />;
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "cancelled": return <XCircle className="h-4 w-4 text-red-600" />;
      case "expired": return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {activity.map((entry, i) => (
            <div key={entry.id} className="flex items-start gap-3" data-testid={`card-activity-${entry.id}`}>
              <div className="mt-0.5 flex-shrink-0">
                {activityIcon(entry.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{entry.details || entry.action}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(entry.createdAt), "MMM d, yyyy h:mm a")}
                  {entry.ipAddress && <span className="ml-2">IP: {entry.ipAddress}</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
