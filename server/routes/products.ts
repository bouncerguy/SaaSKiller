import type { Express } from "express";
  import { storage } from "../storage";
  import { z } from "zod";
  import { requireAuth } from "../auth";

  const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional().nullable(),
  price: z.number().int().min(0).default(0),
  billingCycle: z.enum(["ONE_TIME", "MONTHLY", "QUARTERLY", "YEARLY"]).default("ONE_TIME"),
  category: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().int().min(0).optional(),
  billingCycle: z.enum(["ONE_TIME", "MONTHLY", "QUARTERLY", "YEARLY"]).optional(),
  category: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export function registerProductRoutes(app: Express) {
    app.get("/api/admin/products", requireAuth, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const result = search
        ? await storage.searchProducts(req.user!.tenantId, search)
        : await storage.getProductsByTenant(req.user!.tenantId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/products", requireAuth, async (req, res) => {
    try {
      const parsed = createProductSchema.parse(req.body);
      const product = await storage.createProduct({
        ...parsed,
        tenantId: req.user!.tenantId,
      });
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "product",
        entityId: product.id,
        action: "created",
        details: JSON.stringify({ name: product.name }),
      });
      res.json(product);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/products/:id", requireAuth, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id as string);
      if (!product || product.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/products/:id", requireAuth, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id as string);
      if (!product || product.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Product not found" });
      }
      const parsed = updateProductSchema.parse(req.body);
      const updated = await storage.updateProduct(req.params.id as string, parsed);
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "product",
        entityId: updated.id,
        action: "updated",
        details: JSON.stringify(parsed),
      });
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/products/:id", requireAuth, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id as string);
      if (!product || product.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Product not found" });
      }
      await storage.deleteProduct(req.params.id as string);
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "product",
        entityId: req.params.id as string,
        action: "deleted",
        details: JSON.stringify({ name: product.name }),
      });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  }
  