import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
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
import { Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isLoading, needsSetup, login, register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  useEffect(() => {
    if (!isLoading && needsSetup) {
      setLocation("/setup");
    } else if (!isLoading && user) {
      setLocation("/hud");
    }
  }, [isLoading, needsSetup, user, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (needsSetup || user) {
    return null;
  }

  const onLogin = async (data: LoginData) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      setLocation("/hud");
    } catch (e: any) {
      const msg = e.message?.includes(":") ? e.message.split(":").slice(1).join(":").trim() : e.message;
      toast({ title: "Login failed", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegister = async (data: RegisterData) => {
    setIsSubmitting(true);
    try {
      await register(data.name, data.email, data.password);
      setLocation("/hud");
    } catch (e: any) {
      const msg = e.message?.includes(":") ? e.message.split(":").slice(1).join(":").trim() : e.message;
      toast({ title: "Registration failed", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-xl" data-testid="text-auth-title">
              {isLogin ? "Sign in to SaaS Killer" : "Create your account"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Enter your credentials to access the dashboard"
                : "Set up your account to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLogin ? (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            data-testid="input-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            data-testid="input-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-login">
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Alex Johnson"
                            data-testid="input-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            data-testid="input-register-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="At least 6 characters"
                            data-testid="input-register-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-register">
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </Form>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => setIsLogin(false)}
                    data-testid="link-switch-register"
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => setIsLogin(true)}
                    data-testid="link-switch-login"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="hidden lg:flex items-center justify-center bg-primary/[0.04] dark:bg-primary/[0.08] border-l p-12">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight" data-testid="text-hero-title">
              Your business, your terms
            </h2>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              An open-source business operating system for brands and solopreneurs.
              Own your scheduling, CRM, support, and more — with zero recurring SaaS fees.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-left text-sm">
            <div className="p-3 rounded-lg bg-background border">
              <p className="font-medium">Self-hosted</p>
              <p className="text-xs text-muted-foreground mt-0.5">Own your data, deploy anywhere</p>
            </div>
            <div className="p-3 rounded-lg bg-background border">
              <p className="font-medium">Modular</p>
              <p className="text-xs text-muted-foreground mt-0.5">Calendar, CRM, support & more</p>
            </div>
            <div className="p-3 rounded-lg bg-background border">
              <p className="font-medium">Team ready</p>
              <p className="text-xs text-muted-foreground mt-0.5">Roles, groups, and permissions</p>
            </div>
            <div className="p-3 rounded-lg bg-background border">
              <p className="font-medium">Open source</p>
              <p className="text-xs text-muted-foreground mt-0.5">MIT licensed, community-driven</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
