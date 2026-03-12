import { useState, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MediaAsset } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Image,
  Plus,
  Search,
  Loader2,
  Trash2,
  FileText,
  FileVideo,
  FileAudio,
  File,
  FolderOpen,
  Copy,
  Check,
  ImageIcon,
  Upload,
  CloudUpload,
} from "lucide-react";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function FileTypeIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith("image/")) return <ImageIcon className={className} />;
  if (mimeType.startsWith("video/")) return <FileVideo className={className} />;
  if (mimeType.startsWith("audio/")) return <FileAudio className={className} />;
  if (mimeType === "application/pdf") return <FileText className={className} />;
  if (mimeType.includes("document") || mimeType.includes("word") || mimeType.includes("text"))
    return <FileText className={className} />;
  return <File className={className} />;
}

function parseTags(tagsJson: string | null): string[] {
  if (!tagsJson) return [];
  try {
    return JSON.parse(tagsJson);
  } catch {
    return [];
  }
}

export default function HudMedia() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    url: "",
    originalName: "",
    filename: "",
    mimeType: "image/png",
    sizeBytes: "",
    alt: "",
    tags: "",
    folder: "",
  });

  const [editData, setEditData] = useState({
    alt: "",
    tags: "",
    folder: "",
  });

  const mediaQueryUrl = (() => {
    const params = new URLSearchParams();
    if (activeFolder) params.set("folder", activeFolder);
    if (searchQuery) params.set("search", searchQuery);
    const qs = params.toString();
    return qs ? `/api/admin/media?${qs}` : "/api/admin/media";
  })();

  const mediaQuery = useQuery<MediaAsset[]>({
    queryKey: ["/api/admin/media", { folder: activeFolder, search: searchQuery }],
    queryFn: async () => {
      const res = await fetch(mediaQueryUrl, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load media");
      return res.json();
    },
  });

  const assetDetailQuery = useQuery<MediaAsset>({
    queryKey: ["/api/admin/media", selectedAssetId],
    enabled: !!selectedAssetId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const filename = data.filename || data.originalName || data.url.split("/").pop() || "file";
      const res = await apiRequest("POST", "/api/admin/media", {
        url: data.url,
        originalName: data.originalName || filename,
        filename,
        mimeType: data.mimeType,
        sizeBytes: parseInt(data.sizeBytes || "0", 10),
        alt: data.alt || null,
        tagsJson: data.tags
          ? JSON.stringify(data.tags.split(",").map((t) => t.trim()).filter(Boolean))
          : "[]",
        folder: data.folder || "",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      setCreateOpen(false);
      setFormData({ url: "", originalName: "", filename: "", mimeType: "image/png", sizeBytes: "", alt: "", tags: "", folder: "" });
      toast({ title: "Media asset added" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList | File[]) => {
      const formData = new FormData();
      if (files.length === 1) {
        formData.append("file", files[0]);
        if (activeFolder) formData.append("folder", activeFolder);
        const res = await fetch("/api/admin/media/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: "Upload failed" }));
          throw new Error(err.message);
        }
        return res.json();
      } else {
        for (const file of Array.from(files)) {
          formData.append("files", file);
        }
        if (activeFolder) formData.append("folder", activeFolder);
        const res = await fetch("/api/admin/media/upload-multiple", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: "Upload failed" }));
          throw new Error(err.message);
        }
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      toast({ title: "File(s) uploaded successfully" });
    },
    onError: (e: Error) => {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/media/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      toast({ title: "Asset updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/media/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      setSelectedAssetId(null);
      toast({ title: "Asset deleted" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const assets = mediaQuery.data || [];
  const detail = assetDetailQuery.data;

  const folders = useMemo(() => {
    const folderSet = new Set<string>();
    assets.forEach((a) => {
      if (a.folder && a.folder.trim()) folderSet.add(a.folder.trim());
    });
    return Array.from(folderSet).sort();
  }, [assets]);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    });
  };

  const openDetail = (asset: MediaAsset) => {
    setSelectedAssetId(asset.id);
    setEditData({
      alt: asset.alt || "",
      tags: parseTags(asset.tagsJson).join(", "),
      folder: asset.folder || "",
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      uploadMutation.mutate(e.dataTransfer.files);
    }
  }, [uploadMutation]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadMutation.mutate(e.target.files);
      e.target.value = "";
    }
  }, [uploadMutation]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <Image className="h-6 w-6 text-pink-500 dark:text-pink-400" />
            Media Library
          </h1>
          <p className="text-muted-foreground text-sm mt-1" data-testid="text-page-subtitle">
            Manage your digital assets and files
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            data-testid="input-file-upload"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            data-testid="button-upload-file"
          >
            {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload File
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-media" className="bg-pink-500 hover:bg-pink-600 text-white border-pink-600">
                <Plus className="h-4 w-4 mr-2" />
                Add by URL
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" data-testid="dialog-add-media">
              <DialogHeader>
                <DialogTitle>Add Media Asset by URL</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate(formData);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="mediaUrl">URL *</Label>
                  <Input
                    id="mediaUrl"
                    data-testid="input-media-url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com/image.png"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mediaOriginalName">Original Name *</Label>
                  <Input
                    id="mediaOriginalName"
                    data-testid="input-media-original-name"
                    value={formData.originalName}
                    onChange={(e) => setFormData({ ...formData, originalName: e.target.value })}
                    placeholder="photo.png"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="mediaMimeType">MIME Type</Label>
                    <Input
                      id="mediaMimeType"
                      data-testid="input-media-mime-type"
                      value={formData.mimeType}
                      onChange={(e) => setFormData({ ...formData, mimeType: e.target.value })}
                      placeholder="image/png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mediaSizeBytes">Size (bytes)</Label>
                    <Input
                      id="mediaSizeBytes"
                      type="number"
                      min="0"
                      data-testid="input-media-size"
                      value={formData.sizeBytes}
                      onChange={(e) => setFormData({ ...formData, sizeBytes: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mediaAlt">Alt Text</Label>
                  <Input
                    id="mediaAlt"
                    data-testid="input-media-alt"
                    value={formData.alt}
                    onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                    placeholder="Describe the asset"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mediaTags">Tags (comma-separated)</Label>
                  <Input
                    id="mediaTags"
                    data-testid="input-media-tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="logo, branding, header"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mediaFolder">Folder</Label>
                  <Input
                    id="mediaFolder"
                    data-testid="input-media-folder"
                    value={formData.folder}
                    onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                    placeholder="e.g. images, documents"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white border-pink-600"
                  disabled={createMutation.isPending}
                  data-testid="button-submit-media"
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add Asset
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-pink-400 bg-pink-50 dark:bg-pink-950/20"
            : "border-muted-foreground/20 hover:border-pink-300 dark:hover:border-pink-700"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        data-testid="dropzone-upload"
      >
        <CloudUpload className={`h-10 w-10 mx-auto mb-2 ${isDragging ? "text-pink-500" : "text-muted-foreground/40"}`} />
        <p className="text-sm text-muted-foreground">
          {uploadMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </span>
          ) : isDragging ? (
            "Drop files here to upload"
          ) : (
            "Drag & drop files here, or use the Upload button above"
          )}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">Max 50MB per file</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by filename or tags..."
            className="pl-10"
            data-testid="input-search-media"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant={activeFolder === null ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFolder(null)}
            data-testid="button-folder-all"
            className={activeFolder === null ? "bg-pink-500 hover:bg-pink-600 text-white border-pink-600" : ""}
          >
            All
          </Button>
          {folders.map((folder) => (
            <Button
              key={folder}
              variant={activeFolder === folder ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFolder(folder)}
              data-testid={`button-folder-${folder}`}
              className={activeFolder === folder ? "bg-pink-500 hover:bg-pink-600 text-white border-pink-600" : ""}
            >
              <FolderOpen className="h-3 w-3 mr-1" />
              {folder}
            </Button>
          ))}
        </div>
      </div>

      {mediaQuery.isLoading ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Image className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground" data-testid="text-empty-media">
              {searchQuery || activeFolder
                ? "No assets match your filters"
                : "No media assets yet. Upload a file or add one by URL to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((asset) => (
            <Card
              key={asset.id}
              className="cursor-pointer hover:border-pink-300 dark:hover:border-pink-700 transition-colors"
              data-testid={`card-media-${asset.id}`}
              onClick={() => openDetail(asset)}
            >
              <CardContent className="p-0">
                <div className="aspect-square relative flex items-center justify-center bg-muted/30 rounded-t-md overflow-hidden">
                  {isImageMime(asset.mimeType) ? (
                    <img
                      src={asset.url}
                      alt={asset.alt || asset.originalName}
                      className="w-full h-full object-cover"
                      data-testid={`img-preview-${asset.id}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).parentElement!.querySelector(".fallback-icon")?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  {!isImageMime(asset.mimeType) && (
                    <FileTypeIcon mimeType={asset.mimeType} className="h-12 w-12 text-muted-foreground/50" />
                  )}
                  {isImageMime(asset.mimeType) && (
                    <FileTypeIcon mimeType={asset.mimeType} className="fallback-icon hidden h-12 w-12 text-muted-foreground/50 absolute" />
                  )}
                </div>
                <div className="p-3 space-y-1.5">
                  <div className="font-medium text-xs truncate" data-testid={`text-media-name-${asset.id}`}>
                    {asset.originalName}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-muted-foreground">{formatFileSize(asset.sizeBytes)}</span>
                    {asset.folder && (
                      <Badge variant="outline" className="text-[10px] border-pink-300 text-pink-600 dark:text-pink-400">
                        {asset.folder}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={!!selectedAssetId} onOpenChange={(open) => { if (!open) setSelectedAssetId(null); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto" data-testid="sheet-media-detail">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-pink-500" />
              Asset Details
            </SheetTitle>
          </SheetHeader>
          {assetDetailQuery.isLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : detail ? (
            <div className="space-y-4 mt-6">
              {isImageMime(detail.mimeType) ? (
                <div className="rounded-md overflow-hidden border bg-muted/30">
                  <img
                    src={detail.url}
                    alt={detail.alt || detail.originalName}
                    className="w-full max-h-64 object-contain"
                    data-testid="img-detail-preview"
                  />
                </div>
              ) : (
                <div className="rounded-md border bg-muted/30 py-10 flex flex-col items-center gap-2">
                  <FileTypeIcon mimeType={detail.mimeType} className="h-16 w-16 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground">{detail.mimeType}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Filename</span>
                  <p className="font-medium truncate" data-testid="text-detail-filename">{detail.filename}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Original Name</span>
                  <p className="font-medium truncate" data-testid="text-detail-original-name">{detail.originalName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">MIME Type</span>
                  <p className="font-medium" data-testid="text-detail-mime">{detail.mimeType}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Size</span>
                  <p className="font-medium" data-testid="text-detail-size">{formatFileSize(detail.sizeBytes)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs">Uploaded</span>
                  <p className="font-medium" data-testid="text-detail-date">
                    {new Date(detail.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={detail.url}
                    className="text-xs"
                    data-testid="input-detail-url"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyUrl(detail.url)}
                    data-testid="button-copy-url"
                  >
                    {copiedUrl ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Alt Text</Label>
                <Input
                  data-testid="input-edit-alt"
                  value={editData.alt}
                  onChange={(e) => setEditData({ ...editData, alt: e.target.value })}
                  placeholder="Describe the asset"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Tags (comma-separated)</Label>
                <Input
                  data-testid="input-edit-tags"
                  value={editData.tags}
                  onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                  placeholder="logo, branding"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Folder</Label>
                <Input
                  data-testid="input-edit-folder"
                  value={editData.folder}
                  onChange={(e) => setEditData({ ...editData, folder: e.target.value })}
                  placeholder="images"
                />
              </div>

              <Button
                className="w-full bg-pink-500 hover:bg-pink-600 text-white border-pink-600"
                data-testid="button-save-media"
                disabled={updateMutation.isPending}
                onClick={() => {
                  if (!selectedAssetId) return;
                  updateMutation.mutate({
                    id: selectedAssetId,
                    data: {
                      alt: editData.alt || null,
                      tagsJson: editData.tags
                        ? JSON.stringify(editData.tags.split(",").map((t) => t.trim()).filter(Boolean))
                        : "[]",
                      folder: editData.folder || "",
                    },
                  });
                }}
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-600"
                data-testid="button-delete-media"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (selectedAssetId) deleteMutation.mutate(selectedAssetId);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Asset
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
