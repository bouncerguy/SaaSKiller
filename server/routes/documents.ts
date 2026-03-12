import type { Express } from "express";
  import { storage } from "../storage";
  import { z } from "zod";
  import { requireAuth } from "../auth";

  export function registerDocumentRoutes(app: Express) {
    // ─── DOCUMENTS & SIGNING ─────────────────────────────────────────────

  const createDocumentSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    content: z.string().optional().nullable(),
    customerId: z.string().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
  });

  const updateDocumentSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    content: z.string().optional().nullable(),
    status: z.enum(["DRAFT", "SENT", "COMPLETED", "CANCELLED", "EXPIRED"]).optional(),
    customerId: z.string().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
  });

  app.get("/api/admin/documents", requireAuth, async (req, res) => {
    try {
      const docs = await storage.getDocumentsByTenant(req.user!.tenantId);
      const docsWithSigners = await Promise.all(docs.map(async (doc) => {
        const signers = await storage.getSignersByDocument(doc.id);
        return { ...doc, signers };
      }));
      res.json(docsWithSigners);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/documents", requireAuth, async (req, res) => {
    try {
      const parsed = createDocumentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const slug = parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
      const doc = await storage.createDocument({
        ...parsed.data,
        slug,
        tenantId: req.user!.tenantId,
        createdBy: req.user!.id,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      });
      await storage.createDocumentActivity({
        tenantId: req.user!.tenantId,
        documentId: doc.id,
        action: "created",
        details: `Document "${doc.title}" created`,
      });
      res.status(201).json(doc);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/documents/:id", requireAuth, async (req, res) => {
    try {
      const doc = await storage.getDocument(req.params.id);
      if (!doc || doc.tenantId !== req.user!.tenantId) return res.status(404).json({ message: "Document not found" });
      const signers = await storage.getSignersByDocument(doc.id);
      const activity = await storage.getDocumentActivity(doc.id);
      res.json({ ...doc, signers, activity });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/documents/:id", requireAuth, async (req, res) => {
    try {
      const doc = await storage.getDocument(req.params.id);
      if (!doc || doc.tenantId !== req.user!.tenantId) return res.status(404).json({ message: "Document not found" });
      const parsed = updateDocumentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const updateData: any = { ...parsed.data };
      if (parsed.data.expiresAt) updateData.expiresAt = new Date(parsed.data.expiresAt);
      const updated = await storage.updateDocument(doc.id, updateData);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/documents/:id", requireAuth, async (req, res) => {
    try {
      const doc = await storage.getDocument(req.params.id);
      if (!doc || doc.tenantId !== req.user!.tenantId) return res.status(404).json({ message: "Document not found" });
      await storage.deleteDocument(doc.id);
      res.json({ message: "Document deleted" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/documents/:id/send", requireAuth, async (req, res) => {
    try {
      const doc = await storage.getDocument(req.params.id);
      if (!doc || doc.tenantId !== req.user!.tenantId) return res.status(404).json({ message: "Document not found" });
      const signers = await storage.getSignersByDocument(doc.id);
      if (signers.length === 0) return res.status(400).json({ message: "Add at least one signer before sending" });
      const updated = await storage.updateDocument(doc.id, { status: "SENT" });
      await storage.createDocumentActivity({
        tenantId: req.user!.tenantId,
        documentId: doc.id,
        action: "sent",
        details: `Document sent to ${signers.length} signer(s)`,
      });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/documents/:id/activity", requireAuth, async (req, res) => {
    try {
      const doc = await storage.getDocument(req.params.id);
      if (!doc || doc.tenantId !== req.user!.tenantId) return res.status(404).json({ message: "Document not found" });
      const activity = await storage.getDocumentActivity(doc.id);
      res.json(activity);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  const createSignerSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    role: z.enum(["SIGNER", "VIEWER", "APPROVER"]).optional(),
    order: z.number().int().positive().optional(),
  });

  app.get("/api/admin/documents/:id/signers", requireAuth, async (req, res) => {
    try {
      const doc = await storage.getDocument(req.params.id);
      if (!doc || doc.tenantId !== req.user!.tenantId) return res.status(404).json({ message: "Document not found" });
      const signers = await storage.getSignersByDocument(doc.id);
      res.json(signers);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/documents/:id/signers", requireAuth, async (req, res) => {
    try {
      const doc = await storage.getDocument(req.params.id);
      if (!doc || doc.tenantId !== req.user!.tenantId) return res.status(404).json({ message: "Document not found" });
      const parsed = createSignerSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      const signer = await storage.createSigner({
        ...parsed.data,
        tenantId: req.user!.tenantId,
        documentId: doc.id,
      });
      await storage.createDocumentActivity({
        tenantId: req.user!.tenantId,
        documentId: doc.id,
        action: "signer_added",
        details: `Signer "${signer.name}" (${signer.email}) added`,
      });
      res.status(201).json(signer);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/documents/:id/signers/:signerId", requireAuth, async (req, res) => {
    try {
      const doc = await storage.getDocument(req.params.id);
      if (!doc || doc.tenantId !== req.user!.tenantId) return res.status(404).json({ message: "Document not found" });
      const signer = await storage.getSigner(req.params.signerId);
      if (!signer || signer.documentId !== doc.id) return res.status(404).json({ message: "Signer not found" });
      const updated = await storage.updateSigner(signer.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/documents/:id/signers/:signerId", requireAuth, async (req, res) => {
    try {
      const doc = await storage.getDocument(req.params.id);
      if (!doc || doc.tenantId !== req.user!.tenantId) return res.status(404).json({ message: "Document not found" });
      const signer = await storage.getSigner(req.params.signerId);
      if (!signer || signer.documentId !== doc.id) return res.status(404).json({ message: "Signer not found" });
      await storage.deleteSigner(signer.id);
      res.json({ message: "Signer removed" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Public Document Signing Routes
  app.get("/api/public/:tenantSlug/documents/:docSlug", async (req, res) => {
    try {
      const tenant = await storage.getTenantBySlug(req.params.tenantSlug as string);
      if (!tenant) return res.status(404).json({ message: "Not found" });
      const doc = await storage.getDocumentBySlug(tenant.id, req.params.docSlug as string);
      if (!doc || doc.status === "DRAFT") return res.status(404).json({ message: "Document not found" });
      const signers = await storage.getSignersByDocument(doc.id);
      res.json({
        document: { id: doc.id, title: doc.title, description: doc.description, content: doc.content, status: doc.status, expiresAt: doc.expiresAt },
        signers: signers.map(s => ({ id: s.id, name: s.name, role: s.role, status: s.status, order: s.order })),
        tenant: { name: tenant.name, slug: tenant.slug, brandColor: tenant.brandColor, logoUrl: tenant.logoUrl },
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/public/:tenantSlug/documents/:docSlug/signer/:signerId", async (req, res) => {
    try {
      const tenant = await storage.getTenantBySlug(req.params.tenantSlug as string);
      if (!tenant) return res.status(404).json({ message: "Not found" });
      const doc = await storage.getDocumentBySlug(tenant.id, req.params.docSlug as string);
      if (!doc || doc.status === "DRAFT") return res.status(404).json({ message: "Document not found" });
      const signer = await storage.getSigner(req.params.signerId);
      if (!signer || signer.documentId !== doc.id) return res.status(404).json({ message: "Signer not found" });

      if (signer.status === "PENDING") {
        await storage.updateSigner(signer.id, { status: "VIEWED" });
        await storage.createDocumentActivity({
          tenantId: tenant.id,
          documentId: doc.id,
          signerId: signer.id,
          action: "viewed",
          details: `${signer.name} viewed the document`,
          ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.ip,
        });
      }

      res.json({
        document: { id: doc.id, title: doc.title, description: doc.description, content: doc.content, status: doc.status, expiresAt: doc.expiresAt },
        signer: { id: signer.id, name: signer.name, email: signer.email, role: signer.role, status: signer.status, signedAt: signer.signedAt },
        tenant: { name: tenant.name, slug: tenant.slug, brandColor: tenant.brandColor, logoUrl: tenant.logoUrl },
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/public/:tenantSlug/documents/:docSlug/signer/:signerId/sign", async (req, res) => {
    try {
      const tenant = await storage.getTenantBySlug(req.params.tenantSlug as string);
      if (!tenant) return res.status(404).json({ message: "Not found" });
      const doc = await storage.getDocumentBySlug(tenant.id, req.params.docSlug as string);
      if (!doc || doc.status !== "SENT") return res.status(400).json({ message: "Document is not available for signing" });
      if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) return res.status(400).json({ message: "Document has expired" });
      const signer = await storage.getSigner(req.params.signerId);
      if (!signer || signer.documentId !== doc.id) return res.status(404).json({ message: "Signer not found" });
      if (signer.role === "VIEWER") return res.status(403).json({ message: "Viewers cannot sign documents" });
      if (signer.status === "SIGNED") return res.status(400).json({ message: "Already signed" });
      if (signer.status === "DECLINED") return res.status(400).json({ message: "Signer has declined" });

      const { signature } = req.body;
      if (!signature) return res.status(400).json({ message: "Signature is required" });

      const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.ip;
      await storage.updateSigner(signer.id, {
        status: "SIGNED",
        signature,
        signedAt: new Date(),
        ipAddress,
      });
      await storage.createDocumentActivity({
        tenantId: tenant.id,
        documentId: doc.id,
        signerId: signer.id,
        action: "signed",
        details: `${signer.name} signed the document`,
        ipAddress,
      });

      const allSigners = await storage.getSignersByDocument(doc.id);
      const signerRoles = allSigners.filter(s => s.role === "SIGNER" || s.role === "APPROVER");
      const allSigned = signerRoles.every(s => s.id === signer.id ? true : s.status === "SIGNED");
      if (allSigned) {
        await storage.updateDocument(doc.id, { status: "COMPLETED" });
        await storage.createDocumentActivity({
          tenantId: tenant.id,
          documentId: doc.id,
          action: "completed",
          details: "All signers have signed. Document completed.",
        });
      }

      res.json({ message: "Document signed successfully", completed: allSigned });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/public/:tenantSlug/documents/:docSlug/signer/:signerId/decline", async (req, res) => {
    try {
      const tenant = await storage.getTenantBySlug(req.params.tenantSlug as string);
      if (!tenant) return res.status(404).json({ message: "Not found" });
      const doc = await storage.getDocumentBySlug(tenant.id, req.params.docSlug as string);
      if (!doc || doc.status !== "SENT") return res.status(400).json({ message: "Document is not available for signing" });
      if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) return res.status(400).json({ message: "Document has expired" });
      const signer = await storage.getSigner(req.params.signerId);
      if (!signer || signer.documentId !== doc.id) return res.status(404).json({ message: "Signer not found" });
      if (signer.role === "VIEWER") return res.status(403).json({ message: "Viewers cannot decline documents" });
      if (signer.status === "SIGNED") return res.status(400).json({ message: "Already signed" });

      const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.ip;
      await storage.updateSigner(signer.id, { status: "DECLINED", ipAddress });
      await storage.createDocumentActivity({
        tenantId: tenant.id,
        documentId: doc.id,
        signerId: signer.id,
        action: "declined",
        details: `${signer.name} declined to sign. ${req.body.reason || ""}`.trim(),
        ipAddress,
      });

      res.json({ message: "Signing declined" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  }
  