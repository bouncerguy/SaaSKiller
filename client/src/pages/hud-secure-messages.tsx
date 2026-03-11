import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SecureMessage, SecureMessageActivity, Customer } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck, Plus, Loader2, Trash2, Search, Send, Eye, ArrowLeft,
  Clock, CheckCircle2, Mail, Copy, XCircle, AlertCircle
} from "lucide-react";
import { format } from "date-fns";

interface MsgWithActivity extends SecureMessage {
  activity: SecureMessageActivity[];
  tenantSlug?: string;
}

function statusBadge(status: string) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="outline" className="border-gray-400 text-gray-600 dark:text-gray-400">Draft</Badge>;
    case "SENT":
      return <Badge variant="outline" className="border-blue-400 text-blue-600 dark:text-blue-400">Sent</Badge>;
    case "READ":
      return <Badge variant="outline" className="border-green-400 text-green-600 dark:text-green-400">Read</Badge>;
    case "EXPIRED":
      return <Badge variant="outline" className="border-amber-400 text-amber-600 dark:text-amber-400">Expired</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function HudSecureMessages() {
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-secure-messages-title">Secure Messaging</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Send confidential messages that recipients access via email verification
          </p>
        </div>
      </div>

      {selectedMsgId ? (
        <MessageDetail msgId={selectedMsgId} onBack={() => setSelectedMsgId(null)} />
      ) : (
        <MessagesList onSelect={setSelectedMsgId} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      )}
    </div>
  );
}

