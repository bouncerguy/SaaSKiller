import type { Express } from "express";
  import { storage } from "../storage";
  import { z } from "zod";
  import { requireAuth, hashPassword } from "../auth";

  const addTeamMemberSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["OWNER", "MEMBER"]).default("MEMBER"),
  });

  const updateTeamMemberSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    role: z.enum(["OWNER", "MEMBER"]).optional(),
  }).strict();

  export function registerAdminRoutes(app: Express) {
    app.get("/api/admin/tenant", requireAuth, async (req, res) => {
    try {
      const tenant = await storage.getTenant(req.user!.tenantId);
      if (!tenant) return res.status(404).json({ message: "Tenant not found" });
      res.json(tenant);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/tenant", requireAuth, async (req, res) => {
    try {
      const updateTenantSchema = z.object({
        name: z.string().min(1).optional(),
        brandColor: z.string().optional(),
        timezone: z.string().optional(),
        logoUrl: z.string().nullable().optional(),
        calendarIcsUrl: z.string().url().nullable().optional(),
      }).strict();

      const parsed = updateTenantSchema.parse(req.body);

      if (parsed.calendarIcsUrl) {
        const url = new URL(parsed.calendarIcsUrl);
        if (!["http:", "https:"].includes(url.protocol)) {
          return res.status(400).json({ message: "Only http/https calendar URLs are supported" });
        }
      }

      const updated = await storage.updateTenant(req.user!.tenantId, parsed);
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/video-settings", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const videoProvider = await storage.getSetting(`video_provider:${tenantId}`);
      const jitsiServerUrl = await storage.getSetting(`jitsi_server_url:${tenantId}`);
      res.json({
        videoProvider: videoProvider || "none",
        jitsiServerUrl: jitsiServerUrl || "",
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/video-settings", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const schema = z.object({
        videoProvider: z.enum(["none", "jitsi", "zoom"]),
        jitsiServerUrl: z.string().optional(),
      });
      const parsed = schema.parse(req.body);
      await storage.setSetting(`video_provider:${tenantId}`, parsed.videoProvider, "video");
      if (parsed.jitsiServerUrl !== undefined) {
        await storage.setSetting(`jitsi_server_url:${tenantId}`, parsed.jitsiServerUrl, "video");
      }
      res.json({ videoProvider: parsed.videoProvider, jitsiServerUrl: parsed.jitsiServerUrl || "" });
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/domains", requireAuth, async (req, res) => {
    try {
      const domainsList = await storage.getDomainsByTenant(req.user!.tenantId);
      res.json(domainsList);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/domains", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        domain: z.string().min(1).refine(
          (val) => /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(val),
          { message: "Enter a valid domain name (e.g., example.com)" }
        ),
        isPrimary: z.boolean().optional(),
      });
      const parsed = schema.parse(req.body);

      if (parsed.isPrimary) {
        const existing = await storage.getDomainsByTenant(req.user!.tenantId);
        for (const d of existing) {
          if (d.isPrimary) {
            await storage.updateDomain(d.id, { isPrimary: false });
          }
        }
      }

      const domain = await storage.createDomain({
        tenantId: req.user!.tenantId,
        domain: parsed.domain.toLowerCase(),
        isPrimary: parsed.isPrimary || false,
      });
      res.json(domain);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/domains/:id", requireAuth, async (req, res) => {
    try {
      const tenantDomains = await storage.getDomainsByTenant(req.user!.tenantId);
      const target = tenantDomains.find(d => d.id === req.params.id);
      if (!target) return res.status(404).json({ message: "Domain not found" });

      const schema = z.object({
        isPrimary: z.boolean().optional(),
      });
      const parsed = schema.parse(req.body);

      if (parsed.isPrimary) {
        for (const d of tenantDomains) {
          if (d.isPrimary && d.id !== req.params.id) {
            await storage.updateDomain(d.id, { isPrimary: false });
          }
        }
      }

      const updated = await storage.updateDomain(req.params.id, parsed);
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/domains/:id", requireAuth, async (req, res) => {
    try {
      const tenantDomains = await storage.getDomainsByTenant(req.user!.tenantId);
      const target = tenantDomains.find(d => d.id === req.params.id);
      if (!target) return res.status(404).json({ message: "Domain not found" });

      await storage.deleteDomain(req.params.id);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/server-info", requireAuth, async (req, res) => {
    try {
      const os = await import("os");
      const interfaces = os.networkInterfaces();
      let serverIp = "127.0.0.1";

      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
          if (iface.family === "IPv4" && !iface.internal) {
            serverIp = iface.address;
            break;
          }
        }
      }

      const hostname = req.headers.host || os.hostname();

      res.json({
        serverIp,
        hostname,
        port: process.env.PORT || "5000",
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  }
  