import type { Express } from "express";
  import { storage } from "../storage";
  import { z } from "zod";
  import { requireAuth } from "../auth";

  export function registerEmailRoutes(app: Express) {
    // ─── EMAIL TEMPLATES ────────────────────────────────────────────────────

  const createEmailTemplateSchema = z.object({
    name: z.string().min(1),
    subject: z.string().min(1),
    bodyHtml: z.string().optional(),
    bodyText: z.string().optional(),
    category: z.enum(["transactional", "marketing", "notification"]).optional(),
    variablesJson: z.string().optional(),
  });

  const updateEmailTemplateSchema = z.object({
    name: z.string().min(1).optional(),
    subject: z.string().min(1).optional(),
    bodyHtml: z.string().optional(),
    bodyText: z.string().optional(),
    category: z.enum(["transactional", "marketing", "notification"]).optional(),
    variablesJson: z.string().optional(),
    isActive: z.boolean().optional(),
  });

  app.get("/api/admin/email-templates", requireAuth, async (req, res) => {
    try {
      const result = await storage.getEmailTemplatesByTenant(req.user!.tenantId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/email-templates", requireAuth, async (req, res) => {
    try {
      const parsed = createEmailTemplateSchema.parse(req.body);
      const template = await storage.createEmailTemplate({
        ...parsed,
        tenantId: req.user!.tenantId,
        createdByUserId: req.user!.id,
        isActive: true,
      });
      res.json(template);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/email-templates/:id", requireAuth, async (req, res) => {
    try {
      const template = await storage.getEmailTemplate(req.params.id as string);
      if (!template || template.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/email-templates/:id", requireAuth, async (req, res) => {
    try {
      const template = await storage.getEmailTemplate(req.params.id as string);
      if (!template || template.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Template not found" });
      }
      const parsed = updateEmailTemplateSchema.parse(req.body);
      const updated = await storage.updateEmailTemplate(template.id, parsed);
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/email-templates/:id", requireAuth, async (req, res) => {
    try {
      const template = await storage.getEmailTemplate(req.params.id as string);
      if (!template || template.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Template not found" });
      }
      await storage.deleteEmailTemplate(template.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/email-logs", requireAuth, async (req, res) => {
    try {
      const result = await storage.getEmailLogsByTenant(req.user!.tenantId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  }
  