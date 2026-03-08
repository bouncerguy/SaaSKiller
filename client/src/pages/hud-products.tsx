import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
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
import { Switch } from "@/components/ui/switch";
import { ShoppingBag, Plus, Search, Loader2, Trash2, DollarSign, Tag, RefreshCw } from "lucide-react";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function billingLabel(cycle: string) {
  const labels: Record<string, string> = {
    ONE_TIME: "One-time",
    MONTHLY: "/mo",
    QUARTERLY: "/qtr",
    YEARLY: "/yr",
  };
  return labels[cycle] || cycle;
}

function billingBadge(cycle: string) {
  const colors: Record<string, string> = {
    ONE_TIME: "border-gray-400 text-gray-600 dark:text-gray-400",
    MONTHLY: "border-blue-400 text-blue-600 dark:text-blue-400",
    QUARTERLY: "border-purple-400 text-purple-600 dark:text-purple-400",
    YEARLY: "border-amber-400 text-amber-600 dark:text-amber-400",
  };
  const label: Record<string, string> = {
    ONE_TIME: "One-time",
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly",
    YEARLY: "Yearly",
  };
  return (
    <Badge variant="outline" className={colors[cycle] || ""}>
      <RefreshCw className="h-3 w-3 mr-1" />
      {label[cycle] || cycle}
    </Badge>
  );
}

export default function HudProducts() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    billingCycle: "ONE_TIME" as string,
    category: "",
  });

  const [editData, setEditData] = useState<Partial<Product>>({});

  const productsQuery = useQuery<Product[]>({
    queryKey: searchQuery
      ? [`/api/admin/products?search=${encodeURIComponent(searchQuery)}`]
      : ["/api/admin/products"],
  });

  const productDetailQuery = useQuery<Product>({
    queryKey: ["/api/admin/products", selectedProductId],
    enabled: !!selectedProductId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/admin/products", {
        name: data.name,
        description: data.description || null,
        price: Math.round(parseFloat(data.price || "0") * 100),
        billingCycle: data.billingCycle,
        category: data.category || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      setCreateOpen(false);
      setFormData({ name: "", description: "", price: "", billingCycle: "ONE_TIME", category: "" });
      toast({ title: "Product created" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/products/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({ title: "Product updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      setSelectedProductId(null);
      toast({ title: "Product deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const products = productsQuery.data || [];
  const detail = productDetailQuery.data;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <ShoppingBag className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            Products & Services
          </h1>
          <p className="text-muted-foreground text-sm mt-1" data-testid="text-page-subtitle">
            Manage your product and service catalog
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-product" className="bg-orange-600 hover:bg-orange-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-testid="dialog-create-product">
            <DialogHeader>
              <DialogTitle>New Product</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="productName">Name *</Label>
                <Input id="productName" data-testid="input-product-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productDesc">Description</Label>
                <Textarea id="productDesc" data-testid="input-product-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="productPrice">Price ($)</Label>
                  <Input id="productPrice" type="number" step="0.01" min="0" data-testid="input-product-price" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Billing</Label>
                  <Select value={formData.billingCycle} onValueChange={(v) => setFormData({ ...formData, billingCycle: v })}>
                    <SelectTrigger data-testid="select-billing-cycle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONE_TIME">One-time</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="productCategory">Category</Label>
                <Input id="productCategory" data-testid="input-product-category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Consulting, Software, Hardware" />
              </div>
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white" disabled={createMutation.isPending} data-testid="button-submit-product">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Product
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products by name, description, or category..."
          className="pl-10"
          data-testid="input-search-products"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {productsQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground" data-testid="text-empty-products">
              {searchQuery ? "No products match your search" : "No products yet. Add your first product or service to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card
              key={product.id}
              className={`cursor-pointer hover:border-orange-300 dark:hover:border-orange-700 transition-colors ${!product.isActive ? "opacity-60" : ""}`}
              data-testid={`card-product-${product.id}`}
              onClick={() => {
                setSelectedProductId(product.id);
                setEditData(product);
              }}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate" data-testid={`text-product-name-${product.id}`}>{product.name}</div>
                    {product.category && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Tag className="h-3 w-3" />
                        {product.category}
                      </div>
                    )}
                  </div>
                  {!product.isActive && <Badge variant="secondary" className="text-[10px] shrink-0">Inactive</Badge>}
                </div>
                {product.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-orange-600 dark:text-orange-400 flex items-center" data-testid={`text-product-price-${product.id}`}>
                    <DollarSign className="h-4 w-4" />
                    {(product.price / 100).toFixed(2)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">{billingLabel(product.billingCycle)}</span>
                  </span>
                  {billingBadge(product.billingCycle)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={!!selectedProductId} onOpenChange={(open) => { if (!open) setSelectedProductId(null); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto" data-testid="sheet-product-detail">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-orange-600" />
              Product Details
            </SheetTitle>
          </SheetHeader>
          {productDetailQuery.isLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : detail ? (
            <div className="space-y-4 mt-6">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  data-testid="input-edit-product-name"
                  value={editData.name || ""}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  data-testid="input-edit-product-description"
                  value={editData.description || ""}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    data-testid="input-edit-product-price"
                    value={editData.price !== undefined ? (editData.price / 100).toFixed(2) : "0.00"}
                    onChange={(e) => setEditData({ ...editData, price: Math.round(parseFloat(e.target.value || "0") * 100) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Billing</Label>
                  <Select
                    value={editData.billingCycle || "ONE_TIME"}
                    onValueChange={(v) => setEditData({ ...editData, billingCycle: v as any })}
                  >
                    <SelectTrigger data-testid="select-edit-billing-cycle">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONE_TIME">One-time</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input
                  data-testid="input-edit-product-category"
                  value={editData.category || ""}
                  onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border">
                <Label htmlFor="product-active" className="cursor-pointer">Active</Label>
                <Switch
                  id="product-active"
                  data-testid="switch-product-active"
                  checked={editData.isActive !== false}
                  onCheckedChange={(checked) => setEditData({ ...editData, isActive: checked })}
                />
              </div>
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                data-testid="button-save-product"
                disabled={updateMutation.isPending}
                onClick={() => {
                  if (selectedProductId) {
                    updateMutation.mutate({
                      id: selectedProductId,
                      data: {
                        name: editData.name,
                        description: editData.description || null,
                        price: editData.price,
                        billingCycle: editData.billingCycle,
                        category: editData.category || null,
                        isActive: editData.isActive,
                      },
                    });
                  }
                }}
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                data-testid="button-delete-product"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (selectedProductId) {
                    deleteMutation.mutate(selectedProductId);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Product
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
