import type { Express } from "express";
  import { storage } from "../storage";
  import { z } from "zod";
  import { requireAuth } from "../auth";

  export function registerFunnelRoutes(app: Express) {
    // Funnels Routes
  app.get("/api/admin/funnels", requireAuth, async (req, res) => {
    try {
      const result = await storage.getFunnelsByTenant(req.user!.tenantId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/funnels", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
      });
      const parsed = schema.parse(req.body);
      const funnel = await storage.createFunnel({
        tenantId: req.user!.tenantId,
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description || null,
        status: parsed.status || "DRAFT",
      });
      res.json(funnel);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/funnels/:id", requireAuth, async (req, res) => {
    try {
      const funnel = await storage.getFunnel(req.params.id);
      if (!funnel || funnel.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Funnel not found" });
      }
      const steps = await storage.getStepsByFunnel(funnel.id);
      res.json({ ...funnel, steps });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/funnels/:id", requireAuth, async (req, res) => {
    try {
      const funnel = await storage.getFunnel(req.params.id);
      if (!funnel || funnel.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Funnel not found" });
      }
      const schema = z.object({
        name: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
      });
      const parsed = schema.parse(req.body);
      const updated = await storage.updateFunnel(req.params.id, parsed);
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/funnels/:id", requireAuth, async (req, res) => {
    try {
      const funnel = await storage.getFunnel(req.params.id);
      if (!funnel || funnel.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Funnel not found" });
      }
      await storage.deleteFunnel(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Funnel Steps Routes
  app.get("/api/admin/funnels/:id/steps", requireAuth, async (req, res) => {
    try {
      const funnel = await storage.getFunnel(req.params.id);
      if (!funnel || funnel.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Funnel not found" });
      }
      const steps = await storage.getStepsByFunnel(req.params.id);
      res.json(steps);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/funnels/:id/steps", requireAuth, async (req, res) => {
    try {
      const funnel = await storage.getFunnel(req.params.id);
      if (!funnel || funnel.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Funnel not found" });
      }
      const schema = z.object({
        title: z.string().min(1),
        stepType: z.enum(["opt_in", "sales", "checkout", "thank_you", "custom"]).optional(),
        content: z.string().optional(),
        stepOrder: z.number().optional(),
      });
      const parsed = schema.parse(req.body);

      const existingSteps = await storage.getStepsByFunnel(req.params.id);
      const step = await storage.createStep({
        funnelId: req.params.id,
        tenantId: req.user!.tenantId,
        title: parsed.title,
        stepType: parsed.stepType || "custom",
        content: parsed.content || "[]",
        stepOrder: parsed.stepOrder ?? existingSteps.length,
      });
      res.json(step);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/funnels/:funnelId/steps/:stepId", requireAuth, async (req, res) => {
    try {
      const step = await storage.getStep(req.params.stepId);
      if (!step || step.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Step not found" });
      }
      const schema = z.object({
        title: z.string().min(1).optional(),
        stepType: z.enum(["opt_in", "sales", "checkout", "thank_you", "custom"]).optional(),
        content: z.string().optional(),
        stepOrder: z.number().optional(),
      });
      const parsed = schema.parse(req.body);
      const updated = await storage.updateStep(req.params.stepId, parsed);
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/funnels/:funnelId/steps/:stepId", requireAuth, async (req, res) => {
    try {
      const step = await storage.getStep(req.params.stepId);
      if (!step || step.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Step not found" });
      }
      await storage.deleteStep(req.params.stepId);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  }
  