import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ShieldCheck, Loader2, AlertCircle, Clock, Lock, Mail, CheckCircle2
} from "lucide-react";

interface TenantData {
  name: string;
  slug: string;
  brandColor: string | null;
  logoUrl: string | null;
}

interface MessageMeta {
  id: string;
  subject: string;
  recipientEmail: string;
  recipientName: string;
  status: string;
  expiresAt: string | null;
  tenant: TenantData;
}

interface MessageContent {
  id: string;
  subject: string;
  body: string;
  recipientName: string;
  recipientEmail: string;
  sentAt: string | null;
  tenant: TenantData;
}

export default function PublicSecureMessage() {
  const params = useParams<{ tenantSlug: string; token: string }>();
  const { tenantSlug, token } = params;
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const [messageContent, setMessageContent] = useState<MessageContent | null>(null);

  const { data, isLoading, error } = useQuery<MessageMeta>({
    queryKey: ["/api/public", tenantSlug, "secure", token],
    queryFn: async () => {
      const res = await fetch(`/api/public/${tenantSlug}/secure/${token}`);
      if (res.status === 410) throw new Error("expired");
      if (!res.ok) throw new Error("not_found");
      return res.json();
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (verifyEmail: string) => {
      const res = await apiRequest(
        "POST",
        `/api/public/${tenantSlug}/secure/${token}/verify`,
        { email: verifyEmail }
      );
      return res.json();
    },
    onSuccess: (content: MessageContent) => {
      setVerified(true);
      setMessageContent(content);
    },
    onError: (err: Error) => {
      toast({
        title: "Verification failed",
        description: err.message || "Email does not match. Please try again.",
        variant: "destructive",
      });
    },
  });

  const brandColor = data?.tenant?.brandColor || messageContent?.tenant?.brandColor || "#4f46e5";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg overflow-visible">
          <CardContent className="p-8 space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error?.message === "expired") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold" data-testid="text-message-expired">Message Expired</h2>
          <p className="text-muted-foreground text-sm mt-2">
            This secure message has expired and is no longer available.
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold" data-testid="text-message-not-found">Message Not Found</h2>
          <p className="text-muted-foreground text-sm mt-2">
            This secure message doesn't exist or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  if (verified && messageContent) {
    return (
      <div className="min-h-screen bg-background" data-testid="secure-message-content-page">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-lg z-[9999]">
          <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {messageContent.tenant.logoUrl && (
                <img src={messageContent.tenant.logoUrl} alt={messageContent.tenant.name} className="h-7" />
              )}
              <span className="font-medium text-sm" data-testid="text-tenant-name">{messageContent.tenant.name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified</span>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ backgroundColor: brandColor + "15" }}
              >
                <Lock className="h-4 w-4" style={{ color: brandColor }} />
              </div>
              <h1 className="text-2xl font-semibold" data-testid="text-message-subject">{messageContent.subject}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Sent to {messageContent.recipientName} ({messageContent.recipientEmail})
              {messageContent.sentAt && (
                <span> · {new Date(messageContent.sentAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              )}
            </p>
          </div>

          <Card className="overflow-visible">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Secure Message Content</span>
              </div>
              <Separator className="mb-4" />
              <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="message-body">
                {messageContent.body.split("\n").map((line, i) => (
                  <p key={i} className="mb-2">{line || "\u00A0"}</p>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>This message was delivered securely via {messageContent.tenant.name}</span>
          </div>
        </main>
      </div>
    );
  }

  const { tenant } = data;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="secure-message-verify-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          {tenant.logoUrl && (
            <img src={tenant.logoUrl} alt={tenant.name} className="h-10 mx-auto mb-4" />
          )}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: brandColor + "15" }}
          >
            <Lock className="h-8 w-8" style={{ color: brandColor }} />
          </div>
          <h1 className="text-xl font-semibold" data-testid="text-verify-title">Secure Message</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {tenant.name} has sent you a secure message. Verify your email to view it.
          </p>
        </div>

        <Card className="overflow-visible">
          <CardContent className="p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold" data-testid="text-message-subject-preview">{data.subject}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                To: {data.recipientName}
              </p>
              {data.expiresAt && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Expires {new Date(data.expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
              )}
            </div>

            <Separator className="mb-4" />

            <div className="space-y-4">
              <div className="rounded-md bg-muted/50 p-3 flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  For your security, enter the email address this message was sent to. The actual message content is only visible after verification.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verify-email">Your Email Address</Label>
                <Input
                  id="verify-email"
                  type="email"
                  placeholder="Enter your email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && email.trim()) {
                      verifyMutation.mutate(email.trim());
                    }
                  }}
                  data-testid="input-verify-email"
                />
              </div>

              <Button
                className="w-full"
                disabled={!email.trim() || verifyMutation.isPending}
                onClick={() => verifyMutation.mutate(email.trim())}
                style={{ backgroundColor: brandColor, borderColor: brandColor }}
                data-testid="button-verify"
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Verify & View Message
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3 w-3" />
          <span>Secured by {tenant.name}</span>
        </div>
      </div>
    </div>
  );
}
