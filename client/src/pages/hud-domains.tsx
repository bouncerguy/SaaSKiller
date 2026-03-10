import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Globe,
  Plus,
  Trash2,
  Star,
  Copy,
  Check,
  Server,
  ArrowRight,
  Info,
  ExternalLink,
} from "lucide-react";
import type { Domain } from "@shared/schema";

interface ServerInfo {
  serverIp: string;
  hostname: string;
  port: string;
}

export default function AdminDomains() {
  const { toast } = useToast();
  const [newDomain, setNewDomain] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const { data: domainsData, isLoading } = useQuery<Domain[]>({
    queryKey: ["/api/admin/domains"],
  });

  const { data: serverInfo } = useQuery<ServerInfo>({
    queryKey: ["/api/admin/server-info"],
  });

  const createMutation = useMutation({
    mutationFn: async (domain: string) => {
      const res = await apiRequest("POST", "/api/admin/domains", {
        domain,
        isPrimary: !domainsData?.length,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/domains"] });
      setNewDomain("");
      toast({ title: "Domain added" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/admin/domains/${id}`, { isPrimary: true });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/domains"] });
      toast({ title: "Primary domain updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/domains/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/domains"] });
      setDeleteId(null);
      toast({ title: "Domain removed" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDomain.trim()) {
      createMutation.mutate(newDomain.trim());
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(null), 2000);
  };

  const serverIp = serverInfo?.serverIp || "Loading...";
  const hostname = serverInfo?.hostname || "Loading...";

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-domains-title">
          Website & Domains
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your custom domains and view server connection details
        </p>
      </div>

      <Card className="overflow-visible">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            Server Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Server IP Address</Label>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 px-3 py-2 rounded-md bg-muted text-sm font-mono"
                  data-testid="text-server-ip"
                >
                  {serverIp}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  onClick={() => copyToClipboard(serverIp, "ip")}
                  data-testid="button-copy-ip"
                >
                  {copied === "ip" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Current Hostname</Label>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 px-3 py-2 rounded-md bg-muted text-sm font-mono truncate"
                  data-testid="text-hostname"
                >
                  {hostname}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  onClick={() => copyToClipboard(hostname, "hostname")}
                  data-testid="button-copy-hostname"
                >
                  {copied === "hostname" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-visible border-blue-200 dark:border-blue-900">
        <CardContent className="p-5">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">How to connect your custom domain</p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Add your domain name below (e.g., <code className="text-xs bg-muted px-1.5 py-0.5 rounded">app.yourbusiness.com</code>)</li>
                <li>
                  Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
                </li>
                <li>
                  Create an <strong>A record</strong> pointing to your server IP:
                  <div className="mt-1.5 p-2.5 rounded-md bg-muted font-mono text-xs space-y-0.5">
                    <div className="flex gap-8">
                      <span className="text-muted-foreground w-12">Type</span>
                      <span>A</span>
                    </div>
                    <div className="flex gap-8">
                      <span className="text-muted-foreground w-12">Name</span>
                      <span>@ <span className="text-muted-foreground">(or subdomain)</span></span>
                    </div>
                    <div className="flex gap-8">
                      <span className="text-muted-foreground w-12">Value</span>
                      <span className="text-primary font-semibold">{serverIp}</span>
                    </div>
                    <div className="flex gap-8">
                      <span className="text-muted-foreground w-12">TTL</span>
                      <span>Auto <span className="text-muted-foreground">(or 3600)</span></span>
                    </div>
                  </div>
                </li>
                <li>
                  Or create a <strong>CNAME record</strong> if using a subdomain:
                  <div className="mt-1.5 p-2.5 rounded-md bg-muted font-mono text-xs space-y-0.5">
                    <div className="flex gap-8">
                      <span className="text-muted-foreground w-12">Type</span>
                      <span>CNAME</span>
                    </div>
                    <div className="flex gap-8">
                      <span className="text-muted-foreground w-12">Name</span>
                      <span>app <span className="text-muted-foreground">(your subdomain)</span></span>
                    </div>
                    <div className="flex gap-8">
                      <span className="text-muted-foreground w-12">Value</span>
                      <span className="text-primary font-semibold">{hostname}</span>
                    </div>
                  </div>
                </li>
                <li>Wait for DNS propagation (usually 5–30 minutes, up to 48 hours)</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-visible">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Custom Domains
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleAddDomain} className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="domainInput">Domain Name</Label>
              <Input
                id="domainInput"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="app.yourbusiness.com"
                data-testid="input-domain"
              />
            </div>
            <Button
              type="submit"
              disabled={createMutation.isPending || !newDomain.trim()}
              data-testid="button-add-domain"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createMutation.isPending ? "Adding..." : "Add Domain"}
            </Button>
          </form>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-md border">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-16 ml-auto" />
                </div>
              ))}
            </div>
          ) : domainsData?.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Globe className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium" data-testid="text-no-domains">
                No custom domains yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add your first domain to start hosting on your own URL
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {domainsData?.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center gap-3 p-4 rounded-md border hover:bg-muted/30 transition-colors"
                  data-testid={`card-domain-${domain.id}`}
                >
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium font-mono" data-testid={`text-domain-${domain.id}`}>
                        {domain.domain}
                      </span>
                      {domain.isPrimary && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Star className="h-2.5 w-2.5" />
                          Primary
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!domain.isPrimary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setPrimaryMutation.mutate(domain.id)}
                        data-testid={`button-set-primary-${domain.id}`}
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Set Primary
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(domain.id)}
                      data-testid={`button-delete-domain-${domain.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-visible">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            Public Pages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your platform serves these public-facing pages. Once your domain is connected, they'll be accessible at your custom URL.
          </p>
          <div className="space-y-2">
            {[
              { path: "/book/:tenantSlug/:eventSlug", label: "Booking pages", desc: "Public scheduling for your event types" },
              { path: "/forms/:tenantSlug/:formSlug", label: "Form pages", desc: "Public form submissions" },
              { path: "/book/:tenantSlug", label: "Booking directory", desc: "Lists all active event types" },
            ].map((page) => (
              <div
                key={page.path}
                className="flex items-center justify-between gap-4 p-3 rounded-md bg-muted/40"
              >
                <div>
                  <p className="text-sm font-medium">{page.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{page.desc}</p>
                </div>
                <code className="text-xs font-mono text-muted-foreground flex-shrink-0 hidden sm:block">
                  {page.path}
                </code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Domain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this domain? You'll need to re-add it and update your DNS records if you want to use it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              data-testid="button-confirm-delete"
            >
              Remove Domain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
