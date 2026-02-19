import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Clock, Video, Phone, MapPin, Settings, Copy, ExternalLink } from "lucide-react";
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
      color: formData.get("color") as string || "#1d4ed8",
    };

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const copyBookingLink = (slug: string) => {
    const url = `${window.location.origin}/book/default/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard" });
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
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
              <CardContent className="p-5">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : eventTypes?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground" data-testid="text-no-event-types">
              No event types yet. Create your first one!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventTypes?.map((et) => {
            const LocationIcon = locationIcons[et.locationType] || Video;
            return (
              <Card key={et.id} data-testid={`card-event-type-${et.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className="w-1 h-12 rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: et.color || "#1d4ed8" }}
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm truncate" data-testid={`text-event-title-${et.id}`}>
                          {et.title}
                        </h3>
                        {et.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {et.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {et.durationMinutes}m
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <LocationIcon className="h-3 w-3" />
                            {locationLabels[et.locationType]}
                          </span>
                          <Badge variant={et.isActive ? "secondary" : "outline"} className="text-xs">
                            {et.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Switch
                        checked={et.isActive}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: et.id, isActive: checked })}
                        data-testid={`switch-active-${et.id}`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyBookingLink(et.slug)}
                      data-testid={`button-copy-link-${et.id}`}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Link
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/book/default/${et.slug}`, "_blank")}
                      data-testid={`button-preview-${et.id}`}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
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
    <form onSubmit={onSubmit} className="space-y-4">
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
          <Label htmlFor="durationMinutes">Duration (minutes)</Label>
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
        <div className="flex items-center gap-2">
          <input
            type="color"
            id="color"
            name="color"
            defaultValue={defaultValues?.color || "#1d4ed8"}
            className="w-8 h-8 rounded cursor-pointer border-0"
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
