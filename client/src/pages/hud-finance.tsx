import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Invoice, Customer } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Plus, Loader2, Trash2, FileText, Send, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", icon: FileText },
  SENT: { label: "Sent", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Send },
  PAID: { label: "Paid", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  OVERDUE: { label: "Overdue", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
  CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500", icon: XCircle },
};

export default function HudFinance() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerId: "",
    subtotal: "",
    tax: "",
    dueDate: "",
    notes: "",
  });

  const invoicesQuery = useQuery<Invoice[]>({
    queryKey: statusFilter !== "all"
      ? [`/api/admin/invoices?status=${statusFilter}`]
      : ["/api/admin/invoices"],
  });

  const invoiceDetailQuery = useQuery<Invoice>({
    queryKey: ["/api/admin/invoices", selectedInvoiceId],
    enabled: !!selectedInvoiceId,
  });

  const customersQuery = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const subtotal = Math.round(parseFloat(data.subtotal || "0") * 100);
      const tax = Math.round(parseFloat(data.tax || "0") * 100);
      const res = await apiRequest("POST", "/api/admin/invoices", {
        customerId: data.customerId || null,
        subtotal,
        tax,
        total: subtotal + tax,
        dueDate: data.dueDate || null,
        notes: data.notes || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      setCreateOpen(false);
      setFormData({ customerId: "", subtotal: "", tax: "", dueDate: "", notes: "" });
      toast({ title: "Invoice created" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/invoices/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({ title: "Invoice updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      setSelectedInvoiceId(null);
      toast({ title: "Invoice deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const invoicesList = invoicesQuery.data || [];
  const detail = invoiceDetailQuery.data;
  const customers = customersQuery.data || [];

  const totalRevenue = invoicesList.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0);
  const totalOutstanding = invoicesList.filter((i) => i.status === "SENT" || i.status === "OVERDUE").reduce((s, i) => s + i.total, 0);

  const customerName = (id: string | null) => {
    if (!id) return "No customer";
    return customers.find((c) => c.id === id)?.name || "Unknown";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Finance
          </h1>
          <p className="text-muted-foreground text-sm mt-1" data-testid="text-page-subtitle">
            Manage invoices and track revenue
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-invoice" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-testid="dialog-create-invoice">
            <DialogHeader>
              <DialogTitle>New Invoice</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={formData.customerId} onValueChange={(v) => setFormData({ ...formData, customerId: v })}>
                  <SelectTrigger data-testid="select-invoice-customer">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No customer</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Subtotal ($)</Label>
                  <Input type="number" step="0.01" min="0" data-testid="input-invoice-subtotal" value={formData.subtotal} onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Tax ($)</Label>
                  <Input type="number" step="0.01" min="0" data-testid="input-invoice-tax" value={formData.tax} onChange={(e) => setFormData({ ...formData, tax: e.target.value })} placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" data-testid="input-invoice-due-date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea data-testid="input-invoice-notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <div className="p-3 bg-muted rounded-md text-sm">
                <span className="text-muted-foreground">Total: </span>
                <span className="font-semibold">
                  {formatCents(
                    Math.round(parseFloat(formData.subtotal || "0") * 100) +
                    Math.round(parseFloat(formData.tax || "0") * 100)
                  )}
                </span>
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={createMutation.isPending} data-testid="button-submit-invoice">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Invoice
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Paid Revenue</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-total-revenue">{formatCents(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Outstanding</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400" data-testid="text-total-outstanding">{formatCents(totalOutstanding)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="DRAFT" data-testid="tab-draft">Draft</TabsTrigger>
          <TabsTrigger value="SENT" data-testid="tab-sent">Sent</TabsTrigger>
          <TabsTrigger value="PAID" data-testid="tab-paid">Paid</TabsTrigger>
          <TabsTrigger value="OVERDUE" data-testid="tab-overdue">Overdue</TabsTrigger>
        </TabsList>
      </Tabs>

      {invoicesQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : invoicesList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground" data-testid="text-empty-invoices">
              {statusFilter !== "all" ? "No invoices with this status" : "No invoices yet. Create your first invoice to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {invoicesList.map((invoice) => {
            const sc = statusConfig[invoice.status];
            const StatusIcon = sc?.icon || FileText;
            return (
              <Card
                key={invoice.id}
                className="cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                data-testid={`card-invoice-${invoice.id}`}
                onClick={() => setSelectedInvoiceId(invoice.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm" data-testid={`text-invoice-number-${invoice.id}`}>{invoice.invoiceNumber}</div>
                        <div className="text-xs text-muted-foreground">{customerName(invoice.customerId)}</div>
                        {invoice.dueDate && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Due {new Date(invoice.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-semibold text-sm" data-testid={`text-invoice-total-${invoice.id}`}>{formatCents(invoice.total)}</span>
                      <Badge className={`${sc?.color || ""} border-0`}>{sc?.label}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={!!selectedInvoiceId} onOpenChange={(open) => { if (!open) setSelectedInvoiceId(null); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto" data-testid="sheet-invoice-detail">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Invoice Details
            </SheetTitle>
          </SheetHeader>
          {invoiceDetailQuery.isLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : detail ? (
            <div className="space-y-4 mt-6">
              <div className="p-3 bg-muted rounded-md">
                <div className="text-xs text-muted-foreground">Invoice Number</div>
                <div className="font-mono font-semibold" data-testid="text-detail-invoice-number">{detail.invoiceNumber}</div>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  defaultValue={detail.status}
                  onValueChange={(v) => updateMutation.mutate({ id: detail.id, data: { status: v } })}
                >
                  <SelectTrigger data-testid="select-edit-invoice-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Customer</Label>
                <Select
                  defaultValue={detail.customerId || "none"}
                  onValueChange={(v) => updateMutation.mutate({ id: detail.id, data: { customerId: v === "none" ? null : v } })}
                >
                  <SelectTrigger data-testid="select-edit-invoice-customer">
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
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Subtotal</Label>
                  <div className="p-2 text-sm font-semibold border rounded-md">{formatCents(detail.subtotal)}</div>
                </div>
                <div className="space-y-1.5">
                  <Label>Tax</Label>
                  <div className="p-2 text-sm font-semibold border rounded-md">{formatCents(detail.tax)}</div>
                </div>
                <div className="space-y-1.5">
                  <Label>Total</Label>
                  <div className="p-2 text-sm font-semibold border rounded-md text-emerald-600">{formatCents(detail.total)}</div>
                </div>
              </div>
              {detail.dueDate && (
                <div className="text-xs text-muted-foreground p-3 border rounded-md">
                  Due: {new Date(detail.dueDate).toLocaleDateString()}
                </div>
              )}
              {detail.paidAt && (
                <div className="text-xs text-muted-foreground p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                  Paid on {new Date(detail.paidAt).toLocaleString()}
                </div>
              )}
              {detail.notes && (
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <p className="text-sm text-muted-foreground p-3 border rounded-md">{detail.notes}</p>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                data-testid="button-delete-invoice"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (selectedInvoiceId) {
                    deleteMutation.mutate(selectedInvoiceId);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Invoice
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
