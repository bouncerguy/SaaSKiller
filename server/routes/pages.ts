import type { Express } from "express";
  import { storage } from "../storage";
  import { z } from "zod";
  import { requireAuth } from "../auth";

  export function registerPageRoutes(app: Express) {
    // Pages Routes
  app.get("/api/admin/pages", requireAuth, async (req, res) => {
    try {
      const result = await storage.getPagesByTenant(req.user!.tenantId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/pages", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        content: z.string().optional(),
        metaDescription: z.string().optional(),
        status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
        isHomepage: z.boolean().optional(),
      });
      const parsed = schema.parse(req.body);
      const tenantId = req.user!.tenantId;

      if (parsed.isHomepage) {
        const existing = await storage.getPagesByTenant(tenantId);
        for (const p of existing) {
          if (p.isHomepage) {
            await storage.updatePage(p.id, { isHomepage: false });
          }
        }
      }

      const page = await storage.createPage({
        tenantId,
        title: parsed.title,
        slug: parsed.slug,
        content: parsed.content || "[]",
        metaDescription: parsed.metaDescription || null,
        status: parsed.status || "DRAFT",
        isHomepage: parsed.isHomepage || false,
      });
      res.json(page);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/pages/:id", requireAuth, async (req, res) => {
    try {
      const page = await storage.getPage(req.params.id);
      if (!page || page.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json(page);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/pages/:id", requireAuth, async (req, res) => {
    try {
      const page = await storage.getPage(req.params.id);
      if (!page || page.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Page not found" });
      }
      const schema = z.object({
        title: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        content: z.string().optional(),
        metaDescription: z.string().nullable().optional(),
        status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
        isHomepage: z.boolean().optional(),
      });
      const parsed = schema.parse(req.body);

      if (parsed.isHomepage) {
        const existing = await storage.getPagesByTenant(req.user!.tenantId);
        for (const p of existing) {
          if (p.isHomepage && p.id !== req.params.id) {
            await storage.updatePage(p.id, { isHomepage: false });
          }
        }
      }

      const updated = await storage.updatePage(req.params.id, parsed);
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/pages/:id", requireAuth, async (req, res) => {
    try {
      const page = await storage.getPage(req.params.id);
      if (!page || page.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Page not found" });
      }
      await storage.deletePage(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  }
  