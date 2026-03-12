import type { Express } from "express";
  import { storage } from "../storage";
  import { z } from "zod";
  import { requireAuth } from "../auth";

  export function registerFormRoutes(app: Express) {
    // ─── FORMS ───────────────────────────────────────────────────────────────

  const createFormSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  });

  const updateFormSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    fieldsJson: z.string().optional(),
    settingsJson: z.string().optional(),
  });

  app.get("/api/admin/forms", requireAuth, async (req, res) => {
    try {
      const result = await storage.getFormsByTenant(req.user!.tenantId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/forms", requireAuth, async (req, res) => {
    try {
      const parsed = createFormSchema.parse(req.body);
      const existing = await storage.getFormBySlug(req.user!.tenantId, parsed.slug);
      if (existing) {
        return res.status(400).json({ message: "A form with that slug already exists" });
      }
      const form = await storage.createForm({
        ...parsed,
        tenantId: req.user!.tenantId,
        createdByUserId: req.user!.id,
        status: "DRAFT",
        fieldsJson: "[]",
        settingsJson: "{}",
      });
      res.json(form);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/forms/:id", requireAuth, async (req, res) => {
    try {
      const form = await storage.getForm(req.params.id as string);
      if (!form || form.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Form not found" });
      }
      const responses = await storage.getFormResponses(form.id);
      res.json({ ...form, responses });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/forms/:id", requireAuth, async (req, res) => {
    try {
      const form = await storage.getForm(req.params.id as string);
      if (!form || form.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Form not found" });
      }
      const parsed = updateFormSchema.parse(req.body);
      if (parsed.slug && parsed.slug !== form.slug) {
        const existing = await storage.getFormBySlug(req.user!.tenantId, parsed.slug);
        if (existing) {
          return res.status(400).json({ message: "A form with that slug already exists" });
        }
      }
      const updated = await storage.updateForm(form.id, parsed);
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/forms/:id", requireAuth, async (req, res) => {
    try {
      const form = await storage.getForm(req.params.id as string);
      if (!form || form.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Form not found" });
      }
      await storage.deleteForm(form.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/forms/:id/responses", requireAuth, async (req, res) => {
    try {
      const form = await storage.getForm(req.params.id as string);
      if (!form || form.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Form not found" });
      }
      const responses = await storage.getFormResponses(form.id);
      res.json(responses);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/public/forms/:tenantSlug/:formSlug", async (req, res) => {
    try {
      const tenant = await storage.getTenantBySlug(req.params.tenantSlug as string);
      if (!tenant) {
        return res.status(404).json({ message: "Not found" });
      }
      const form = await storage.getFormBySlug(tenant.id, req.params.formSlug as string);
      if (!form || form.status !== "PUBLISHED") {
        return res.status(404).json({ message: "Form not found" });
      }
      res.json({
        id: form.id,
        name: form.name,
        description: form.description,
        fieldsJson: form.fieldsJson,
        settingsJson: form.settingsJson,
        tenant: { name: tenant.name, brandColor: tenant.brandColor },
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/public/forms/:tenantSlug/:formSlug/submit", async (req, res) => {
    try {
      const tenant = await storage.getTenantBySlug(req.params.tenantSlug as string);
      if (!tenant) {
        return res.status(404).json({ message: "Not found" });
      }
      const form = await storage.getFormBySlug(tenant.id, req.params.formSlug as string);
      if (!form || form.status !== "PUBLISHED") {
        return res.status(404).json({ message: "Form not found" });
      }
      const response = await storage.createFormResponse({
        tenantId: tenant.id,
        formId: form.id,
        dataJson: JSON.stringify(req.body.data || {}),
        ipAddress: (req.ip || req.socket.remoteAddress || null) as string | null,
        referrer: (req.headers.referer || null) as string | null,
      });
      await storage.incrementFormResponseCount(form.id);
      res.json({ success: true, id: response.id });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Public Pages & Funnels
  app.get("/api/public/:tenantSlug/pages/:pageSlug", async (req, res) => {
    try {
      const tenant = await storage.getTenantBySlug(req.params.tenantSlug as string);
      if (!tenant) return res.status(404).json({ message: "Not found" });
      const page = await storage.getPageBySlug(tenant.id, req.params.pageSlug as string);
      if (!page || page.status !== "PUBLISHED") {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json({ page, tenant: { name: tenant.name, slug: tenant.slug, brandColor: tenant.brandColor, logoUrl: tenant.logoUrl } });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/public/:tenantSlug/funnels/:funnelSlug", async (req, res) => {
    try {
      const tenant = await storage.getTenantBySlug(req.params.tenantSlug as string);
      if (!tenant) return res.status(404).json({ message: "Not found" });
      const funnel = await storage.getFunnelBySlug(tenant.id, req.params.funnelSlug as string);
      if (!funnel || funnel.status !== "PUBLISHED") {
        return res.status(404).json({ message: "Funnel not found" });
      }
      const steps = await storage.getStepsByFunnel(funnel.id);
      res.json({ funnel, steps, tenant: { name: tenant.name, slug: tenant.slug, brandColor: tenant.brandColor, logoUrl: tenant.logoUrl } });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  }
  