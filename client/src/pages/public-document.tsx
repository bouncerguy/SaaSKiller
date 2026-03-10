import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Check,
  AlertCircle,
  FileSignature,
  Loader2,
  XCircle,
  Clock,
  Shield,
} from "lucide-react";

interface SignerData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  signedAt: string | null;
}

interface DocumentData {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  status: string;
  expiresAt: string | null;
}

interface TenantData {
  name: string;
  slug: string;
  brandColor: string | null;
  logoUrl: string | null;
}

interface SignerPageResponse {
  document: DocumentData;
  signer: SignerData;
  tenant: TenantData;
}

function renderContentBlocks(content: string | null) {
  if (!content) return null;
  let blocks: any[] = [];
  try {
    blocks = JSON.parse(content);
  } catch {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {content.split("\n").map((line: string, i: number) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    );
  }

  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  return (
    <div className="space-y-4">
      {blocks.map((block: any, index: number) => {
        const b = block.data ? { ...block, ...block.data } : block;
        switch (b.type) {
          case "heading":
            return (
              <h2 key={index} className="text-lg font-semibold" data-testid={`block-heading-${index}`}>
                {b.text || b.content || ""}
              </h2>
            );
          case "paragraph":
          case "text":
            return (
              <div key={index} className="text-sm leading-relaxed text-foreground" data-testid={`block-text-${index}`}>
                {(b.text || b.content || "").split("\n").map((line: string, i: number) => (
                  <p key={i} className="mb-2">{line}</p>
                ))}
              </div>
            );
          case "list": {
            const items = b.items || [];
            return (
              <ul key={index} className="list-disc pl-5 space-y-1 text-sm" data-testid={`block-list-${index}`}>
                {items.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            );
          }
          case "signature_block":
            return (
              <div key={index} className="border border-dashed rounded-md p-4 text-center text-muted-foreground text-sm" data-testid={`block-signature-${index}`}>
                <FileSignature className="h-5 w-5 mx-auto mb-2" />
                {b.label || "Signature Required"}
              </div>
            );
          default:
            if (b.text || b.content) {
              return (
                <div key={index} className="text-sm leading-relaxed" data-testid={`block-content-${index}`}>
                  {(b.text || b.content || "").split("\n").map((line: string, i: number) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>
              );
            }
            return null;
        }
      })}
    </div>
  );
}

export default function PublicDocument() {
  const params = useParams<{ tenantSlug: string; docSlug: string; signerId: string }>();
  const { tenantSlug, docSlug, signerId } = params;
  const { toast } = useToast();

  const [typedName, setTypedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showDecline, setShowDecline] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);
  const [declinedSuccess, setDeclinedSuccess] = useState(false);

  const { data, isLoading, error } = useQuery<SignerPageResponse>({
    queryKey: ["/api/public", tenantSlug, "documents", docSlug, "signer", signerId],
    queryFn: async () => {
      const res = await fetch(`/api/public/${tenantSlug}/documents/${docSlug}/signer/${signerId}`);
      if (!res.ok) throw new Error("Document not found");
      return res.json();
    },
  });

  const signMutation = useMutation({
    mutationFn: async (signature: string) => {
      const res = await apiRequest(
        "POST",
        `/api/public/${tenantSlug}/documents/${docSlug}/signer/${signerId}/sign`,
        { signature },
      );
      return res.json();
    },
    onSuccess: () => {
      setSignedSuccess(true);
    },
    onError: (err: Error) => {
      toast({
        title: "Signing failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await apiRequest(
        "POST",
        `/api/public/${tenantSlug}/documents/${docSlug}/signer/${signerId}/decline`,
        { reason },
      );
      return res.json();
    },
    onSuccess: () => {
      setDeclinedSuccess(true);
    },
    onError: (err: Error) => {
      toast({
        title: "Decline failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const brandColor = data?.tenant?.brandColor || "#4f46e5";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl overflow-visible">
          <CardContent className="p-8 space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
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
          <h2 className="text-lg font-semibold" data-testid="text-document-not-found">
            Document Not Found
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            This document doesn't exist, has expired, or is no longer available for signing.
          </p>
        </div>
      </div>
    );
  }

  const { document: doc, signer, tenant } = data;
  const isAlreadySigned = signer.status === "SIGNED";
  const isDeclined = signer.status === "DECLINED";
  const isExpired = doc.expiresAt && new Date(doc.expiresAt) < new Date();
  const isCompleted = doc.status === "COMPLETED";
  const isAvailable = doc.status === "SENT" && !isExpired;

  if (signedSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: brandColor + "15" }}
          >
            <Check className="h-8 w-8" style={{ color: brandColor }} />
          </div>
          <h2 className="text-xl font-semibold" data-testid="text-sign-success">
            Document Signed
          </h2>
          <p className="text-muted-foreground text-sm mt-2" data-testid="text-sign-success-message">
            You have successfully signed "{doc.title}". A confirmation will be sent to {signer.email}.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Your signature has been securely recorded</span>
          </div>
        </div>
      </div>
    );
  }

  if (declinedSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
            <XCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold" data-testid="text-decline-success">
            Signing Declined
          </h2>
          <p className="text-muted-foreground text-sm mt-2" data-testid="text-decline-success-message">
            You have declined to sign "{doc.title}". The document owner has been notified.
          </p>
        </div>
      </div>
    );
  }

  if (isAlreadySigned) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: brandColor + "15" }}
          >
            <Check className="h-8 w-8" style={{ color: brandColor }} />
          </div>
          <h2 className="text-xl font-semibold" data-testid="text-already-signed">
            Already Signed
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            You have already signed "{doc.title}"
            {signer.signedAt && (
              <span> on {new Date(signer.signedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            )}
            .
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Your signature is securely on file</span>
          </div>
        </div>
      </div>
    );
  }

  if (isDeclined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-5">
            <XCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold" data-testid="text-already-declined">
            Signing Declined
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            You have previously declined to sign "{doc.title}".
          </p>
        </div>
      </div>
    );
  }

  const canSign = isAvailable && !isAlreadySigned && !isDeclined && signer.role !== "VIEWER";

  return (
    <div className="min-h-screen bg-background" data-testid="public-document-page">
      <header className="border-b sticky top-0 bg-background/80 backdrop-blur-lg z-[9999]">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {tenant.logoUrl && <img src={tenant.logoUrl} alt={tenant.name} className="h-7" />}
            <span className="font-medium text-sm" data-testid="text-tenant-name">{tenant.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {isExpired && <Badge variant="destructive" data-testid="badge-expired">Expired</Badge>}
            {isCompleted && <Badge variant="secondary" data-testid="badge-completed">Completed</Badge>}
            {doc.status === "SENT" && !isExpired && (
              <Badge variant="outline" data-testid="badge-awaiting">Awaiting Signature</Badge>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold" data-testid="text-document-title">{doc.title}</h1>
          {doc.description && (
            <p className="text-muted-foreground text-sm mt-2" data-testid="text-document-description">
              {doc.description}
            </p>
          )}
          {doc.expiresAt && !isExpired && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Expires {new Date(doc.expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          )}
        </div>

        <Card className="overflow-visible mb-8">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <FileSignature className="h-3.5 w-3.5" />
              <span>Document Content</span>
            </div>
            <Separator className="mb-4" />
            <div data-testid="document-content">
              {renderContentBlocks(doc.content)}
              {!doc.content && (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No document content available.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {canSign && (
          <Card className="overflow-visible" data-testid="signing-section">
            <CardContent className="p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Sign Document</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Signing as <span className="font-medium text-foreground">{signer.name}</span> ({signer.email})
                </p>
              </div>

              <Separator className="mb-5" />

              {!showDecline ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signature-input">Type your full name to sign</Label>
                    <Input
                      id="signature-input"
                      placeholder={signer.name}
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      data-testid="input-signature"
                    />
                  </div>

                  {typedName.trim() && (
                    <div className="border rounded-md p-6 bg-muted/30 text-center" data-testid="signature-preview">
                      <p className="text-xs text-muted-foreground mb-2">Signature Preview</p>
                      <p
                        className="text-3xl italic"
                        style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: brandColor }}
                        data-testid="text-signature-preview"
                      >
                        {typedName}
                      </p>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="agree-checkbox"
                      checked={agreed}
                      onCheckedChange={(checked) => setAgreed(checked === true)}
                      data-testid="checkbox-agree"
                    />
                    <Label
                      htmlFor="agree-checkbox"
                      className="text-sm font-normal text-muted-foreground cursor-pointer leading-relaxed"
                    >
                      I agree that my typed name above constitutes my electronic signature, and I consent to be legally bound by the terms of this document.
                    </Label>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <Button
                      className="flex-1"
                      disabled={!typedName.trim() || !agreed || signMutation.isPending}
                      onClick={() => signMutation.mutate(typedName.trim())}
                      style={{ backgroundColor: brandColor, borderColor: brandColor }}
                      data-testid="button-sign"
                    >
                      {signMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Signing...
                        </>
                      ) : (
                        <>
                          <FileSignature className="h-4 w-4 mr-2" />
                          Sign Document
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDecline(true)}
                      data-testid="button-show-decline"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to decline signing this document? The document owner will be notified.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="decline-reason">Reason (optional)</Label>
                    <Textarea
                      id="decline-reason"
                      placeholder="Provide a reason for declining..."
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      data-testid="input-decline-reason"
                    />
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <Button
                      variant="destructive"
                      disabled={declineMutation.isPending}
                      onClick={() => declineMutation.mutate(declineReason)}
                      data-testid="button-confirm-decline"
                    >
                      {declineMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Declining...
                        </>
                      ) : (
                        "Confirm Decline"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDecline(false)}
                      data-testid="button-cancel-decline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!canSign && !isAlreadySigned && !isDeclined && signer.role === "VIEWER" && (
          <Card className="overflow-visible">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground text-sm" data-testid="text-viewer-only">
                You have been added as a viewer for this document. No signature is required.
              </p>
            </CardContent>
          </Card>
        )}

        {!canSign && isExpired && (
          <Card className="overflow-visible">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium" data-testid="text-expired">This document has expired</p>
              <p className="text-muted-foreground text-sm mt-1">
                Please contact the document owner for a new signing link.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-1.5">
          <Shield className="h-3 w-3" />
          <span>Secured by {tenant.name}</span>
        </div>
      </footer>
    </div>
  );
}