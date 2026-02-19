import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Copy, Code, ExternalLink, Layout, MessageSquare, Maximize2, CheckCircle2 } from "lucide-react";
import type { EventType } from "@shared/schema";

export default function AdminEmbed() {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: eventTypes, isLoading } = useQuery<EventType[]>({
    queryKey: ["/api/admin/event-types"],
  });

  const selectedEvent = eventTypes?.find((e) => e.id === selectedEventId);
  const baseUrl = window.location.origin;
  const tenantSlug = "default";

  const inlineSnippet = selectedEvent
    ? `<div id="calendalite-inline"></div>
<script src="${baseUrl}/embed.js"></script>
<script>
  CalendaLite.init({
    tenantSlug: "${tenantSlug}",
    eventTypeSlug: "${selectedEvent.slug}",
    target: "#calendalite-inline",
    mode: "inline"
  });
</script>`
    : "";

  const popupSnippet = selectedEvent
    ? `<a href="#" id="calendalite-link">Schedule a meeting</a>
<script src="${baseUrl}/embed.js"></script>
<script>
  CalendaLite.init({
    tenantSlug: "${tenantSlug}",
    eventTypeSlug: "${selectedEvent.slug}",
    trigger: "#calendalite-link",
    mode: "popup"
  });
</script>`
    : "";

  const floatingSnippet = selectedEvent
    ? `<script src="${baseUrl}/embed.js"></script>
<script>
  CalendaLite.init({
    tenantSlug: "${tenantSlug}",
    eventTypeSlug: "${selectedEvent.slug}",
    mode: "floating",
    buttonText: "Book a Meeting",
    buttonColor: "${selectedEvent.color || "#5b4cdb"}"
  });
</script>`
    : "";

  const iframeSnippet = selectedEvent
    ? `<iframe
  src="${baseUrl}/book/${tenantSlug}/${selectedEvent.slug}"
  style="width: 100%; height: 700px; border: none; border-radius: 8px;"
  loading="lazy"
></iframe>`
    : "";

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-embed-title">Embed</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add scheduling to your website with embed snippets
        </p>
      </div>

      <Card className="overflow-visible">
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label>Select Event Type</Label>
            {isLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger data-testid="select-embed-event">
                  <SelectValue placeholder="Choose an event type..." />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes?.filter((e) => e.isActive).map((et) => (
                    <SelectItem key={et.id} value={et.id}>
                      {et.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedEvent && (
            <div className="flex items-center gap-3 p-3.5 rounded-md bg-muted/50">
              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate flex-1 font-mono text-muted-foreground">
                {baseUrl}/book/{tenantSlug}/{selectedEvent.slug}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(`${baseUrl}/book/${tenantSlug}/${selectedEvent.slug}`, "direct-link")}
                className="flex-shrink-0"
                data-testid="button-copy-direct-link"
              >
                {copiedId === "direct-link" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEvent && (
        <Tabs defaultValue="inline">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="inline" data-testid="tab-inline">
              <Layout className="h-3.5 w-3.5 mr-1.5" />
              Inline
            </TabsTrigger>
            <TabsTrigger value="popup" data-testid="tab-popup">
              <Maximize2 className="h-3.5 w-3.5 mr-1.5" />
              Popup
            </TabsTrigger>
            <TabsTrigger value="floating" data-testid="tab-floating">
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              Floating
            </TabsTrigger>
            <TabsTrigger value="iframe" data-testid="tab-iframe">
              <Code className="h-3.5 w-3.5 mr-1.5" />
              iFrame
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inline" className="mt-4">
            <EmbedCard
              id="inline-embed"
              title="Inline Embed"
              description="Embed the booking widget directly into your page content."
              code={inlineSnippet}
              copiedId={copiedId}
              onCopy={() => copyToClipboard(inlineSnippet, "inline-embed")}
            />
          </TabsContent>

          <TabsContent value="popup" className="mt-4">
            <EmbedCard
              id="popup-modal"
              title="Popup Modal"
              description="Open the booking widget in a modal when a link or button is clicked."
              code={popupSnippet}
              copiedId={copiedId}
              onCopy={() => copyToClipboard(popupSnippet, "popup-modal")}
            />
          </TabsContent>

          <TabsContent value="floating" className="mt-4">
            <EmbedCard
              id="floating-widget"
              title="Floating Widget"
              description="Add a floating button that opens the booking widget."
              code={floatingSnippet}
              copiedId={copiedId}
              onCopy={() => copyToClipboard(floatingSnippet, "floating-widget")}
            />
          </TabsContent>

          <TabsContent value="iframe" className="mt-4">
            <EmbedCard
              id="iframe-fallback"
              title="iFrame Fallback"
              description="Simple iframe embed for maximum compatibility."
              code={iframeSnippet}
              copiedId={copiedId}
              onCopy={() => copyToClipboard(iframeSnippet, "iframe-fallback")}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function EmbedCard({
  id,
  title,
  description,
  code,
  copiedId,
  onCopy,
}: {
  id: string;
  title: string;
  description: string;
  code: string;
  copiedId: string | null;
  onCopy: () => void;
}) {
  return (
    <Card className="overflow-visible">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <pre className="bg-muted/40 rounded-md p-4 text-xs overflow-x-auto font-mono leading-relaxed border">
            <code>{code}</code>
          </pre>
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2"
            onClick={onCopy}
            data-testid={`button-copy-${id}`}
          >
            {copiedId === id ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-chart-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
