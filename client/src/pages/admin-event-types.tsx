import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Clock, Video, Phone, MapPin, Settings, Copy, ExternalLink, Calendar, Check, Code } from "lucide-react";
import type { EventType } from "@shared/schema";

const locationIcons: Record<string, typeof Video> = {
  VIDEO: Video,
  PHONE: Phone,
  IN_PERSON: MapPin,
  CUSTOM: Settings,
};

const locationLabels: Record<string, string> = {
  VIDEO: "Video Call",
  PHONE: "Phone Call",
  IN_PERSON: "In Person",
  CUSTOM: "Custom",
};

export default function AdminEventTypes() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const { toast } = useToast();

  const { data: eventTypes, isLoading } = useQuery<EventType[]>({
    queryKey: ["/api/admin/event-types"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/admin/event-types", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/event-types"] });
      setIsOpen(false);
      toast({ title: "Event type created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown> & { id: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/event-types/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/event-types"] });
      setEditingEvent(null);
      toast({ title: "Event type updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/event-types/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/event-types"] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      slug: (formData.get("title") as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      description: formData.get("description") as string || undefined,
      durationMinutes: parseInt(formData.get("durationMinutes") as string) || 30,
      locationType: formData.get("locationType") as string || "VIDEO",
      locationValue: formData.get("locationValue") as string || undefined,
      color: formData.get("color") as string || "#5b4cdb",
    };

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getBookingUrl = (slug: string) =>
    `${window.location.origin}/book/default/${slug}`;

  const getEmbedSnippet = (slug: string) =>
    `<iframe src="${window.location.origin}/book/default/${slug}" style="width:100%;height:700px;border:none;border-radius:8px;" title="Book a meeting"></iframe>`;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap" data-testid="header-event-types">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-event-types-title">Event Types</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage your scheduling event types
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-event-type">
              <Plus className="h-4 w-4 mr-2" />
              New Event Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Event Type</DialogTitle>
            </DialogHeader>
            <EventTypeForm
              onSubmit={handleSubmit}
              isPending={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-52" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : eventTypes?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium" data-testid="text-no-event-types">
              No event types yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Create your first event type to start accepting bookings
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventTypes?.map((et) => {
            const LocationIcon = locationIcons[et.locationType] || Video;
            return (
              <Card key={et.id} data-testid={`card-event-type-${et.id}`} className="overflow-visible">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: (et.color || "#5b4cdb") + "15" }}
                      >
                        <Calendar className="h-5 w-5" style={{ color: et.color || "#5b4cdb" }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-[15px] truncate" data-testid={`text-event-title-${et.id}`}>
                          {et.title}
                        </h3>
                        {et.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                            {et.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {et.durationMinutes} min
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <LocationIcon className="h-3 w-3" />
                            {locationLabels[et.locationType]}
                          </span>
                          <Badge
                            variant={et.isActive ? "secondary" : "outline"}
                            className="text-[11px]"
                          >
                            {et.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={et.isActive}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: et.id, isActive: checked })}
                      data-testid={`switch-active-${et.id}`}
                    />
                  </div>
                  <div className="flex items-center gap-1 mt-4 pt-4 border-t flex-wrap" data-testid={`actions-event-${et.id}`}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-share-${et.id}`}
                        >
                          <Code className="h-3.5 w-3.5 mr-1.5" />
                          Share / Embed
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-96 p-0" align="start">
                        <Tabs defaultValue="link" className="w-full">
                          <TabsList className="w-full rounded-none border-b bg-transparent h-auto p-0">
                            <TabsTrigger value="link" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-2.5 text-xs">
                              Booking URL
                            </TabsTrigger>
                            <TabsTrigger value="embed" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-2.5 text-xs">
                              Embed Code
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="link" className="p-3 mt-0">
                            <p className="text-xs text-muted-foreground mb-2">Share this link so people can book with you</p>
                            <div className="flex items-center gap-2">
                              <Input
                                readOnly
                                value={getBookingUrl(et.slug)}
                                className="text-xs h-8 font-mono"
                                data-testid={`input-booking-url-${et.id}`}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 flex-shrink-0"
                                onClick={() => copyToClipboard(getBookingUrl(et.slug), `url-${et.id}`)}
                                data-testid={`button-copy-url-${et.id}`}
                              >
                                {copiedField === `url-${et.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                          </TabsContent>
                          <TabsContent value="embed" className="p-3 mt-0">
                            <p className="text-xs text-muted-foreground mb-2">Paste this into your website's HTML</p>
                            <div className="relative">
                              <pre className="text-[11px] font-mono bg-muted p-2.5 rounded-md overflow-x-auto whitespace-pre-wrap break-all leading-relaxed" data-testid={`text-embed-code-${et.id}`}>
                                {getEmbedSnippet(et.slug)}
                              </pre>
                              <Button
                                size="sm"
                                variant="outline"
                                className="absolute top-1.5 right-1.5 h-7 px-2"
                                onClick={() => copyToClipboard(getEmbedSnippet(et.slug), `embed-${et.id}`)}
                                data-testid={`button-copy-embed-${et.id}`}
                              >
                                {copiedField === `embed-${et.id}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/book/default/${et.slug}`, "_blank")}
                      data-testid={`button-preview-${et.id}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingEvent(et)}
                      data-testid={`button-edit-${et.id}`}
                    >
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event Type</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <EventTypeForm
              defaultValues={editingEvent}
              onSubmit={handleSubmit}
              isPending={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventTypeForm({
  defaultValues,
  onSubmit,
  isPending,
}: {
  defaultValues?: EventType;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={defaultValues?.title || ""}
          placeholder="e.g., 30 Minute Meeting"
          required
          data-testid="input-event-title"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description || ""}
          placeholder="Brief description of this meeting type"
          data-testid="input-event-description"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="durationMinutes">Duration</Label>
          <Select name="durationMinutes" defaultValue={String(defaultValues?.durationMinutes || 30)}>
            <SelectTrigger data-testid="select-duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
              <SelectItem value="90">90 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="locationType">Location</Label>
          <Select name="locationType" defaultValue={defaultValues?.locationType || "VIDEO"}>
            <SelectTrigger data-testid="select-location">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VIDEO">Video Call</SelectItem>
              <SelectItem value="PHONE">Phone Call</SelectItem>
              <SelectItem value="IN_PERSON">In Person</SelectItem>
              <SelectItem value="CUSTOM">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="locationValue">Location Details</Label>
        <Input
          id="locationValue"
          name="locationValue"
          defaultValue={defaultValues?.locationValue || ""}
          placeholder="e.g., Zoom link, phone number, or address"
          data-testid="input-location-value"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            id="color"
            name="color"
            defaultValue={defaultValues?.color || "#5b4cdb"}
            className="w-9 h-9 rounded-md cursor-pointer border-0 bg-transparent"
            data-testid="input-color"
          />
          <span className="text-xs text-muted-foreground">Choose a color for this event type</span>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isPending} data-testid="button-save-event-type">
        {isPending ? "Saving..." : defaultValues ? "Update Event Type" : "Create Event Type"}
      </Button>
    </form>
  );
}
