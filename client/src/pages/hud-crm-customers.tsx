import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Customer, Note } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Search, Mail, Phone, Building2, MapPin, Loader2, Trash2, StickyNote } from "lucide-react";

function statusBadge(status: string) {
  switch (status) {
    case "CURRENT":
      return <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" data-testid="badge-status-current">Current</Badge>;
    case "PAST_DUE_30":
      return <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30" data-testid="badge-status-past-due-30">30 Days</Badge>;
    case "PAST_DUE_60":
      return <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30" data-testid="badge-status-past-due-60">60 Days</Badge>;
    case "COLLECTIONS":
      return <Badge variant="outline" className="border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30" data-testid="badge-status-collections">Collections</Badge>;
    default:
      return <Badge variant="outline" data-testid="badge-status-unknown">{status}</Badge>;
  }
}

function statusDot(status: string) {
  const colors: Record<string, string> = {
    CURRENT: "bg-emerald-500",
    PAST_DUE_30: "bg-amber-500",
    PAST_DUE_60: "bg-orange-500",
    COLLECTIONS: "bg-red-500",
  };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status] || "bg-gray-400"}`} />;
}

export default function HudCrmCustomers() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    businessName: "",
    phone: "",
    address: "",
    billingType: "",
    paymentStatus: "CURRENT" as string,
  });

  const [editData, setEditData] = useState<Partial<Customer>>({});

  const customersQuery = useQuery<Customer[]>({
    queryKey: searchQuery
      ? [`/api/admin/customers?search=${encodeURIComponent(searchQuery)}`]
      : ["/api/admin/customers"],
  });

  const customerDetailQuery = useQuery<{ customer: Customer; notes: Note[]; activity: any[] }>({
    queryKey: ["/api/admin/customers", selectedCustomerId],
    enabled: !!selectedCustomerId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/admin/customers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      setCreateOpen(false);
      setFormData({ name: "", email: "", businessName: "", phone: "", address: "", billingType: "", paymentStatus: "CURRENT" });
      toast({ title: "Customer created" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/customers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      toast({ title: "Customer updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ entityId, content }: { entityId: string; content: string }) => {
      const res = await apiRequest("POST", "/api/admin/notes", {
        entityType: "customer",
        entityId,
        content,
      });
      return res.json();
    },
    onSuccess: () => {
      if (selectedCustomerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", selectedCustomerId] });
      }
      setNewNote("");
      toast({ title: "Note added" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await apiRequest("DELETE", `/api/admin/notes/${noteId}`);
    },
    onSuccess: () => {
      if (selectedCustomerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", selectedCustomerId] });
      }
      toast({ title: "Note deleted" });
    },
  });

  const customers = customersQuery.data || [];
  const detail = customerDetailQuery.data;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Customers
          </h1>
          <p className="text-muted-foreground text-sm mt-1" data-testid="text-page-subtitle">
            Manage your customer relationships
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-customer" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-testid="dialog-create-customer">
            <DialogHeader>
              <DialogTitle>New Customer</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" data-testid="input-customer-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" data-testid="input-customer-email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" data-testid="input-customer-business" value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" data-testid="input-customer-phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" data-testid="input-customer-address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select value={formData.paymentStatus} onValueChange={(v) => setFormData({ ...formData, paymentStatus: v })}>
                  <SelectTrigger data-testid="select-payment-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CURRENT">Current</SelectItem>
                    <SelectItem value="PAST_DUE_30">Past Due (30 days)</SelectItem>
                    <SelectItem value="PAST_DUE_60">Past Due (60 days)</SelectItem>
                    <SelectItem value="COLLECTIONS">Collections</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={createMutation.isPending} data-testid="button-submit-customer">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Customer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers by name, email, phone, or business..."
          className="pl-10"
          data-testid="input-search-customers"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {customersQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground" data-testid="text-empty-customers">
              {searchQuery ? "No customers match your search" : "No customers yet. Add your first customer to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {customers.map((customer) => (
            <Card
              key={customer.id}
              className="cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
              data-testid={`card-customer-${customer.id}`}
              onClick={() => {
                setSelectedCustomerId(customer.id);
                setEditData(customer);
              }}
            >
              <CardContent className="py-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {statusDot(customer.paymentStatus)}
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate" data-testid={`text-customer-name-${customer.id}`}>{customer.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap mt-0.5">
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </span>
                      )}
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </span>
                      )}
                      {customer.businessName && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {customer.businessName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(customer.paymentStatus)}
                  {!customer.isActive && (
                    <Badge variant="secondary" data-testid="badge-inactive">Inactive</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={!!selectedCustomerId} onOpenChange={(open) => { if (!open) setSelectedCustomerId(null); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto" data-testid="sheet-customer-detail">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Customer Details
            </SheetTitle>
          </SheetHeader>
          {customerDetailQuery.isLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : detail ? (
            <div className="space-y-6 mt-6">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input
                    data-testid="input-edit-name"
                    value={editData.name || ""}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    data-testid="input-edit-email"
                    value={editData.email || ""}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Business Name</Label>
                  <Input
                    data-testid="input-edit-business"
                    value={editData.businessName || ""}
                    onChange={(e) => setEditData({ ...editData, businessName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    data-testid="input-edit-phone"
                    value={editData.phone || ""}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Input
                    data-testid="input-edit-address"
                    value={editData.address || ""}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Payment Status</Label>
                  <Select
                    value={editData.paymentStatus || "CURRENT"}
                    onValueChange={(v) => setEditData({ ...editData, paymentStatus: v as any })}
                  >
                    <SelectTrigger data-testid="select-edit-payment-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CURRENT">Current</SelectItem>
                      <SelectItem value="PAST_DUE_30">Past Due (30 days)</SelectItem>
                      <SelectItem value="PAST_DUE_60">Past Due (60 days)</SelectItem>
                      <SelectItem value="COLLECTIONS">Collections</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  data-testid="button-save-customer"
                  disabled={updateMutation.isPending}
                  onClick={() => {
                    if (selectedCustomerId) {
                      updateMutation.mutate({
                        id: selectedCustomerId,
                        data: {
                          name: editData.name,
                          email: editData.email,
                          businessName: editData.businessName || null,
                          phone: editData.phone || null,
                          address: editData.address || null,
                          paymentStatus: editData.paymentStatus,
                        },
                      });
                    }
                  }}
                >
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <StickyNote className="h-4 w-4" />
                  Notes ({detail.notes.length})
                </h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a note..."
                      data-testid="input-customer-note"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                  <Button
                    size="sm"
                    data-testid="button-add-note"
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                    onClick={() => {
                      if (selectedCustomerId && newNote.trim()) {
                        addNoteMutation.mutate({ entityId: selectedCustomerId, content: newNote.trim() });
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
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <div>
                          <span className="font-medium text-foreground capitalize">{a.action.replace(/_/g, " ")}</span>
                          <span className="ml-2">{new Date(a.createdAt).toLocaleString()}</span>
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
    </div>
  );
}
