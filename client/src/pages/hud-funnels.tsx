import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Funnel, FunnelStep } from "@shared/schema";
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
  GitBranch,
  Plus,
  Loader2,
  Trash2,
  ChevronRight,
  ArrowRight,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Eye,
  Layers,
  Type,
  LayoutGrid,
  MousePointerClick,
  Quote,
  ImageIcon,
  Megaphone,
} from "lucide-react";

interface Block {
  id: string;
  type: "hero" | "text" | "features" | "cta" | "testimonials" | "image";
  data: Record<string, any>;
}

type FunnelWithSteps = Funnel & { steps?: FunnelStep[] };

const STEP_TYPES = [
  { value: "opt_in", label: "Opt-In" },
  { value: "sales", label: "Sales" },
  { value: "checkout", label: "Checkout" },
  { value: "thank_you", label: "Thank You" },
  { value: "custom", label: "Custom" },
];

const stepTypeConfig: Record<string, { label: string; color: string }> = {
  opt_in: { label: "Opt-In", color: "border-emerald-400 text-emerald-600 dark:text-emerald-400" },
  sales: { label: "Sales", color: "border-blue-400 text-blue-600 dark:text-blue-400" },
  checkout: { label: "Checkout", color: "border-violet-400 text-violet-600 dark:text-violet-400" },
  thank_you: { label: "Thank You", color: "border-amber-400 text-amber-600 dark:text-amber-400" },
  custom: { label: "Custom", color: "border-gray-400 text-gray-600 dark:text-gray-400" },
};

const BLOCK_TYPES = [
  { value: "hero", label: "Hero", icon: Megaphone },
  { value: "text", label: "Text", icon: Type },
  { value: "features", label: "Features Grid", icon: LayoutGrid },
  { value: "cta", label: "CTA", icon: MousePointerClick },
  { value: "testimonials", label: "Testimonials", icon: Quote },
  { value: "image", label: "Image", icon: ImageIcon },
];

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function createDefaultBlock(type: Block["type"]): Block {
  const defaults: Record<string, Record<string, any>> = {
    hero: { heading: "", subheading: "", ctaText: "", ctaLink: "", background: "" },
    text: { content: "" },
    features: { items: [{ icon: "", title: "", description: "" }] },
    cta: { heading: "", description: "", buttonText: "", buttonLink: "" },
    testimonials: { items: [{ quote: "", author: "", role: "" }] },
    image: { url: "", alt: "", caption: "" },
  };
  return { id: generateId(), type, data: defaults[type] || {} };
}

function statusBadge(status: string) {
  switch (status) {
    case "PUBLISHED":
      return (
        <Badge variant="outline" className="border-green-400 text-green-600 dark:text-green-400">
          Published
        </Badge>
      );
    case "ARCHIVED":
      return (
        <Badge variant="outline" className="border-amber-400 text-amber-600 dark:text-amber-400">
          Archived
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="border-gray-400 text-gray-600 dark:text-gray-400">
          Draft
        </Badge>
      );
  }
}

