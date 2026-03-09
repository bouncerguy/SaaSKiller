import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, FileText, AlertCircle } from "lucide-react";

interface FormField {
  id: string;
  label: string;
  type: "text" | "email" | "phone" | "number" | "textarea" | "select" | "checkbox" | "url";
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

interface PublicFormData {
  id: string;
  name: string;
  description: string | null;
  fieldsJson: string | null;
  settingsJson: string | null;
  tenant: {
    name: string;
    brandColor: string | null;
  };
}

export default function PublicForm() {
  const { tenantSlug, formSlug } = useParams<{ tenantSlug: string; formSlug: string }>();
  const [submitted, setSubmitted] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const { toast } = useToast();

  const { data: formData, isLoading, error } = useQuery<PublicFormData>({
    queryKey: ["/api/public/forms", tenantSlug, formSlug],
  });

  const submitMutation = useMutation({
    mutationFn: async (data: Record<string, string | boolean>) => {
      const res = await apiRequest(
        "POST",
        `/api/public/forms/${tenantSlug}/${formSlug}/submit`,
        { data },
      );
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: Error) => {
      toast({
        title: "Submission failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const brandColor = formData?.tenant?.brandColor || "#5b4cdb";

  let fields: FormField[] = [];
  if (formData?.fieldsJson) {
    try {
      fields = JSON.parse(formData.fieldsJson);
    } catch {
      fields = [];
    }
  }

  let settings: Record<string, string> = {};
  if (formData?.settingsJson) {
    try {
      settings = JSON.parse(formData.settingsJson);
    } catch {
      settings = {};
    }
  }

  const handleFieldChange = (fieldId: string, value: string | boolean) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const missingRequired = fields.filter((f) => {
      if (!f.required) return false;
      const val = formValues[f.id];
      if (f.type === "checkbox") return val !== true;
      return !val;
    });
    if (missingRequired.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please fill in: ${missingRequired.map((f) => f.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate(formValues);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg overflow-visible">
          <CardContent className="p-8 space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold" data-testid="text-form-not-found">
            Form Not Found
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            This form doesn't exist or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    const successMessage = settings.successMessage || settings.confirmationMessage || "Your response has been recorded. Thank you!";
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: brandColor + "15" }}
          >
            <Check className="h-8 w-8" style={{ color: brandColor }} />
          </div>
          <h2 className="text-xl font-semibold" data-testid="text-form-submitted">
            Thank You
          </h2>
          <p className="text-muted-foreground text-sm mt-2" data-testid="text-success-message">
            {successMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg overflow-visible">
        <CardContent className="p-8">
          <div className="mb-6">
            <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">
              {formData.tenant.name}
            </p>
            <h1 className="text-xl font-semibold mt-1" data-testid="text-form-title">
              {formData.name}
            </h1>
            {formData.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed" data-testid="text-form-description">
                {formData.description}
              </p>
            )}
          </div>

          {fields.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground" data-testid="text-no-fields">
                This form has no fields configured yet.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={`field-${field.id}`}>
                    {field.label}
                    {field.required && (
                      <span className="text-destructive ml-0.5">*</span>
                    )}
                  </Label>

                  {field.type === "text" && (
                    <Input
                      id={`field-${field.id}`}
                      type="text"
                      placeholder={field.placeholder || ""}
                      required={field.required}
                      value={(formValues[field.id] as string) || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      data-testid={`input-field-${field.id}`}
                    />
                  )}

                  {field.type === "email" && (
                    <Input
                      id={`field-${field.id}`}
                      type="email"
                      placeholder={field.placeholder || "email@example.com"}
                      required={field.required}
                      value={(formValues[field.id] as string) || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      data-testid={`input-field-${field.id}`}
                    />
                  )}

                  {field.type === "phone" && (
                    <Input
                      id={`field-${field.id}`}
                      type="tel"
                      placeholder={field.placeholder || "+1 (555) 000-0000"}
                      required={field.required}
                      value={(formValues[field.id] as string) || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      data-testid={`input-field-${field.id}`}
                    />
                  )}

                  {field.type === "number" && (
                    <Input
                      id={`field-${field.id}`}
                      type="number"
                      placeholder={field.placeholder || ""}
                      required={field.required}
                      value={(formValues[field.id] as string) || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      data-testid={`input-field-${field.id}`}
                    />
                  )}

                  {field.type === "url" && (
                    <Input
                      id={`field-${field.id}`}
                      type="url"
                      placeholder={field.placeholder || "https://"}
                      required={field.required}
                      value={(formValues[field.id] as string) || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      data-testid={`input-field-${field.id}`}
                    />
                  )}

                  {field.type === "textarea" && (
                    <Textarea
                      id={`field-${field.id}`}
                      placeholder={field.placeholder || ""}
                      required={field.required}
                      value={(formValues[field.id] as string) || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      data-testid={`input-field-${field.id}`}
                    />
                  )}

                  {field.type === "select" && (
                    <Select
                      value={(formValues[field.id] as string) || ""}
                      onValueChange={(val) => handleFieldChange(field.id, val)}
                    >
                      <SelectTrigger id={`field-${field.id}`} data-testid={`select-field-${field.id}`}>
                        <SelectValue placeholder={field.placeholder || "Select an option"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options || []).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {field.type === "checkbox" && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`field-${field.id}`}
                        checked={!!formValues[field.id]}
                        onCheckedChange={(checked) =>
                          handleFieldChange(field.id, checked === true)
                        }
                        data-testid={`checkbox-field-${field.id}`}
                      />
                      {field.placeholder && (
                        <Label
                          htmlFor={`field-${field.id}`}
                          className="text-sm font-normal text-muted-foreground cursor-pointer"
                        >
                          {field.placeholder}
                        </Label>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <Button
                type="submit"
                className="w-full"
                disabled={submitMutation.isPending}
                style={{ backgroundColor: brandColor, borderColor: brandColor }}
                data-testid="button-submit-form"
              >
                {submitMutation.isPending ? "Submitting..." : (settings.submitButtonText || "Submit")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
