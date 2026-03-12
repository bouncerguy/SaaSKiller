import type { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { requireAuth } from "../auth";
import { sendEmail, sendTemplateEmail, isSmtpConfigured } from "../email";

export function registerEmailRoutes(app: Express) {
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

  app.get("/api/admin/email/status", requireAuth, async (_req, res) => {
    res.json({ smtpConfigured: isSmtpConfigured() });
  });

  const sendEmailSchema = z.object({
    to: z.string().email(),
    toName: z.string().optional(),
    subject: z.string().min(1),
    html: z.string().optional(),
    text: z.string().optional(),
  });

  app.post("/api/admin/email/send", requireAuth, async (req, res) => {
    try {
      const parsed = sendEmailSchema.parse(req.body);
      const result = await sendEmail({
        tenantId: req.user!.tenantId,
        to: parsed.to,
        toName: parsed.toName,
        subject: parsed.subject,
        html: parsed.html,
        text: parsed.text,
      });
      res.json(result);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  const sendTemplateSchema = z.object({
    templateId: z.string().min(1),
    to: z.string().email(),
    toName: z.string().optional(),
    variables: z.record(z.string()).optional(),
  });

  app.post("/api/admin/email/send-template", requireAuth, async (req, res) => {
    try {
      const parsed = sendTemplateSchema.parse(req.body);
      const result = await sendTemplateEmail(
        req.user!.tenantId,
        parsed.templateId,
        parsed.to,
        parsed.toName,
        parsed.variables || {},
      );
      res.json(result);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  const sendBulkSchema = z.object({
    recipients: z.array(z.object({
      to: z.string().email(),
      toName: z.string().optional(),
      variables: z.record(z.string()).optional(),
    })).min(1).max(500),
    templateId: z.string().min(1).optional(),
    subject: z.string().min(1).optional(),
    html: z.string().optional(),
    text: z.string().optional(),
  });

  app.post("/api/admin/email/send-bulk", requireAuth, async (req, res) => {
    try {
      const parsed = sendBulkSchema.parse(req.body);
      const results: Array<{ to: string; status: string; logId: string }> = [];

      for (const recipient of parsed.recipients) {
        try {
          let result;
          if (parsed.templateId) {
            result = await sendTemplateEmail(
              req.user!.tenantId,
              parsed.templateId,
              recipient.to,
              recipient.toName,
              recipient.variables || {},
            );
          } else {
            if (!parsed.subject) throw new Error("Subject required when not using a template");
            result = await sendEmail({
              tenantId: req.user!.tenantId,
              to: recipient.to,
              toName: recipient.toName,
              subject: parsed.subject,
              html: parsed.html,
              text: parsed.text,
            });
          }
          results.push({ to: recipient.to, ...result });
        } catch (err: any) {
          results.push({ to: recipient.to, status: "FAILED", logId: "" });
        }
      }

      const sent = results.filter((r) => r.status === "SENT").length;
      const queued = results.filter((r) => r.status === "QUEUED").length;
      const failed = results.filter((r) => r.status === "FAILED").length;

      res.json({ total: results.length, sent, queued, failed, results });
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });
}