function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}) {
  const addBlock = (type: Block["type"]) => {
    onChange([...blocks, createDefaultBlock(type)]);
  };

  const removeBlock = (idx: number) => {
    onChange(blocks.filter((_, i) => i !== idx));
  };

  const moveBlock = (idx: number, direction: "up" | "down") => {
    const newBlocks = [...blocks];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newBlocks.length) return;
    [newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]];
    onChange(newBlocks);
  };

  const updateBlockData = (idx: number, data: Record<string, any>) => {
    onChange(blocks.map((b, i) => (i === idx ? { ...b, data: { ...b.data, ...data } } : b)));
  };

  return (
    <div className="space-y-3">
      {blocks.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Layers className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground" data-testid="text-empty-blocks">
              No content blocks yet. Add blocks below.
            </p>
          </CardContent>
        </Card>
      )}
      {blocks.map((block, idx) => {
        const blockType = BLOCK_TYPES.find((b) => b.value === block.type);
        const BlockIcon = blockType?.icon || Type;
        return (
          <Card key={block.id} data-testid={`card-block-${idx}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <BlockIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">{blockType?.label || block.type}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" disabled={idx === 0} onClick={() => moveBlock(idx, "up")} data-testid={`button-block-up-${idx}`}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" disabled={idx === blocks.length - 1} onClick={() => moveBlock(idx, "down")} data-testid={`button-block-down-${idx}`}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => removeBlock(idx)} data-testid={`button-block-remove-${idx}`}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>

              {block.type === "hero" && (
                <div className="space-y-2">
                  <Input placeholder="Heading" value={block.data.heading || ""} onChange={(e) => updateBlockData(idx, { heading: e.target.value })} data-testid={`input-block-heading-${idx}`} />
                  <Input placeholder="Subheading" value={block.data.subheading || ""} onChange={(e) => updateBlockData(idx, { subheading: e.target.value })} data-testid={`input-block-subheading-${idx}`} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="CTA Button Text" value={block.data.ctaText || ""} onChange={(e) => updateBlockData(idx, { ctaText: e.target.value })} data-testid={`input-block-cta-text-${idx}`} />
                    <Input placeholder="CTA Link" value={block.data.ctaLink || ""} onChange={(e) => updateBlockData(idx, { ctaLink: e.target.value })} data-testid={`input-block-cta-link-${idx}`} />
                  </div>
                  <Input placeholder="Background URL or color" value={block.data.background || ""} onChange={(e) => updateBlockData(idx, { background: e.target.value })} data-testid={`input-block-background-${idx}`} />
                </div>
              )}

              {block.type === "text" && (
                <Textarea placeholder="Text content (markdown supported)" value={block.data.content || ""} onChange={(e) => updateBlockData(idx, { content: e.target.value })} rows={4} data-testid={`input-block-content-${idx}`} />
              )}

              {block.type === "features" && (
                <div className="space-y-2">
                  {(block.data.items || []).map((item: any, i: number) => (
                    <div key={i} className="grid grid-cols-3 gap-2">
                      <Input placeholder="Icon name" value={item.icon || ""} onChange={(e) => {
                        const items = [...(block.data.items || [])];
                        items[i] = { ...items[i], icon: e.target.value };
                        updateBlockData(idx, { items });
                      }} data-testid={`input-feature-icon-${idx}-${i}`} />
                      <Input placeholder="Title" value={item.title || ""} onChange={(e) => {
                        const items = [...(block.data.items || [])];
                        items[i] = { ...items[i], title: e.target.value };
                        updateBlockData(idx, { items });
                      }} data-testid={`input-feature-title-${idx}-${i}`} />
                      <div className="flex gap-1">
                        <Input placeholder="Description" value={item.description || ""} onChange={(e) => {
                          const items = [...(block.data.items || [])];
                          items[i] = { ...items[i], description: e.target.value };
                          updateBlockData(idx, { items });
                        }} data-testid={`input-feature-desc-${idx}-${i}`} />
                        <Button size="icon" variant="ghost" onClick={() => {
                          const items = (block.data.items || []).filter((_: any, j: number) => j !== i);
                          updateBlockData(idx, { items });
                        }} data-testid={`button-remove-feature-${idx}-${i}`}>
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    const items = [...(block.data.items || []), { icon: "", title: "", description: "" }];
                    updateBlockData(idx, { items });
                  }} data-testid={`button-add-feature-${idx}`}>
                    <Plus className="h-3 w-3 mr-1" /> Add Feature
                  </Button>
                </div>
              )}

              {block.type === "cta" && (
                <div className="space-y-2">
                  <Input placeholder="Heading" value={block.data.heading || ""} onChange={(e) => updateBlockData(idx, { heading: e.target.value })} data-testid={`input-block-cta-heading-${idx}`} />
                  <Textarea placeholder="Description" value={block.data.description || ""} onChange={(e) => updateBlockData(idx, { description: e.target.value })} rows={2} data-testid={`input-block-cta-desc-${idx}`} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Button Text" value={block.data.buttonText || ""} onChange={(e) => updateBlockData(idx, { buttonText: e.target.value })} data-testid={`input-block-btn-text-${idx}`} />
                    <Input placeholder="Button Link" value={block.data.buttonLink || ""} onChange={(e) => updateBlockData(idx, { buttonLink: e.target.value })} data-testid={`input-block-btn-link-${idx}`} />
                  </div>
                </div>
              )}

              {block.type === "testimonials" && (
                <div className="space-y-2">
                  {(block.data.items || []).map((item: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <Textarea placeholder="Quote" value={item.quote || ""} onChange={(e) => {
                        const items = [...(block.data.items || [])];
                        items[i] = { ...items[i], quote: e.target.value };
                        updateBlockData(idx, { items });
                      }} rows={2} data-testid={`input-testimonial-quote-${idx}-${i}`} />
                      <div className="flex gap-2">
                        <Input placeholder="Author" value={item.author || ""} onChange={(e) => {
                          const items = [...(block.data.items || [])];
                          items[i] = { ...items[i], author: e.target.value };
                          updateBlockData(idx, { items });
                        }} data-testid={`input-testimonial-author-${idx}-${i}`} />
                        <Input placeholder="Role" value={item.role || ""} onChange={(e) => {
                          const items = [...(block.data.items || [])];
                          items[i] = { ...items[i], role: e.target.value };
                          updateBlockData(idx, { items });
                        }} data-testid={`input-testimonial-role-${idx}-${i}`} />
                        <Button size="icon" variant="ghost" onClick={() => {
                          const items = (block.data.items || []).filter((_: any, j: number) => j !== i);
                          updateBlockData(idx, { items });
                        }} data-testid={`button-remove-testimonial-${idx}-${i}`}>
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => {
                    const items = [...(block.data.items || []), { quote: "", author: "", role: "" }];
                    updateBlockData(idx, { items });
                  }} data-testid={`button-add-testimonial-${idx}`}>
                    <Plus className="h-3 w-3 mr-1" /> Add Testimonial
                  </Button>
                </div>
              )}

              {block.type === "image" && (
                <div className="space-y-2">
                  <Input placeholder="Image URL" value={block.data.url || ""} onChange={(e) => updateBlockData(idx, { url: e.target.value })} data-testid={`input-block-img-url-${idx}`} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Alt text" value={block.data.alt || ""} onChange={(e) => updateBlockData(idx, { alt: e.target.value })} data-testid={`input-block-img-alt-${idx}`} />
                    <Input placeholder="Caption" value={block.data.caption || ""} onChange={(e) => updateBlockData(idx, { caption: e.target.value })} data-testid={`input-block-img-caption-${idx}`} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex flex-wrap gap-2">
        {BLOCK_TYPES.map((bt) => {
          const Icon = bt.icon;
          return (
            <Button key={bt.value} variant="outline" size="sm" onClick={() => addBlock(bt.value as Block["type"])} data-testid={`button-add-block-${bt.value}`}>
              <Icon className="h-3 w-3 mr-1" />
              {bt.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export default function HudFunnels() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("steps");
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [stepBlocks, setStepBlocks] = useState<Block[]>([]);
  const [addStepOpen, setAddStepOpen] = useState(false);

  const [formData, setFormData] = useState({ name: "", description: "" });
  const [editSettings, setEditSettings] = useState({
    name: "",
    slug: "",
    description: "",
    status: "DRAFT",
  });
  const [newStepData, setNewStepData] = useState({ title: "", stepType: "custom" });
  const [editStepTitle, setEditStepTitle] = useState("");
  const [editStepType, setEditStepType] = useState("custom");

  const funnelsQuery = useQuery<Funnel[]>({
    queryKey: ["/api/admin/funnels"],
  });

  const funnelDetailQuery = useQuery<FunnelWithSteps>({
    queryKey: ["/api/admin/funnels", selectedFunnelId],
    enabled: !!selectedFunnelId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const res = await apiRequest("POST", "/api/admin/funnels", {
        name: data.name,
        slug,
        description: data.description || null,
        status: "DRAFT",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/funnels"] });
      setCreateOpen(false);
      setFormData({ name: "", description: "" });
      toast({ title: "Funnel created" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateFunnelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/funnels/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/funnels"] });
      if (selectedFunnelId) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/funnels", selectedFunnelId] });
      }
      toast({ title: "Funnel updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteFunnelMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/funnels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/funnels"] });
      setSelectedFunnelId(null);
      toast({ title: "Funnel deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const createStepMutation = useMutation({
    mutationFn: async ({ funnelId, data }: { funnelId: string; data: any }) => {
      const res = await apiRequest("POST", `/api/admin/funnels/${funnelId}/steps`, data);
      return res.json();
    },
    onSuccess: () => {
      if (selectedFunnelId) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/funnels", selectedFunnelId] });
      }
      setAddStepOpen(false);
      setNewStepData({ title: "", stepType: "custom" });
      toast({ title: "Step added" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateStepMutation = useMutation({
    mutationFn: async ({ funnelId, stepId, data }: { funnelId: string; stepId: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/funnels/${funnelId}/steps/${stepId}`, data);
      return res.json();
    },
    onSuccess: () => {
      if (selectedFunnelId) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/funnels", selectedFunnelId] });
      }
      toast({ title: "Step updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: async ({ funnelId, stepId }: { funnelId: string; stepId: string }) => {
      await apiRequest("DELETE", `/api/admin/funnels/${funnelId}/steps/${stepId}`);
    },
    onSuccess: () => {
      if (selectedFunnelId) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/funnels", selectedFunnelId] });
      }
      setSelectedStepId(null);
      toast({ title: "Step deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const openDetail = useCallback((funnel: Funnel) => {
    setSelectedFunnelId(funnel.id);
    setActiveTab("steps");
    setSelectedStepId(null);
    setEditSettings({
      name: funnel.name,
      slug: funnel.slug,
      description: funnel.description || "",
      status: funnel.status,
    });
  }, []);

  const openStepEditor = useCallback((step: FunnelStep) => {
    setSelectedStepId(step.id);
    setEditStepTitle(step.title);
    setEditStepType(step.stepType);
    try {
      setStepBlocks(JSON.parse(step.content || "[]"));
    } catch {
      setStepBlocks([]);
    }
  }, []);

  const handleSaveSettings = () => {
    if (!selectedFunnelId) return;
    updateFunnelMutation.mutate({
      id: selectedFunnelId,
      data: {
        name: editSettings.name,
        slug: editSettings.slug,
        description: editSettings.description || null,
        status: editSettings.status,
      },
    });
  };

  const handleSaveStep = () => {
    if (!selectedFunnelId || !selectedStepId) return;
    updateStepMutation.mutate({
      funnelId: selectedFunnelId,
      stepId: selectedStepId,
      data: {
        title: editStepTitle,
        stepType: editStepType,
        content: JSON.stringify(stepBlocks),
      },
    });
  };

  const handleReorderStep = (step: FunnelStep, direction: "up" | "down") => {
    if (!selectedFunnelId || !detail?.steps) return;
    const sorted = [...detail.steps].sort((a, b) => a.stepOrder - b.stepOrder);
    const idx = sorted.findIndex((s) => s.id === step.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    updateStepMutation.mutate({
      funnelId: selectedFunnelId,
      stepId: step.id,
      data: { stepOrder: sorted[swapIdx].stepOrder },
    });
    updateStepMutation.mutate({
      funnelId: selectedFunnelId,
      stepId: sorted[swapIdx].id,
      data: { stepOrder: step.stepOrder },
    });
  };

  const funnels = funnelsQuery.data || [];
  const detail = funnelDetailQuery.data;
  const steps = detail?.steps ? [...detail.steps].sort((a, b) => a.stepOrder - b.stepOrder) : [];
  const selectedStep = steps.find((s) => s.id === selectedStepId);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <GitBranch className="h-6 w-6 text-violet-500 dark:text-violet-400" />
            Funnels
          </h1>
          <p className="text-muted-foreground text-sm mt-1" data-testid="text-page-subtitle">
            Build multi-step conversion funnels
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-funnel" className="bg-violet-500 hover:bg-violet-600 text-white border-violet-600">
              <Plus className="h-4 w-4 mr-2" />
              New Funnel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-testid="dialog-create-funnel">
            <DialogHeader>
              <DialogTitle>Create Funnel</DialogTitle>
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
                  data-testid="input-funnel-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Product Launch Funnel"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  data-testid="input-funnel-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this funnel for?"
                  rows={3}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-violet-500 hover:bg-violet-600 text-white border-violet-600"
                disabled={createMutation.isPending}
                data-testid="button-submit-funnel"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Funnel
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {funnelsQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      ) : funnels.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GitBranch className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground" data-testid="text-empty-funnels">
              No funnels yet. Create your first funnel to start building conversion flows.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {funnels.map((funnel) => (
            <Card
              key={funnel.id}
              className="cursor-pointer hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
              data-testid={`card-funnel-${funnel.id}`}
              onClick={() => openDetail(funnel)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate" data-testid={`text-funnel-name-${funnel.id}`}>
                      {funnel.name}
                    </div>
                    {funnel.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{funnel.description}</p>
                    )}
                  </div>
                  {statusBadge(funnel.status)}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1" data-testid={`text-funnel-slug-${funnel.id}`}>
                    <GitBranch className="h-3 w-3" />
                    /{funnel.slug}
                  </span>
                  <span data-testid={`text-funnel-date-${funnel.id}`}>
                    {new Date(funnel.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={!!selectedFunnelId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedFunnelId(null);
            setSelectedStepId(null);
          }
        }}
      >
        <SheetContent className="sm:max-w-3xl overflow-y-auto" data-testid="sheet-funnel-detail">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-violet-500" />
              Funnel Editor
            </SheetTitle>
          </SheetHeader>

          {funnelDetailQuery.isLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : detail ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="w-full">
                <TabsTrigger value="steps" data-testid="tab-steps" className="flex-1">
                  Steps
                </TabsTrigger>
                <TabsTrigger value="settings" data-testid="tab-funnel-settings" className="flex-1">
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="steps" className="space-y-4 mt-4">
                {!selectedStepId ? (
                  <>
                    <div className="overflow-x-auto pb-2">
                      <div className="flex items-center gap-2 min-w-max">
                        {steps.map((step, idx) => {
                          const stc = stepTypeConfig[step.stepType] || stepTypeConfig.custom;
                          return (
                            <div key={step.id} className="flex items-center gap-2">
                              <Card
                                className="cursor-pointer hover:border-violet-300 dark:hover:border-violet-700 transition-colors min-w-[140px]"
                                data-testid={`card-step-${step.id}`}
                                onClick={() => openStepEditor(step)}
                              >
                                <CardContent className="p-3 space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-medium truncate" data-testid={`text-step-title-${step.id}`}>{step.title}</span>
                                    <div className="flex items-center gap-0.5">
                                      <Button size="icon" variant="ghost" disabled={idx === 0} onClick={(e) => { e.stopPropagation(); handleReorderStep(step, "up"); }} data-testid={`button-step-up-${step.id}`}>
                                        <ChevronUp className="h-3 w-3" />
                                      </Button>
                                      <Button size="icon" variant="ghost" disabled={idx === steps.length - 1} onClick={(e) => { e.stopPropagation(); handleReorderStep(step, "down"); }} data-testid={`button-step-down-${step.id}`}>
                                        <ChevronDown className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className={stc.color}>
                                    {stc.label}
                                  </Badge>
                                  <div className="text-[10px] text-muted-foreground">
                                    {(() => {
                                      try {
                                        return JSON.parse(step.content || "[]").length;
                                      } catch {
                                        return 0;
                                      }
                                    })()} blocks
                                  </div>
                                </CardContent>
                              </Card>
                              {idx < steps.length - 1 && (
                                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}
                        {steps.length === 0 && (
                          <Card>
                            <CardContent className="py-8 px-12 text-center">
                              <Layers className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                              <p className="text-sm text-muted-foreground" data-testid="text-empty-steps">
                                No steps yet. Add your first step below.
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>

                    <Dialog open={addStepOpen} onOpenChange={setAddStepOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full" data-testid="button-add-step">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Step
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm" data-testid="dialog-add-step">
                        <DialogHeader>
                          <DialogTitle>Add Step</DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!selectedFunnelId) return;
                            createStepMutation.mutate({
                              funnelId: selectedFunnelId,
                              data: {
                                title: newStepData.title,
                                stepType: newStepData.stepType,
                                content: "[]",
                                stepOrder: steps.length,
                              },
                            });
                          }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input
                              data-testid="input-step-title"
                              value={newStepData.title}
                              onChange={(e) => setNewStepData({ ...newStepData, title: e.target.value })}
                              placeholder="e.g. Opt-In Page"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Step Type</Label>
                            <Select value={newStepData.stepType} onValueChange={(v) => setNewStepData({ ...newStepData, stepType: v })}>
                              <SelectTrigger data-testid="select-step-type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STEP_TYPES.map((st) => (
                                  <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            type="submit"
                            className="w-full bg-violet-500 hover:bg-violet-600 text-white border-violet-600"
                            disabled={createStepMutation.isPending}
                            data-testid="button-submit-step"
                          >
                            {createStepMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Add Step
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedStepId(null)} data-testid="button-back-to-steps">
                        <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                        Back to Steps
                      </Button>
                      <span className="text-sm font-medium">{selectedStep?.title}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Step Title</Label>
                        <Input
                          data-testid="input-edit-step-title"
                          value={editStepTitle}
                          onChange={(e) => setEditStepTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Step Type</Label>
                        <Select value={editStepType} onValueChange={setEditStepType}>
                          <SelectTrigger data-testid="select-edit-step-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STEP_TYPES.map((st) => (
                              <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Content Blocks</Label>
                      <BlockEditor blocks={stepBlocks} onChange={setStepBlocks} />
                    </div>

                    <Button
                      className="w-full bg-violet-500 hover:bg-violet-600 text-white border-violet-600"
                      data-testid="button-save-step"
                      disabled={updateStepMutation.isPending}
                      onClick={handleSaveStep}
                    >
                      {updateStepMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save Step
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-red-300 text-red-600"
                      data-testid="button-delete-step"
                      disabled={deleteStepMutation.isPending}
                      onClick={() => {
                        if (selectedFunnelId && selectedStepId) {
                          deleteStepMutation.mutate({ funnelId: selectedFunnelId, stepId: selectedStepId });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Step
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="space-y-1.5">
                  <Label>Funnel Name</Label>
                  <Input
                    data-testid="input-edit-funnel-name"
                    value={editSettings.name}
                    onChange={(e) => setEditSettings({ ...editSettings, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input
                    data-testid="input-edit-funnel-slug"
                    value={editSettings.slug}
                    onChange={(e) => setEditSettings({ ...editSettings, slug: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    data-testid="input-edit-funnel-description"
                    value={editSettings.description}
                    onChange={(e) => setEditSettings({ ...editSettings, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={editSettings.status}
                    onValueChange={(v) => setEditSettings({ ...editSettings, status: v })}
                  >
                    <SelectTrigger data-testid="select-funnel-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full bg-violet-500 hover:bg-violet-600 text-white border-violet-600"
                  data-testid="button-save-funnel-settings"
                  disabled={updateFunnelMutation.isPending}
                  onClick={handleSaveSettings}
                >
                  {updateFunnelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Settings
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-600"
                  data-testid="button-delete-funnel"
                  disabled={deleteFunnelMutation.isPending}
                  onClick={() => {
                    if (selectedFunnelId) deleteFunnelMutation.mutate(selectedFunnelId);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Funnel
                </Button>
              </TabsContent>
            </Tabs>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
