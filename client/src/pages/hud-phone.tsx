import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, MessageSquare, Plus, Settings, Trash2, Edit2,
  CheckCircle2, XCircle, Clock, Loader2, Send, PhoneMissed, Voicemail, Search, ArrowUpDown
} from "lucide-react";
import { format } from "date-fns";
import type { PhoneNumber, CallLog, SmsMessage } from "@shared/schema";

interface PhoneSettings {
  configured: boolean;
  accountSid: string;
  hasAuthToken: boolean;
}

export default function HudPhone() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();

  const { data: phoneSettings, isLoading: loadingSettings } = useQuery<PhoneSettings>({
    queryKey: ["/api/admin/phone-settings"],
  });

  const { data: phoneNumbers, isLoading: loadingNumbers } = useQuery<PhoneNumber[]>({
    queryKey: ["/api/admin/phone-numbers"],
  });

  const { data: callLogs, isLoading: loadingCalls } = useQuery<CallLog[]>({
    queryKey: ["/api/admin/call-logs"],
  });

  const { data: smsMessages, isLoading: loadingSms } = useQuery<SmsMessage[]>({
    queryKey: ["/api/admin/sms"],
  });

  const activeNumbers = phoneNumbers?.filter(n => n.isActive).length || 0;
  const totalCalls = callLogs?.length || 0;
  const inboundCalls = callLogs?.filter(c => c.direction === "INBOUND").length || 0;
  const outboundCalls = callLogs?.filter(c => c.direction === "OUTBOUND").length || 0;
  const totalSms = smsMessages?.length || 0;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-phone-title">Phone System</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Virtual PBX with Twilio integration
          </p>
        </div>
        <Badge variant={phoneSettings?.configured ? "default" : "secondary"} data-testid="badge-twilio-status">
          {phoneSettings?.configured ? "Twilio Connected" : "Not Configured"}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-phone">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="numbers" data-testid="tab-numbers">Phone Numbers</TabsTrigger>
          <TabsTrigger value="calls" data-testid="tab-calls">Call Log</TabsTrigger>
          <TabsTrigger value="sms" data-testid="tab-sms">Messages</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <DashboardTab
            activeNumbers={activeNumbers}
            totalCalls={totalCalls}
            inboundCalls={inboundCalls}
            outboundCalls={outboundCalls}
            totalSms={totalSms}
            recentCalls={callLogs?.slice(0, 5) || []}
            recentSms={smsMessages?.slice(0, 5) || []}
            isLoading={loadingNumbers || loadingCalls || loadingSms}
          />
        </TabsContent>

        <TabsContent value="numbers" className="mt-6">
          <NumbersTab
            phoneNumbers={phoneNumbers || []}
            isLoading={loadingNumbers}
            configured={!!phoneSettings?.configured}
          />
        </TabsContent>

        <TabsContent value="calls" className="mt-6">
          <CallsTab callLogs={callLogs || []} isLoading={loadingCalls} />
        </TabsContent>

        <TabsContent value="sms" className="mt-6">
          <SmsTab
            smsMessages={smsMessages || []}
            phoneNumbers={phoneNumbers || []}
            isLoading={loadingSms}
            configured={!!phoneSettings?.configured}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SettingsTab settings={phoneSettings} isLoading={loadingSettings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardTab({ activeNumbers, totalCalls, inboundCalls, outboundCalls, totalSms, recentCalls, recentSms, isLoading }: {
  activeNumbers: number; totalCalls: number; inboundCalls: number; outboundCalls: number; totalSms: number;
  recentCalls: CallLog[]; recentSms: SmsMessage[]; isLoading: boolean;
}) {
  const stats = [
    { label: "Active Numbers", value: activeNumbers, icon: Phone, color: "text-teal-600 dark:text-teal-400" },
    { label: "Total Calls", value: totalCalls, icon: PhoneCall, color: "text-blue-600 dark:text-blue-400" },
    { label: "Inbound", value: inboundCalls, icon: PhoneIncoming, color: "text-green-600 dark:text-green-400" },
    { label: "Outbound", value: outboundCalls, icon: PhoneOutgoing, color: "text-orange-600 dark:text-orange-400" },
    { label: "SMS Messages", value: totalSms, icon: MessageSquare, color: "text-purple-600 dark:text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
            ))
          : stats.map(s => (
              <Card key={s.label}>
                <CardContent className="p-4 text-center">
                  <div className="w-10 h-10 rounded-md bg-teal-600/[0.08] dark:bg-teal-600/[0.15] flex items-center justify-center mx-auto mb-2">
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div className={`text-xl font-bold ${s.color}`} data-testid={`text-stat-${s.label.toLowerCase().replace(/\s/g, "-")}`}>{s.value}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Recent Calls</CardTitle></CardHeader>
          <CardContent className="pt-0">
            {recentCalls.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No calls yet</p>
            ) : (
              <div className="space-y-2">
                {recentCalls.map(call => (
                  <div key={call.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/40" data-testid={`card-call-${call.id}`}>
                    {call.direction === "INBOUND" ? <PhoneIncoming className="h-4 w-4 text-green-500" /> : <PhoneOutgoing className="h-4 w-4 text-orange-500" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{call.direction === "INBOUND" ? call.fromNumber : call.toNumber}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(call.createdAt), "MMM d, h:mm a")}</p>
                    </div>
                    <CallStatusBadge status={call.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Recent Messages</CardTitle></CardHeader>
          <CardContent className="pt-0">
            {recentSms.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No messages yet</p>
            ) : (
              <div className="space-y-2">
                {recentSms.map(msg => (
                  <div key={msg.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/40" data-testid={`card-sms-${msg.id}`}>
                    {msg.direction === "INBOUND" ? <MessageSquare className="h-4 w-4 text-green-500" /> : <Send className="h-4 w-4 text-blue-500" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{msg.direction === "INBOUND" ? msg.fromNumber : msg.toNumber}</p>
                      <p className="text-xs text-muted-foreground truncate">{msg.body}</p>
                    </div>
                    <SmsStatusBadge status={msg.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NumbersTab({ phoneNumbers, isLoading, configured }: { phoneNumbers: PhoneNumber[]; isLoading: boolean; configured: boolean }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editNumber, setEditNumber] = useState<PhoneNumber | null>(null);
  const { toast } = useToast();

  const [newNumber, setNewNumber] = useState("");
  const [newFriendlyName, setNewFriendlyName] = useState("");
  const [newForwardTo, setNewForwardTo] = useState("");
  const [newVoicemailEnabled, setNewVoicemailEnabled] = useState(false);
  const [newVoicemailGreeting, setNewVoicemailGreeting] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/admin/phone-numbers", {
        method: "POST",
        body: JSON.stringify({
          number: newNumber,
          friendlyName: newFriendlyName || newNumber,
          forwardTo: newForwardTo || null,
          voicemailEnabled: newVoicemailEnabled,
          voicemailGreeting: newVoicemailGreeting || null,
          purchaseFromTwilio: false,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/phone-numbers"] });
      setShowAdd(false);
      setNewNumber("");
      setNewFriendlyName("");
      setNewForwardTo("");
      setNewVoicemailEnabled(false);
      setNewVoicemailGreeting("");
      toast({ title: "Phone number added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; body: any }) => {
      return apiRequest(`/api/admin/phone-numbers/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data.body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/phone-numbers"] });
      setEditNumber(null);
      toast({ title: "Phone number updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/phone-numbers/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/phone-numbers"] });
      toast({ title: "Phone number removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Phone Numbers</h2>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-number"><Plus className="h-4 w-4 mr-2" />Add Number</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Phone Number</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Phone Number</Label>
                <Input placeholder="+1234567890" value={newNumber} onChange={e => setNewNumber(e.target.value)} data-testid="input-new-number" />
              </div>
              <div>
                <Label>Friendly Name</Label>
                <Input placeholder="Main Line" value={newFriendlyName} onChange={e => setNewFriendlyName(e.target.value)} data-testid="input-friendly-name" />
              </div>
              <div>
                <Label>Forward Calls To</Label>
                <Input placeholder="+1987654321" value={newForwardTo} onChange={e => setNewForwardTo(e.target.value)} data-testid="input-forward-to" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={newVoicemailEnabled} onCheckedChange={setNewVoicemailEnabled} data-testid="switch-voicemail" />
                <Label>Enable Voicemail</Label>
              </div>
              {newVoicemailEnabled && (
                <div>
                  <Label>Voicemail Greeting</Label>
                  <Textarea placeholder="Please leave a message..." value={newVoicemailGreeting} onChange={e => setNewVoicemailGreeting(e.target.value)} data-testid="input-voicemail-greeting" />
                </div>
              )}
              <Button onClick={() => createMutation.mutate()} disabled={!newNumber || createMutation.isPending} className="w-full" data-testid="button-save-number">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Number
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {phoneNumbers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No phone numbers yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add a phone number to get started with your virtual PBX</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {phoneNumbers.map(pn => (
            <Card key={pn.id} data-testid={`card-number-${pn.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-md bg-teal-600/[0.08] dark:bg-teal-600/[0.15] flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" data-testid={`text-number-${pn.id}`}>{pn.number}</span>
                    {pn.friendlyName && pn.friendlyName !== pn.number && (
                      <span className="text-sm text-muted-foreground">({pn.friendlyName})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {pn.forwardTo && <span>Forward: {pn.forwardTo}</span>}
                    {pn.voicemailEnabled && <span className="flex items-center gap-1"><Voicemail className="h-3 w-3" />Voicemail</span>}
                    <span>{pn.capabilities}</span>
                  </div>
                </div>
                <Badge variant={pn.isActive ? "default" : "secondary"}>
                  {pn.isActive ? "Active" : "Inactive"}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => setEditNumber(pn)} data-testid={`button-edit-number-${pn.id}`}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { if (confirm("Remove this phone number?")) deleteMutation.mutate(pn.id); }} data-testid={`button-delete-number-${pn.id}`}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editNumber && (
        <EditNumberSheet
          phoneNumber={editNumber}
          onClose={() => setEditNumber(null)}
          onSave={(data) => updateMutation.mutate({ id: editNumber.id, body: data })}
          isPending={updateMutation.isPending}
        />
      )}
    </div>
  );
}

function EditNumberSheet({ phoneNumber, onClose, onSave, isPending }: {
  phoneNumber: PhoneNumber; onClose: () => void; onSave: (data: any) => void; isPending: boolean;
}) {
  const [friendlyName, setFriendlyName] = useState(phoneNumber.friendlyName || "");
  const [forwardTo, setForwardTo] = useState(phoneNumber.forwardTo || "");
  const [voicemailEnabled, setVoicemailEnabled] = useState(phoneNumber.voicemailEnabled);
  const [voicemailGreeting, setVoicemailGreeting] = useState(phoneNumber.voicemailGreeting || "");
  const [isActive, setIsActive] = useState(phoneNumber.isActive);

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit {phoneNumber.number}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div>
            <Label>Friendly Name</Label>
            <Input value={friendlyName} onChange={e => setFriendlyName(e.target.value)} data-testid="input-edit-friendly-name" />
          </div>
          <div>
            <Label>Forward Calls To</Label>
            <Input placeholder="+1987654321" value={forwardTo} onChange={e => setForwardTo(e.target.value)} data-testid="input-edit-forward-to" />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-edit-active" />
            <Label>Active</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={voicemailEnabled} onCheckedChange={setVoicemailEnabled} data-testid="switch-edit-voicemail" />
            <Label>Enable Voicemail</Label>
          </div>
          {voicemailEnabled && (
            <div>
              <Label>Voicemail Greeting</Label>
              <Textarea value={voicemailGreeting} onChange={e => setVoicemailGreeting(e.target.value)} data-testid="input-edit-voicemail-greeting" />
            </div>
          )}
          <Button
            className="w-full"
            onClick={() => onSave({ friendlyName, forwardTo: forwardTo || null, voicemailEnabled, voicemailGreeting: voicemailGreeting || null, isActive })}
            disabled={isPending}
            data-testid="button-save-edit-number"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CallsTab({ callLogs, isLoading }: { callLogs: CallLog[]; isLoading: boolean }) {
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState<string>("all");

  const filtered = callLogs.filter(c => {
    if (directionFilter !== "all" && c.direction !== directionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.fromNumber.toLowerCase().includes(q) || c.toNumber.toLowerCase().includes(q) || (c.notes || "").toLowerCase().includes(q);
    }
    return true;
  });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search calls..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" data-testid="input-search-calls" />
        </div>
        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-call-direction">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Calls</SelectItem>
            <SelectItem value="INBOUND">Inbound</SelectItem>
            <SelectItem value="OUTBOUND">Outbound</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PhoneCall className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No call logs</p>
            <p className="text-xs text-muted-foreground mt-1">Call history will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(call => (
            <Card key={call.id} data-testid={`card-calllog-${call.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: call.direction === "INBOUND" ? "rgba(34,197,94,0.1)" : "rgba(249,115,22,0.1)" }}>
                  {call.direction === "INBOUND"
                    ? <PhoneIncoming className="h-5 w-5 text-green-500" />
                    : <PhoneOutgoing className="h-5 w-5 text-orange-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{call.direction === "INBOUND" ? call.fromNumber : call.toNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      {call.direction === "INBOUND" ? `→ ${call.toNumber}` : `← ${call.fromNumber}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{format(new Date(call.createdAt), "MMM d, yyyy h:mm a")}</span>
                    {(call.duration ?? 0) > 0 && <span>{Math.floor((call.duration ?? 0) / 60)}:{String((call.duration ?? 0) % 60).padStart(2, "0")}</span>}
                    {call.recordingUrl && <span className="text-blue-500">Recording available</span>}
                    {call.voicemailUrl && <span className="text-purple-500 flex items-center gap-1"><Voicemail className="h-3 w-3" />Voicemail</span>}
                  </div>
                </div>
                <CallStatusBadge status={call.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SmsTab({ smsMessages, phoneNumbers, isLoading, configured }: {
  smsMessages: SmsMessage[]; phoneNumbers: PhoneNumber[]; isLoading: boolean; configured: boolean;
}) {
  const [showCompose, setShowCompose] = useState(false);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const [composeFrom, setComposeFrom] = useState("");
  const [composeTo, setComposeTo] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const sendMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/admin/sms", {
        method: "POST",
        body: JSON.stringify({ from: composeFrom, to: composeTo, body: composeBody }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms"] });
      setShowCompose(false);
      setComposeFrom("");
      setComposeTo("");
      setComposeBody("");
      toast({ title: "Message sent" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = smsMessages.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.fromNumber.toLowerCase().includes(q) || m.toNumber.toLowerCase().includes(q) || m.body.toLowerCase().includes(q);
  });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search messages..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" data-testid="input-search-sms" />
        </div>
        <Dialog open={showCompose} onOpenChange={setShowCompose}>
          <DialogTrigger asChild>
            <Button disabled={!configured} data-testid="button-compose-sms">
              <Send className="h-4 w-4 mr-2" />
              Compose
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Send SMS</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>From</Label>
                <Select value={composeFrom} onValueChange={setComposeFrom}>
                  <SelectTrigger data-testid="select-sms-from">
                    <SelectValue placeholder="Select a number" />
                  </SelectTrigger>
                  <SelectContent>
                    {phoneNumbers.filter(n => n.isActive && n.capabilities.includes("sms")).map(n => (
                      <SelectItem key={n.id} value={n.number}>{n.friendlyName || n.number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>To</Label>
                <Input placeholder="+1234567890" value={composeTo} onChange={e => setComposeTo(e.target.value)} data-testid="input-sms-to" />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea placeholder="Type your message..." value={composeBody} onChange={e => setComposeBody(e.target.value)} rows={4} data-testid="input-sms-body" />
              </div>
              <Button
                onClick={() => sendMutation.mutate()}
                disabled={!composeFrom || !composeTo || !composeBody || sendMutation.isPending}
                className="w-full"
                data-testid="button-send-sms"
              >
                {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send Message
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No messages</p>
            <p className="text-xs text-muted-foreground mt-1">SMS messages will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(msg => (
            <Card key={msg.id} data-testid={`card-sms-detail-${msg.id}`}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: msg.direction === "INBOUND" ? "rgba(34,197,94,0.1)" : "rgba(59,130,246,0.1)" }}>
                  {msg.direction === "INBOUND"
                    ? <MessageSquare className="h-5 w-5 text-green-500" />
                    : <Send className="h-5 w-5 text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{msg.direction === "INBOUND" ? msg.fromNumber : msg.toNumber}</span>
                    <Badge variant="outline" className="text-[10px]">{msg.direction}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{msg.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(msg.createdAt), "MMM d, yyyy h:mm a")}</p>
                </div>
                <SmsStatusBadge status={msg.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab({ settings, isLoading }: { settings?: PhoneSettings; isLoading: boolean }) {
  const [accountSid, setAccountSid] = useState(settings?.accountSid || "");
  const [authToken, setAuthToken] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; accountName?: string; error?: string } | null>(null);
  const { toast } = useToast();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: any = { accountSid };
      if (authToken) body.authToken = authToken;
      return apiRequest("/api/admin/phone-settings", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/phone-settings"] });
      setAuthToken("");
      toast({ title: "Settings saved" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiRequest("/api/admin/phone-settings/test", { method: "POST" });
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({ success: false, error: e.message });
    }
    setTesting(false);
  };

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Twilio Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your Twilio account to enable phone calls and SMS messaging. You'll need your Account SID and Auth Token from the Twilio Console.
          </p>
          <div>
            <Label>Account SID</Label>
            <Input placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={accountSid} onChange={e => setAccountSid(e.target.value)} data-testid="input-twilio-sid" />
          </div>
          <div>
            <Label>Auth Token {settings?.hasAuthToken && <span className="text-xs text-muted-foreground">(saved — enter new value to update)</span>}</Label>
            <Input type="password" placeholder="Your Auth Token" value={authToken} onChange={e => setAuthToken(e.target.value)} data-testid="input-twilio-token" />
          </div>
          <div className="flex gap-3">
            <Button onClick={() => saveMutation.mutate()} disabled={!accountSid || saveMutation.isPending} data-testid="button-save-twilio">
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Credentials
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing || !settings?.configured} data-testid="button-test-twilio">
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Test Connection
            </Button>
          </div>
          {testResult && (
            <div className={`p-3 rounded-md text-sm ${testResult.success ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400" : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"}`} data-testid="text-test-result">
              {testResult.success ? (
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Connected to: {testResult.accountName}</span>
              ) : (
                <span className="flex items-center gap-2"><XCircle className="h-4 w-4" />{testResult.error}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. Sign up for a <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener" className="text-primary underline">Twilio account</a></p>
          <p>2. Enter your Account SID and Auth Token above</p>
          <p>3. Add phone numbers (manual entry or purchase from Twilio)</p>
          <p>4. Configure call forwarding, voicemail, and SMS</p>
          <p>5. Set up webhook URLs in Twilio for incoming calls/SMS</p>
          <div className="mt-3 p-3 bg-muted rounded-md">
            <p className="font-medium text-foreground mb-1">Webhook URLs</p>
            <p>Voice: <code className="text-xs bg-background px-1 py-0.5 rounded">{window.location.origin}/api/webhooks/twilio/voice</code></p>
            <p>SMS: <code className="text-xs bg-background px-1 py-0.5 rounded">{window.location.origin}/api/webhooks/twilio/sms</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CallStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    QUEUED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    RINGING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    BUSY: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    NO_ANSWER: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    CANCELED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[status] || styles.QUEUED}`}>{status.replace("_", " ")}</span>;
}

function SmsStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    QUEUED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    DELIVERED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    RECEIVED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[status] || styles.QUEUED}`}>{status}</span>;
}
