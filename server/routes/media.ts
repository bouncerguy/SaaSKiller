import type { Express } from "express";
  import { storage } from "../storage";
  import { z } from "zod";
  import { requireAuth } from "../auth";

  export function registerMediaRoutes(app: Express) {
    // ─── MEDIA ASSETS ──────────────────────────────────────────────────────

  const createMediaSchema = z.object({
    filename: z.string().min(1),
    originalName: z.string().min(1),
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().min(0).optional(),
    url: z.string().url(),
    alt: z.string().optional().nullable(),
    tagsJson: z.string().optional().nullable(),
    folder: z.string().optional().nullable(),
  });

  const updateMediaSchema = z.object({
    alt: z.string().optional().nullable(),
    tagsJson: z.string().optional().nullable(),
    folder: z.string().optional().nullable(),
    filename: z.string().min(1).optional(),
  });

  app.get("/api/admin/media", requireAuth, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const folder = req.query.folder as string | undefined;
      let result;
      if (search) {
        result = await storage.searchMediaAssets(req.user!.tenantId, search);
      } else {
        result = await storage.getMediaAssetsByTenant(req.user!.tenantId, folder);
      }
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/media", requireAuth, async (req, res) => {
    try {
      const parsed = createMediaSchema.parse(req.body);
      const asset = await storage.createMediaAsset({
        ...parsed,
        sizeBytes: parsed.sizeBytes || 0,
        tenantId: req.user!.tenantId,
        uploadedByUserId: req.user!.id,
      });
      res.json(asset);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/media/:id", requireAuth, async (req, res) => {
    try {
      const asset = await storage.getMediaAsset(req.params.id as string);
      if (!asset || asset.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Asset not found" });
      }
      res.json(asset);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/media/:id", requireAuth, async (req, res) => {
    try {
      const asset = await storage.getMediaAsset(req.params.id as string);
      if (!asset || asset.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Asset not found" });
      }
      const parsed = updateMediaSchema.parse(req.body);
      const updated = await storage.updateMediaAsset(asset.id, parsed);
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/media/:id", requireAuth, async (req, res) => {
    try {
      const asset = await storage.getMediaAsset(req.params.id as string);
      if (!asset || asset.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Asset not found" });
      }
      await storage.deleteMediaAsset(asset.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  }
  