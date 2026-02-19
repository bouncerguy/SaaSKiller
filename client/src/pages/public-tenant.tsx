import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Video, Phone, MapPin, Globe, ArrowRight, CalendarIcon } from "lucide-react";
import type { EventType, Tenant } from "@shared/schema";

const locationIcons: Record<string, typeof Video> = {
  VIDEO: Video,
  PHONE: Phone,
  IN_PERSON: MapPin,
  CUSTOM: Globe,
};

const locationLabels: Record<string, string> = {
  VIDEO: "Video Call",
  PHONE: "Phone Call",
  IN_PERSON: "In Person",
  CUSTOM: "Custom",
};

export default function PublicTenant() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  const { data, isLoading } = useQuery<{ tenant: Tenant; eventTypes: EventType[] }>({
    queryKey: ["/api/public", tenantSlug],
  });

  const tenant = data?.tenant;
  const eventTypes = data?.eventTypes || [];
  const brandColor = tenant?.brandColor || "#1d4ed8";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold" data-testid="text-tenant-not-found">
              Organization Not Found
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              This scheduling page doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          {tenant.logoUrl && (
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="h-10 mx-auto mb-3 object-contain"
            />
          )}
          <h1 className="text-xl font-semibold" data-testid="text-tenant-name">
            {tenant.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select a meeting type below to schedule
          </p>
        </div>

        {eventTypes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground text-sm" data-testid="text-no-events">
                No events available right now.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {eventTypes.map((et) => {
              const LocationIcon = locationIcons[et.locationType] || Video;
              return (
                <Link
                  key={et.id}
                  href={`/book/${tenantSlug}/${et.slug}`}
                >
                  <Card
                    className="hover-elevate cursor-pointer overflow-visible"
                    data-testid={`card-event-${et.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-1 h-10 rounded-full flex-shrink-0"
                          style={{ backgroundColor: et.color || brandColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium">{et.title}</h3>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {et.durationMinutes} min
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <LocationIcon className="h-3 w-3" />
                              {locationLabels[et.locationType]}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Powered by <span className="font-medium">CalendaLite</span>
        </p>
      </div>
    </div>
  );
}
