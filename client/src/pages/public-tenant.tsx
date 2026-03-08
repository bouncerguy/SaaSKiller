import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Video, Phone, MapPin, Globe, ArrowRight, CalendarIcon, Calendar } from "lucide-react";
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
  const brandColor = tenant?.brandColor || "#5b4cdb";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold" data-testid="text-tenant-not-found">
            Page Not Found
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            This scheduling page doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          {tenant.logoUrl && (
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="h-10 mx-auto mb-4 object-contain"
            />
          )}
          <h1 className="text-xl font-semibold" data-testid="text-tenant-name">
            {tenant.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Select a meeting type to schedule
          </p>
        </div>

        {eventTypes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium" data-testid="text-no-events">
              No events available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Check back later for available meeting times
            </p>
          </div>
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
                    className="hover-elevate cursor-pointer overflow-visible group"
                    data-testid={`card-event-${et.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: (et.color || brandColor) + "15" }}
                        >
                          <Calendar className="h-5 w-5" style={{ color: et.color || brandColor }} />
                        </div>
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
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground pt-4" data-testid="text-powered-by">
          Powered by <span className="font-medium">SaaS Killer</span>
        </p>
      </div>
    </div>
  );
}
