import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowRight, ArrowLeft, Building2, UserPlus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Phoenix",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Stockholm",
  "Europe/Moscow",
  "Europe/Istanbul",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Perth",
  "Pacific/Auckland",
  "Pacific/Honolulu",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Africa/Lagos",
];

const step1Schema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  slug: z
    .string()
    .min(1, "URL slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  timezone: z.string().min(1, "Timezone is required"),
});

const step2Schema = z
  .object({
    userName: z.string().min(1, "Full name is required"),
    userEmail: z.string().email("Valid email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const defaultTimezone = COMMON_TIMEZONES.includes(detectedTimezone)
    ? detectedTimezone
    : "America/New_York";

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      organizationName: "",
      slug: "",
      timezone: defaultTimezone,
    },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      userName: "",
      userEmail: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    setStep(2);
  };

  const onStep2Submit = async (data: Step2Data) => {
    if (!step1Data) return;
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/setup", {
        organizationName: step1Data.organizationName,
        slug: step1Data.slug,
        timezone: step1Data.timezone,
        userName: data.userName,
        userEmail: data.userEmail,
        password: data.password,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/setup/status"] });
      toast({ title: "Setup complete", description: "Your workspace is ready." });
      setLocation("/hud");
    } catch (e: any) {
      const msg = e.message?.includes(":")
        ? e.message.split(":").slice(1).join(":").trim()
        : e.message;
      toast({
        title: "Setup failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrgNameChange = (value: string, onChange: (v: string) => void) => {
    onChange(value);
    const currentSlug = step1Form.getValues("slug");
    const previousName = step1Form.getValues("organizationName");
    if (!currentSlug || currentSlug === slugify(previousName)) {
      step1Form.setValue("slug", slugify(value));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-md bg-primary flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-setup-title">
            Welcome to SaaS Killer
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="text-setup-tagline">
            Your open-source business operating system
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-6" data-testid="step-indicator">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
              data-testid="step-indicator-1"
            >
              {step > 1 ? <Check className="h-4 w-4" /> : "1"}
            </div>
            <span className={`text-sm ${step >= 1 ? "font-medium" : "text-muted-foreground"}`}>
              Organization
            </span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
              data-testid="step-indicator-2"
            >
              2
            </div>
            <span className={`text-sm ${step >= 2 ? "font-medium" : "text-muted-foreground"}`}>
              Admin Account
            </span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg" data-testid="text-step-title">
              {step === 1 ? "Set up your organization" : "Create your admin account"}
            </CardTitle>
            <CardDescription data-testid="text-step-description">
              {step === 1
                ? "This information will be used for your booking pages and workspace."
                : "This account will have full owner access to manage your workspace."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <Form {...step1Form}>
                <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-4">
                  <FormField
                    control={step1Form.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Acme Inc."
                            data-testid="input-org-name"
                            {...field}
                            onChange={(e) =>
                              handleOrgNameChange(e.target.value, field.onChange)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={step1Form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="acme-inc"
                            data-testid="input-slug"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your booking pages will be available at /{field.value || "your-slug"}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={step1Form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-timezone">
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COMMON_TIMEZONES.map((tz) => (
                              <SelectItem key={tz} value={tz}>
                                {tz.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="pt-2">
                    <Button type="submit" className="w-full" data-testid="button-next">
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <Form {...step2Form}>
                <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-4">
                  <FormField
                    control={step2Form.control}
                    name="userName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Alex Johnson"
                            data-testid="input-admin-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={step2Form.control}
                    name="userEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="admin@example.com"
                            data-testid="input-admin-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={step2Form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="At least 6 characters"
                            data-testid="input-admin-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={step2Form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Re-enter your password"
                            data-testid="input-admin-confirm-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      data-testid="button-back"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isSubmitting}
                      data-testid="button-complete-setup"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      Complete Setup
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6" data-testid="text-setup-footer">
          Step {step} of 2
        </p>
      </div>
    </div>
  );
}
