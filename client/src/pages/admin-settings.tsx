import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Save, Globe, Palette, Building2, Image } from "lucide-react";
import type { Tenant } from "@shared/schema";

export default function AdminSettings() {
  const { toast } = useToast();

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ["/api/admin/tenant"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", "/api/admin/tenant", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenant"] });
      toast({ title: "Settings saved" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      name: formData.get("name") as string,
      brandColor: formData.get("brandColor") as string,
      timezone: formData.get("timezone") as string,
      logoUrl: formData.get("logoUrl") as string || undefined,
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-settings-title">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure your organization branding and preferences
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="overflow-visible">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={tenant?.name || ""}
                  placeholder="Your organization name"
                  data-testid="input-tenant-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoUrl" className="flex items-center gap-1.5">
                  <Image className="h-3.5 w-3.5 text-muted-foreground" />
                  Logo URL
                </Label>
                <Input
                  id="logoUrl"
                  name="logoUrl"
                  defaultValue={tenant?.logoUrl || ""}
                  placeholder="https://example.com/logo.png"
                  data-testid="input-logo-url"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-visible">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="brandColor">Brand Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="brandColor"
                    name="brandColor"
                    defaultValue={tenant?.brandColor || "#5b4cdb"}
                    className="w-10 h-10 rounded-md cursor-pointer border-0 bg-transparent"
                    data-testid="input-brand-color"
                  />
                  <Input
                    defaultValue={tenant?.brandColor || "#5b4cdb"}
                    className="flex-1 font-mono text-sm"
                    readOnly
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-visible">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Localization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="timezone">Default Timezone</Label>
                <Input
                  id="timezone"
                  name="timezone"
                  defaultValue={tenant?.timezone || "America/New_York"}
                  placeholder="America/New_York"
                  data-testid="input-timezone"
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-settings">
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      )}
    </div>
  );
}
