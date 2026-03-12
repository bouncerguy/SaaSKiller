import type { Express } from "express";
  import { storage } from "../storage";
  import { requireAuth } from "../auth";

  export function registerSecureMessageRoutes(app: Express) {
    // ── Secure Messages (Admin) ──
  app.get("/api/admin/secure-messages", requireAuth, async (req, res) => {
    try {
      const messages = await storage.getSecureMessagesByTenant(req.user!.tenantId);
      res.json(messages);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/secure-messages", requireAuth, async (req, res) => {
    try {
      const { recipientName, recipientEmail, subject, body, customerId, expiresAt } = req.body;
      if (!recipientName || !recipientEmail || !subject || !body) {
        return res.status(400).json({ message: "recipientName, recipientEmail, subject, and body are required" });
      }
      const msg = await storage.createSecureMessage({
        tenantId: req.user!.tenantId,
        createdByUserId: req.user!.id,
        recipientName,
        recipientEmail,
        subject,
        body,
        customerId: customerId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: "DRAFT",
        sentAt: null,
        readAt: null,
      });
      res.json(msg);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/secure-messages/:id", requireAuth, async (req, res) => {
    try {
      const msg = await storage.getSecureMessage(req.params.id);
      if (!msg || msg.tenantId !== req.user!.tenantId) return res.status(404).json({ message: "Message not found" });
      const activity = await storage.getSecureMessageActivity(msg.id);
      const tenant = await storage.getTenant(msg.tenantId);
      res.json({ ...msg, activity, tenantSlug: tenant?.slug });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/secure-messages/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getSecureMessage(req.params.id);
      if (!existing || existing.tenantId !== req.user!.tenantId) return res.status(404).json({ message: "Message not found" });
      const { recipientName, recipientEmail, subject, body, customerId, expiresAt } = req.body;
      const msg = await storage.updateSecureMessage(req.params.id, {
        ...(recipientName !== undefined && { recipientName }),
        ...(recipientEmail !== undefined && { recipientEmail }),
        ...(subject !== undefined && { subject }),
        ...(body !== undefined && { body }),
        ...(customerId !== undefined && { customerId: customerId || null }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      });
      res.json(msg);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/secure-messages/:id", requireAuth, async (req, res) => {
    try {
      const msg = await storage.getSecureMessage(req.params.id);
      if (!msg || msg.tenantId !== req.user!.tenantId) return res.status(404).json({ message: "Message not found" });
      if (msg.status !== "DRAFT") return res.status(400).json({ message: "Only draft messages can be deleted" });
      await storage.deleteSecureMessage(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/secure-messages/:id/send", requireAuth, async (req, res) => {
    try {
      const msg = await storage.getSecureMessage(req.params.id);
      if (!msg || msg.tenantId !== req.user!.tenantId) return res.status(404).json({ message: "Message not found" });
      if (msg.status !== "DRAFT") return res.status(400).json({ message: "Only draft messages can be sent" });
      const tenant = await storage.getTenant(req.user!.tenantId);
      const secureLink = `/secure/${tenant?.slug || msg.tenantId}/${msg.accessToken}`;
      const updated = await storage.updateSecureMessage(msg.id, {
        status: "SENT",
        sentAt: new Date(),
      });
      await storage.createSecureMessageActivity({
        tenantId: msg.tenantId,
        messageId: msg.id,
        action: "SENT",
        details: `Message sent to ${msg.recipientEmail}`,
      });
      await storage.createEmailLog({
        tenantId: msg.tenantId,
        templateId: null,
        toEmail: msg.recipientEmail,
        toName: msg.recipientName,
        subject: `You have a secure message from ${tenant?.name || "your organization"}. Verify your identity to view it at: ${secureLink}`,
        status: "QUEUED",
      });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/secure-messages/:id/activity", requireAuth, async (req, res) => {
    try {
      const msg = await storage.getSecureMessage(req.params.id);
      if (!msg || msg.tenantId !== req.user!.tenantId) return res.status(404).json({ message: "Message not found" });
      const activity = await storage.getSecureMessageActivity(req.params.id);
      res.json(activity);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ── Public Secure Message Routes ──
  app.get("/api/public/:tenantSlug/secure/:token", async (req, res) => {
    try {
      const tenant = await storage.getTenantBySlug(req.params.tenantSlug);
      if (!tenant) return res.status(404).json({ message: "Not found" });
      const msg = await storage.getSecureMessageByToken(req.params.token);
      if (!msg || msg.tenantId !== tenant.id) return res.status(404).json({ message: "Message not found" });
      if (msg.status === "DRAFT") return res.status(404).json({ message: "Message not found" });
      if (msg.status === "EXPIRED" || (msg.expiresAt && new Date(msg.expiresAt) < new Date())) {
        if (msg.status !== "EXPIRED") {
          await storage.updateSecureMessage(msg.id, { status: "EXPIRED" });
        }
        return res.status(410).json({ message: "This message has expired" });
      }
      res.json({
        id: msg.id,
        recipientName: msg.recipientName,
        status: msg.status,
        expiresAt: msg.expiresAt,
        tenant: { name: tenant.name, slug: tenant.slug, brandColor: tenant.brandColor, logoUrl: tenant.logoUrl },
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/public/:tenantSlug/secure/:token/verify", async (req, res) => {
    try {
      const tenant = await storage.getTenantBySlug(req.params.tenantSlug);
      if (!tenant) return res.status(404).json({ message: "Not found" });
      const msg = await storage.getSecureMessageByToken(req.params.token);
      if (!msg || msg.tenantId !== tenant.id) return res.status(404).json({ message: "Message not found" });
      if (msg.status === "DRAFT") return res.status(403).json({ message: "This message has not been sent yet" });
      if (msg.status === "EXPIRED" || (msg.expiresAt && new Date(msg.expiresAt) < new Date())) {
        return res.status(410).json({ message: "This message has expired" });
      }
      const { email } = req.body;
      if (!email || email.toLowerCase() !== msg.recipientEmail.toLowerCase()) {
        await storage.createSecureMessageActivity({
          tenantId: msg.tenantId,
          messageId: msg.id,
          action: "VERIFY_FAILED",
          details: `Verification attempt with email: ${email}`,
          ipAddress: req.ip || null,
        });
        return res.status(403).json({ message: "Email does not match. Please enter the email address this message was sent to." });
      }
      if (msg.status === "SENT") {
        await storage.updateSecureMessage(msg.id, {
          status: "READ",
          readAt: new Date(),
        });
      }
      await storage.createSecureMessageActivity({
        tenantId: msg.tenantId,
        messageId: msg.id,
        action: "VERIFIED",
        details: `Recipient verified via ${email}`,
        ipAddress: req.ip || null,
      });
      await storage.createSecureMessageActivity({
        tenantId: msg.tenantId,
        messageId: msg.id,
        action: "VIEWED",
        details: `Message viewed by ${msg.recipientName}`,
        ipAddress: req.ip || null,
      });
      res.json({
        id: msg.id,
        subject: msg.subject,
        body: msg.body,
        recipientName: msg.recipientName,
        recipientEmail: msg.recipientEmail,
        sentAt: msg.sentAt,
        tenant: { name: tenant.name, slug: tenant.slug, brandColor: tenant.brandColor, logoUrl: tenant.logoUrl },
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  }
  