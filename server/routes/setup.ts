import type { Express } from "express";
  import { storage } from "../storage";
  import { z } from "zod";
  import { hashPassword } from "../auth";

  const setupSchema = z.object({
    organizationName: z.string().min(1, "Organization name is required"),
    slug: z.string().min(1, "URL slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
    timezone: z.string().min(1, "Timezone is required"),
    userName: z.string().min(1, "Name is required"),
    userEmail: z.string().email("Valid email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  export function registerSetupRoutes(app: Express) {
    app.get("/api/setup/status", async (_req, res) => {
    try {
      const allTenants = await storage.getAllTenants();
      res.json({ needsSetup: allTenants.length === 0 });
    } catch (e: any) {
      res.json({ needsSetup: true });
    }
  });

  app.post("/api/setup", async (req, res, next) => {
    try {
      const allTenants = await storage.getAllTenants();
      if (allTenants.length > 0) {
        return res.status(403).json({ message: "Setup already completed" });
      }

      const parsed = setupSchema.parse(req.body);

      const existingSlug = await storage.getTenantBySlug(parsed.slug);
      if (existingSlug) {
        return res.status(400).json({ message: "This URL slug is already taken" });
      }

      const tenant = await storage.createTenant({
        name: parsed.organizationName,
        slug: parsed.slug,
        timezone: parsed.timezone,
        brandColor: "#5b4cdb",
        logoUrl: null,
      });

      const passwordHash = await hashPassword(parsed.password);
      const user = await storage.createUser({
        tenantId: tenant.id,
        name: parsed.userName,
        email: parsed.userEmail,
        role: "OWNER",
        passwordHash,
      });

      await storage.seedDefaultFeatures();

      await storage.logActivity({
        tenantId: tenant.id,
        userId: user.id,
        entityType: "system",
        entityId: tenant.id,
        action: "setup_completed",
        details: JSON.stringify({ organizationName: parsed.organizationName }),
      });

      req.login(
        { id: user.id, tenantId: user.tenantId, name: user.name, email: user.email, role: user.role },
        (err) => {
          if (err) return next(err);
          res.json({ id: user.id, name: user.name, email: user.email, role: user.role, tenantId: tenant.id });
        },
      );
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });
  }
  