function MessagesList({ onSelect, searchQuery, setSearchQuery }: {
  onSelect: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  const { toast } = useToast();
  const [composeOpen, setComposeOpen] = useState(false);
  const [formRecipientName, setFormRecipientName] = useState("");
  const [formRecipientEmail, setFormRecipientEmail] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");

  const { data: messages, isLoading } = useQuery<SecureMessage[]>({
    queryKey: ["/api/admin/secure-messages"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/secure-messages", {
        recipientName: formRecipientName,
        recipientEmail: formRecipientEmail,
        subject: formSubject,
        body: formBody,
        customerId: formCustomerId && formCustomerId !== "none" ? formCustomerId : null,
        expiresAt: formExpiresAt || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/secure-messages"] });
      setComposeOpen(false);
      setFormRecipientName("");
      setFormRecipientEmail("");
      setFormSubject("");
      setFormBody("");
      setFormCustomerId("");
      setFormExpiresAt("");
      toast({ title: "Secure message created" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/secure-messages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/secure-messages"] });
      toast({ title: "Message deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const filtered = (messages || []).filter(msg => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return msg.subject.toLowerCase().includes(q) ||
      msg.recipientName.toLowerCase().includes(q) ||
      msg.recipientEmail.toLowerCase().includes(q);
  });

  const sentCount = (messages || []).filter(m => m.status === "SENT").length;
  const readCount = (messages || []).filter(m => m.status === "READ").length;
  const draftCount = (messages || []).filter(m => m.status === "DRAFT").length;

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-600/[0.08] dark:bg-slate-600/[0.15] flex items-center justify-center">
              <Mail className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-messages">{(messages || []).length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-blue-600/[0.08] dark:bg-blue-600/[0.15] flex items-center justify-center">
              <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-sent-count">{sentCount}</p>
              <p className="text-xs text-muted-foreground">Sent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-green-600/[0.08] dark:bg-green-600/[0.15] flex items-center justify-center">
              <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-read-count">{readCount}</p>
              <p className="text-xs text-muted-foreground">Read</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-gray-600/[0.08] dark:bg-gray-600/[0.15] flex items-center justify-center">
              <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-draft-count">{draftCount}</p>
              <p className="text-xs text-muted-foreground">Drafts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-messages"
          />
        </div>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-compose-message">
              <Plus className="h-4 w-4 mr-2" />
              Compose Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Compose Secure Message</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Recipient Name</Label>
                  <Input
                    placeholder="John Doe"
                    value={formRecipientName}
                    onChange={e => setFormRecipientName(e.target.value)}
                    data-testid="input-recipient-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Recipient Email</Label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={formRecipientEmail}
                    onChange={e => setFormRecipientEmail(e.target.value)}
                    data-testid="input-recipient-email"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input
                  placeholder="Confidential: Account Update"
                  value={formSubject}
                  onChange={e => setFormSubject(e.target.value)}
                  data-testid="input-message-subject"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Message Body</Label>
                <Textarea
                  placeholder="Enter the secure message content..."
                  value={formBody}
                  onChange={e => setFormBody(e.target.value)}
                  className="resize-y min-h-[120px]"
                  data-testid="input-message-body"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Link to Customer (optional)</Label>
                  <Select value={formCustomerId} onValueChange={setFormCustomerId}>
                    <SelectTrigger data-testid="select-message-customer">
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
                    data-testid="input-message-expires"
                  />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => createMutation.mutate()}
                disabled={!formRecipientName.trim() || !formRecipientEmail.trim() || !formSubject.trim() || !formBody.trim() || createMutation.isPending}
                data-testid="button-save-message"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Message
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium" data-testid="text-no-messages">No secure messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">Compose a message to send confidential information securely</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(msg => (
            <Card key={msg.id} className="hover-elevate cursor-pointer" data-testid={`card-message-${msg.id}`}>
              <CardContent className="p-4 flex items-center gap-4" onClick={() => onSelect(msg.id)}>
                <div className="w-10 h-10 rounded-md bg-slate-600/[0.08] dark:bg-slate-600/[0.15] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" data-testid={`text-msg-subject-${msg.id}`}>{msg.subject}</span>
                    {statusBadge(msg.status)}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {msg.recipientName} ({msg.recipientEmail})
                    </span>
                    <span>{format(new Date(msg.createdAt), "MMM d, yyyy")}</span>
                    {msg.readAt && (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <Eye className="h-3 w-3" />
                        Read {format(new Date(msg.readAt), "MMM d")}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this message?")) deleteMutation.mutate(msg.id);
                  }}
                  data-testid={`button-delete-msg-${msg.id}`}
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

function MessageDetail({ msgId, onBack }: { msgId: string; onBack: () => void }) {
  const { toast } = useToast();

  const { data: msg, isLoading } = useQuery<MsgWithActivity>({
    queryKey: ["/api/admin/secure-messages", msgId],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/secure-messages/${msgId}/send`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/secure-messages", msgId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/secure-messages"] });
      toast({ title: "Message sent" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  if (isLoading || !msg) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const secureLink = `${window.location.origin}/secure/${msg.tenantSlug || msg.tenantId}/${msg.accessToken}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-messages">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold" data-testid="text-detail-subject">{msg.subject}</h2>
            {statusBadge(msg.status)}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            To: {msg.recipientName} ({msg.recipientEmail})
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {msg.status === "DRAFT" && (
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending}
              data-testid="button-send-message"
            >
              {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send Message
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="content">
        <TabsList data-testid="tabs-message-detail">
          <TabsTrigger value="content" data-testid="tab-content">Content</TabsTrigger>
          <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">Activity ({msg.activity?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Message Body</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {msg.body.split("\n").map((line, i) => <p key={i} className="mb-1">{line}</p>)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Recipient</span>
                  <p className="font-medium">{msg.recipientName}</p>
                  <p className="text-xs text-muted-foreground">{msg.recipientEmail}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <div className="mt-1">{statusBadge(msg.status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Created</span>
                  <p className="font-medium">{format(new Date(msg.createdAt), "MMM d, yyyy h:mm a")}</p>
                </div>
                {msg.sentAt && (
                  <div>
                    <span className="text-muted-foreground">Sent</span>
                    <p className="font-medium">{format(new Date(msg.sentAt), "MMM d, yyyy h:mm a")}</p>
                  </div>
                )}
                {msg.readAt && (
                  <div>
                    <span className="text-muted-foreground">Read</span>
                    <p className="font-medium">{format(new Date(msg.readAt), "MMM d, yyyy h:mm a")}</p>
                  </div>
                )}
                {msg.expiresAt && (
                  <div>
                    <span className="text-muted-foreground">Expires</span>
                    <p className="font-medium">{format(new Date(msg.expiresAt), "MMM d, yyyy")}</p>
                  </div>
                )}
                {msg.customerId && (
                  <div>
                    <span className="text-muted-foreground">Customer</span>
                    <p className="font-medium">{customers?.find(c => c.id === msg.customerId)?.name || msg.customerId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {msg.status !== "DRAFT" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Secure Link</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-2">
                  Share this link with the recipient. They'll need to verify their email before viewing the message.
                </p>
                <div className="flex items-center gap-2">
                  <Input value={secureLink} readOnly className="text-xs font-mono" data-testid="input-secure-link" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(secureLink);
                      toast({ title: "Link copied to clipboard" });
                    }}
                    data-testid="button-copy-link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {(!msg.activity || msg.activity.length === 0) ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground" data-testid="text-no-activity">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {msg.activity.map(a => (
                    <div key={a.id} className="flex items-start gap-3 py-2 border-b last:border-0" data-testid={`activity-${a.id}`}>
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        {a.action === "SENT" && <Send className="h-3.5 w-3.5 text-blue-500" />}
                        {a.action === "VERIFIED" && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                        {a.action === "VERIFY_FAILED" && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                        {!["SENT", "VERIFIED", "VERIFY_FAILED"].includes(a.action) && <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{a.action}</p>
                        {a.details && <p className="text-xs text-muted-foreground mt-0.5">{a.details}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(a.createdAt), "MMM d, yyyy h:mm a")}
                          {a.ipAddress && <span className="ml-2">IP: {a.ipAddress}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
