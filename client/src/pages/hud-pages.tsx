import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Page } from "@shared/schema";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Plus,
  Loader2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Search,
  Eye,
  Home,
  GripVertical,
  Type,
  LayoutTemplate,
  Grid3X3,
  MousePointerClick,
  Quote,
  ImageIcon,
  X,
} from "lucide-react";

interface HeroBlock {
  type: "hero";
  heading: string;
  subheading: string;
  ctaText: string;
  ctaLink: string;
  background: string;
}

interface TextBlock {
  type: "text";
  content: string;
}

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface FeaturesBlock {
  type: "features";
  items: FeatureItem[];
}

interface CtaBlock {
  type: "cta";
  heading: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

interface TestimonialItem {
  quote: string;
  author: string;
  role: string;
}

interface TestimonialsBlock {
  type: "testimonials";
  items: TestimonialItem[];
}

interface ImageBlock {
  type: "image";
  url: string;
  alt: string;
  caption: string;
}

type ContentBlock = HeroBlock | TextBlock | FeaturesBlock | CtaBlock | TestimonialsBlock | ImageBlock;

const BLOCK_TYPES = [
  { value: "hero", label: "Hero", icon: LayoutTemplate },
  { value: "text", label: "Text", icon: Type },
  { value: "features", label: "Features Grid", icon: Grid3X3 },
  { value: "cta", label: "Call to Action", icon: MousePointerClick },
  { value: "testimonials", label: "Testimonials", icon: Quote },
  { value: "image", label: "Image", icon: ImageIcon },
] as const;

function createEmptyBlock(type: string): ContentBlock {
  switch (type) {
    case "hero":
      return { type: "hero", heading: "", subheading: "", ctaText: "", ctaLink: "", background: "#1d4ed8" };
    case "text":
      return { type: "text", content: "" };
    case "features":
      return { type: "features", items: [{ icon: "Star", title: "", description: "" }] };
    case "cta":
      return { type: "cta", heading: "", description: "", buttonText: "", buttonLink: "" };
    case "testimonials":
      return { type: "testimonials", items: [{ quote: "", author: "", role: "" }] };
    case "image":
      return { type: "image", url: "", alt: "", caption: "" };
    default:
      return { type: "text", content: "" };
  }
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

function HeroBlockEditor({ block, onChange }: { block: HeroBlock; onChange: (b: HeroBlock) => void }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Heading</Label>
        <Input
          data-testid="input-hero-heading"
          value={block.heading}
          onChange={(e) => onChange({ ...block, heading: e.target.value })}
          placeholder="Main heading"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Subheading</Label>
        <Input
          data-testid="input-hero-subheading"
          value={block.subheading}
          onChange={(e) => onChange({ ...block, subheading: e.target.value })}
          placeholder="Supporting text"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>CTA Button Text</Label>
          <Input
            data-testid="input-hero-cta-text"
            value={block.ctaText}
            onChange={(e) => onChange({ ...block, ctaText: e.target.value })}
            placeholder="Get Started"
          />
        </div>
        <div className="space-y-1.5">
          <Label>CTA Link</Label>
          <Input
            data-testid="input-hero-cta-link"
            value={block.ctaLink}
            onChange={(e) => onChange({ ...block, ctaLink: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Background Color</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={block.background}
            onChange={(e) => onChange({ ...block, background: e.target.value })}
            className="h-9 w-12 rounded-md border cursor-pointer"
            data-testid="input-hero-background"
          />
          <Input
            value={block.background}
            onChange={(e) => onChange({ ...block, background: e.target.value })}
            className="flex-1"
            placeholder="#1d4ed8"
          />
        </div>
      </div>
    </div>
  );
}

function TextBlockEditor({ block, onChange }: { block: TextBlock; onChange: (b: TextBlock) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>Content (Markdown supported)</Label>
      <Textarea
        data-testid="input-text-content"
        value={block.content}
        onChange={(e) => onChange({ ...block, content: e.target.value })}
        placeholder="Write your content here..."
        className="min-h-[120px] resize-y"
      />
    </div>
  );
}

function FeaturesBlockEditor({ block, onChange }: { block: FeaturesBlock; onChange: (b: FeaturesBlock) => void }) {
  const addItem = () => {
    onChange({ ...block, items: [...block.items, { icon: "Star", title: "", description: "" }] });
  };
  const removeItem = (idx: number) => {
    onChange({ ...block, items: block.items.filter((_, i) => i !== idx) });
  };
  const updateItem = (idx: number, updates: Partial<FeatureItem>) => {
    onChange({ ...block, items: block.items.map((item, i) => (i === idx ? { ...item, ...updates } : item)) });
  };

  return (
    <div className="space-y-3">
      {block.items.map((item, idx) => (
        <div key={idx} className="p-3 rounded-md border space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground font-medium">Feature {idx + 1}</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => removeItem(idx)}
              data-testid={`button-remove-feature-${idx}`}
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Icon Name</Label>
              <Input
                data-testid={`input-feature-icon-${idx}`}
                value={item.icon}
                onChange={(e) => updateItem(idx, { icon: e.target.value })}
                placeholder="Star"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Title</Label>
              <Input
                data-testid={`input-feature-title-${idx}`}
                value={item.title}
                onChange={(e) => updateItem(idx, { title: e.target.value })}
                placeholder="Feature title"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea
              data-testid={`input-feature-desc-${idx}`}
              value={item.description}
              onChange={(e) => updateItem(idx, { description: e.target.value })}
              placeholder="Feature description"
              className="resize-none"
            />
          </div>
        </div>
      ))}
      <Button variant="outline" className="w-full" onClick={addItem} data-testid="button-add-feature">
        <Plus className="h-4 w-4 mr-2" />
        Add Feature
      </Button>
    </div>
  );
}

function CtaBlockEditor({ block, onChange }: { block: CtaBlock; onChange: (b: CtaBlock) => void }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Heading</Label>
        <Input
          data-testid="input-cta-heading"
          value={block.heading}
          onChange={(e) => onChange({ ...block, heading: e.target.value })}
          placeholder="Ready to get started?"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          data-testid="input-cta-description"
          value={block.description}
          onChange={(e) => onChange({ ...block, description: e.target.value })}
          placeholder="Supporting description text"
          className="resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Button Text</Label>
          <Input
            data-testid="input-cta-button-text"
            value={block.buttonText}
            onChange={(e) => onChange({ ...block, buttonText: e.target.value })}
            placeholder="Sign Up Now"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Button Link</Label>
          <Input
            data-testid="input-cta-button-link"
            value={block.buttonLink}
            onChange={(e) => onChange({ ...block, buttonLink: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>
    </div>
  );
}

function TestimonialsBlockEditor({ block, onChange }: { block: TestimonialsBlock; onChange: (b: TestimonialsBlock) => void }) {
  const addItem = () => {
    onChange({ ...block, items: [...block.items, { quote: "", author: "", role: "" }] });
  };
  const removeItem = (idx: number) => {
    onChange({ ...block, items: block.items.filter((_, i) => i !== idx) });
  };
  const updateItem = (idx: number, updates: Partial<TestimonialItem>) => {
    onChange({ ...block, items: block.items.map((item, i) => (i === idx ? { ...item, ...updates } : item)) });
  };

  return (
    <div className="space-y-3">
      {block.items.map((item, idx) => (
        <div key={idx} className="p-3 rounded-md border space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground font-medium">Testimonial {idx + 1}</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => removeItem(idx)}
              data-testid={`button-remove-testimonial-${idx}`}
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </Button>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Quote</Label>
            <Textarea
              data-testid={`input-testimonial-quote-${idx}`}
              value={item.quote}
              onChange={(e) => updateItem(idx, { quote: e.target.value })}
              placeholder="What the customer said..."
              className="resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Author</Label>
              <Input
                data-testid={`input-testimonial-author-${idx}`}
                value={item.author}
                onChange={(e) => updateItem(idx, { author: e.target.value })}
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Role</Label>
              <Input
                data-testid={`input-testimonial-role-${idx}`}
                value={item.role}
                onChange={(e) => updateItem(idx, { role: e.target.value })}
                placeholder="CEO, Acme Inc."
              />
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" className="w-full" onClick={addItem} data-testid="button-add-testimonial">
        <Plus className="h-4 w-4 mr-2" />
        Add Testimonial
      </Button>
    </div>
  );
}

function ImageBlockEditor({ block, onChange }: { block: ImageBlock; onChange: (b: ImageBlock) => void }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Image URL</Label>
        <Input
          data-testid="input-image-url"
          value={block.url}
          onChange={(e) => onChange({ ...block, url: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Alt Text</Label>
        <Input
          data-testid="input-image-alt"
          value={block.alt}
          onChange={(e) => onChange({ ...block, alt: e.target.value })}
          placeholder="Descriptive alt text"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Caption</Label>
        <Input
          data-testid="input-image-caption"
          value={block.caption}
          onChange={(e) => onChange({ ...block, caption: e.target.value })}
          placeholder="Optional caption"
        />
      </div>
    </div>
  );
}

function BlockEditor({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
  switch (block.type) {
    case "hero":
      return <HeroBlockEditor block={block} onChange={onChange} />;
    case "text":
      return <TextBlockEditor block={block} onChange={onChange} />;
    case "features":
      return <FeaturesBlockEditor block={block} onChange={onChange} />;
    case "cta":
      return <CtaBlockEditor block={block} onChange={onChange} />;
    case "testimonials":
      return <TestimonialsBlockEditor block={block} onChange={onChange} />;
    case "image":
      return <ImageBlockEditor block={block} onChange={onChange} />;
    default:
      return null;
  }
}

function BlockPreview({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "hero":
      return (
        <div
          className="p-8 rounded-md text-center text-white"
          style={{ backgroundColor: block.background || "#1d4ed8" }}
        >
          <h2 className="text-2xl font-bold mb-2">{block.heading || "Hero Heading"}</h2>
          <p className="text-sm opacity-90 mb-4">{block.subheading || "Subheading text"}</p>
          {block.ctaText && (
            <span className="inline-block px-4 py-2 bg-white/20 rounded-md text-sm font-medium">
              {block.ctaText}
            </span>
          )}
        </div>
      );
    case "text":
      return (
        <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
          {block.content ? (
            block.content.split("\n").map((line, i) => <p key={i} className="mb-1">{line}</p>)
          ) : (
            <p className="text-muted-foreground italic">Empty text block</p>
          )}
        </div>
      );
    case "features":
      return (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {block.items.map((item, i) => (
              <div key={i} className="p-3 rounded-md border text-center">
                <div className="text-xs text-muted-foreground mb-1">{item.icon}</div>
                <div className="text-sm font-medium">{item.title || "Feature"}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "cta":
      return (
        <div className="p-6 rounded-md bg-primary/5 text-center">
          <h3 className="text-lg font-semibold mb-1">{block.heading || "CTA Heading"}</h3>
          <p className="text-sm text-muted-foreground mb-3">{block.description}</p>
          {block.buttonText && (
            <span className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              {block.buttonText}
            </span>
          )}
        </div>
      );
    case "testimonials":
      return (
        <div className="p-4 space-y-3">
          {block.items.map((item, i) => (
            <div key={i} className="p-3 rounded-md border">
              <p className="text-sm italic mb-2">"{item.quote || "Quote text..."}"</p>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">{item.author || "Author"}</span>
                {item.role && <span> - {item.role}</span>}
              </div>
            </div>
          ))}
        </div>
      );
    case "image":
      return (
        <div className="p-4 text-center">
          {block.url ? (
            <div>
              <img
                src={block.url}
                alt={block.alt}
                className="max-w-full h-auto rounded-md mx-auto max-h-48 object-cover"
              />
              {block.caption && <p className="text-xs text-muted-foreground mt-2">{block.caption}</p>}
            </div>
          ) : (
            <div className="p-8 rounded-md border-2 border-dashed">
              <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">No image URL set</p>
            </div>
          )}
        </div>
      );
    default:
      return null;
  }
}

export default function HudPages() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("settings");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const [formData, setFormData] = useState({ title: "", slug: "" });

  const [editSettings, setEditSettings] = useState<{
    title: string;
    slug: string;
    metaDescription: string;
    status: string;
    isHomepage: boolean;
  }>({ title: "", slug: "", metaDescription: "", status: "DRAFT", isHomepage: false });

  const [editBlocks, setEditBlocks] = useState<ContentBlock[]>([]);

  const pagesQuery = useQuery<Page[]>({
    queryKey: ["/api/admin/pages"],
  });

  const pageDetailQuery = useQuery<Page>({
    queryKey: ["/api/admin/pages", selectedPageId],
    enabled: !!selectedPageId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/admin/pages", {
        title: data.title,
        slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        content: "[]",
        status: "DRAFT",
        isHomepage: false,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      setCreateOpen(false);
      setFormData({ title: "", slug: "" });
      toast({ title: "Page created" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/pages/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      toast({ title: "Page updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/pages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
      setSelectedPageId(null);
      toast({ title: "Page deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const openDetail = useCallback((page: Page) => {
    setSelectedPageId(page.id);
    setActiveTab("settings");
    setEditSettings({
      title: page.title,
      slug: page.slug,
      metaDescription: page.metaDescription || "",
      status: page.status,
      isHomepage: page.isHomepage,
    });
    try {
      setEditBlocks(JSON.parse(page.content || "[]"));
    } catch {
      setEditBlocks([]);
    }
  }, []);

  const handleSaveSettings = () => {
    if (!selectedPageId) return;
    updateMutation.mutate({
      id: selectedPageId,
      data: {
        title: editSettings.title,
        slug: editSettings.slug,
        metaDescription: editSettings.metaDescription || null,
        status: editSettings.status,
        isHomepage: editSettings.isHomepage,
      },
    });
  };

  const handleSaveBlocks = () => {
    if (!selectedPageId) return;
    updateMutation.mutate({
      id: selectedPageId,
      data: {
        content: JSON.stringify(editBlocks),
      },
    });
  };

  const handleTogglePublish = () => {
    if (!selectedPageId) return;
    const newStatus = editSettings.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setEditSettings({ ...editSettings, status: newStatus });
    updateMutation.mutate({
      id: selectedPageId,
      data: { status: newStatus },
    });
  };

  const addBlock = (type: string) => {
    setEditBlocks([...editBlocks, createEmptyBlock(type)]);
  };

  const removeBlock = (idx: number) => {
    setEditBlocks(editBlocks.filter((_, i) => i !== idx));
  };

  const updateBlock = (idx: number, block: ContentBlock) => {
    setEditBlocks(editBlocks.map((b, i) => (i === idx ? block : b)));
  };

  const moveBlock = (idx: number, direction: "up" | "down") => {
    const newBlocks = [...editBlocks];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newBlocks.length) return;
    [newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]];
    setEditBlocks(newBlocks);
  };

  const pages = pagesQuery.data || [];
  const filteredPages = searchQuery
    ? pages.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : pages;

  const blockTypeInfo = (type: string) => BLOCK_TYPES.find((bt) => bt.value === type);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <FileText className="h-6 w-6 text-violet-500 dark:text-violet-400" />
            Pages
          </h1>
          <p className="text-muted-foreground text-sm mt-1" data-testid="text-page-subtitle">
            Build and manage your website pages
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-page">
              <Plus className="h-4 w-4 mr-2" />
              New Page
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-testid="dialog-create-page">
            <DialogHeader>
              <DialogTitle>Create Page</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="pageTitle">Title *</Label>
                <Input
                  id="pageTitle"
                  data-testid="input-page-title"
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormData({
                      title,
                      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
                    });
                  }}
                  required
                  placeholder="My New Page"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pageSlug">URL Slug</Label>
                <Input
                  id="pageSlug"
                  data-testid="input-page-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="my-new-page"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
                data-testid="button-submit-page"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Page
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          data-testid="input-search-pages"
          placeholder="Search pages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {pagesQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredPages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground" data-testid="text-empty-pages">
              {searchQuery ? "No pages match your search." : "No pages yet. Create your first page to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPages.map((page) => (
            <Card
              key={page.id}
              className="cursor-pointer hover-elevate transition-colors"
              data-testid={`card-page-${page.id}`}
              onClick={() => openDetail(page)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate flex items-center gap-1.5" data-testid={`text-page-name-${page.id}`}>
                      {page.isHomepage && <Home className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                      {page.title}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">/{page.slug}</p>
                  </div>
                  {statusBadge(page.status)}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span data-testid={`text-page-blocks-${page.id}`}>
                    {(() => {
                      try {
                        return JSON.parse(page.content || "[]").length;
                      } catch {
                        return 0;
                      }
                    })()}{" "}
                    blocks
                  </span>
                  <span data-testid={`text-page-date-${page.id}`}>
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={!!selectedPageId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPageId(null);
            setPreviewOpen(false);
          }
        }}
      >
        <SheetContent className="sm:max-w-2xl overflow-y-auto" data-testid="sheet-page-detail">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-500" />
              Page Editor
            </SheetTitle>
          </SheetHeader>

          {pageDetailQuery.isLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : pageDetailQuery.data ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="w-full">
                <TabsTrigger value="settings" data-testid="tab-page-settings" className="flex-1">
                  Settings
                </TabsTrigger>
                <TabsTrigger value="blocks" data-testid="tab-page-blocks" className="flex-1">
                  Blocks
                </TabsTrigger>
                <TabsTrigger value="preview" data-testid="tab-page-preview" className="flex-1">
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    data-testid="input-edit-page-title"
                    value={editSettings.title}
                    onChange={(e) => setEditSettings({ ...editSettings, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input
                    data-testid="input-edit-page-slug"
                    value={editSettings.slug}
                    onChange={(e) => setEditSettings({ ...editSettings, slug: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Meta Description</Label>
                  <Textarea
                    data-testid="input-edit-page-meta"
                    value={editSettings.metaDescription}
                    onChange={(e) => setEditSettings({ ...editSettings, metaDescription: e.target.value })}
                    placeholder="SEO meta description"
                    className="resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={editSettings.status}
                    onValueChange={(v) => setEditSettings({ ...editSettings, status: v })}
                  >
                    <SelectTrigger data-testid="select-page-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <Label htmlFor="homepage-toggle" className="cursor-pointer text-sm">Set as Homepage</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">This page will be the default landing page</p>
                  </div>
                  <Switch
                    id="homepage-toggle"
                    data-testid="switch-homepage"
                    checked={editSettings.isHomepage}
                    onCheckedChange={(checked) => setEditSettings({ ...editSettings, isHomepage: checked })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={editSettings.status === "PUBLISHED" ? "outline" : "default"}
                    className="flex-1"
                    onClick={handleTogglePublish}
                    disabled={updateMutation.isPending}
                    data-testid="button-toggle-publish"
                  >
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {editSettings.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                  </Button>
                </div>

                <Button
                  className="w-full"
                  data-testid="button-save-page-settings"
                  disabled={updateMutation.isPending}
                  onClick={handleSaveSettings}
                >
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Settings
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-600 dark:border-red-800 dark:text-red-400"
                  data-testid="button-delete-page"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (selectedPageId) deleteMutation.mutate(selectedPageId);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Page
                </Button>
              </TabsContent>

              <TabsContent value="blocks" className="space-y-4 mt-4">
                {editBlocks.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <LayoutTemplate className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground" data-testid="text-empty-blocks">
                        No blocks yet. Add your first content block below.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {editBlocks.map((block, idx) => {
                      const info = blockTypeInfo(block.type);
                      const Icon = info?.icon || FileText;
                      return (
                        <Card key={idx} data-testid={`card-block-${idx}`}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">
                                  {info?.label || block.type}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  disabled={idx === 0}
                                  onClick={() => moveBlock(idx, "up")}
                                  data-testid={`button-block-up-${idx}`}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  disabled={idx === editBlocks.length - 1}
                                  onClick={() => moveBlock(idx, "down")}
                                  data-testid={`button-block-down-${idx}`}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeBlock(idx)}
                                  data-testid={`button-block-remove-${idx}`}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                            <Separator />
                            <BlockEditor
                              block={block}
                              onChange={(updated) => updateBlock(idx, updated)}
                            />
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Add Block</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {BLOCK_TYPES.map((bt) => {
                      const Icon = bt.icon;
                      return (
                        <Button
                          key={bt.value}
                          variant="outline"
                          className="flex flex-col gap-1.5 h-auto py-3"
                          onClick={() => addBlock(bt.value)}
                          data-testid={`button-add-block-${bt.value}`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-xs">{bt.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  className="w-full"
                  data-testid="button-save-blocks"
                  disabled={updateMutation.isPending}
                  onClick={handleSaveBlocks}
                >
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Blocks
                </Button>
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <div className="rounded-md border overflow-hidden" data-testid="preview-container">
                  {editBlocks.length === 0 ? (
                    <div className="p-12 text-center">
                      <Eye className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Add blocks to see a preview of your page
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {editBlocks.map((block, idx) => (
                        <div key={idx} data-testid={`preview-block-${idx}`}>
                          <BlockPreview block={block} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
