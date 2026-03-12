import type { Express } from "express";
  import { storage } from "../storage";
  import { z } from "zod";
  import { requireAuth } from "../auth";

  const createInvoiceSchema = z.object({
  customerId: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).default("DRAFT"),
  subtotal: z.number().int().min(0).default(0),
  tax: z.number().int().min(0).default(0),
  total: z.number().int().min(0).default(0),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lineItemsJson: z.string().optional(),
});

const updateInvoiceSchema = z.object({
  customerId: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  subtotal: z.number().int().min(0).optional(),
  tax: z.number().int().min(0).optional(),
  total: z.number().int().min(0).optional(),
  dueDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  lineItemsJson: z.string().optional(),
});

export function registerFinanceRoutes(app: Express) {
    app.get("/api/admin/invoices", requireAuth, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const result = await storage.getInvoicesByTenant(req.user!.tenantId, status);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/invoices/next-number", requireAuth, async (req, res) => {
    try {
      const num = await storage.getNextInvoiceNumber(req.user!.tenantId);
      res.json({ invoiceNumber: num });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/invoices", requireAuth, async (req, res) => {
    try {
      const parsed = createInvoiceSchema.parse(req.body);
      const invoiceNumber = await storage.getNextInvoiceNumber(req.user!.tenantId);
      const invoice = await storage.createInvoice({
        ...parsed,
        invoiceNumber,
        tenantId: req.user!.tenantId,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      });
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "invoice",
        entityId: invoice.id,
        action: "created",
        details: JSON.stringify({ invoiceNumber: invoice.invoiceNumber }),
      });
      res.json(invoice);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/invoices/:id", requireAuth, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id as string);
      if (!invoice || invoice.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/invoices/:id", requireAuth, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id as string);
      if (!invoice || invoice.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      const parsed = updateInvoiceSchema.parse(req.body);
      const updateData: any = { ...parsed };
      if (parsed.dueDate) {
        updateData.dueDate = new Date(parsed.dueDate);
      }
      const updated = await storage.updateInvoice(req.params.id as string, updateData);
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "invoice",
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

  app.delete("/api/admin/invoices/:id", requireAuth, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id as string);
      if (!invoice || invoice.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      await storage.deleteInvoice(req.params.id as string);
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "invoice",
        entityId: req.params.id as string,
        action: "deleted",
        details: JSON.stringify({ invoiceNumber: invoice.invoiceNumber }),
      });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  const createTimeEntrySchema = z.object({
    description: z.string().optional().nullable(),
    startAt: z.string(),
    endAt: z.string().optional().nullable(),
    durationMinutes: z.number().int().min(0).optional().nullable(),
    billable: z.boolean().default(true),
    hourlyRate: z.number().int().min(0).optional().nullable(),
    customerId: z.string().optional().nullable(),
  });

  const updateTimeEntrySchema = z.object({
    description: z.string().nullable().optional(),
    startAt: z.string().optional(),
    endAt: z.string().nullable().optional(),
    durationMinutes: z.number().int().min(0).nullable().optional(),
    billable: z.boolean().optional(),
    hourlyRate: z.number().int().min(0).nullable().optional(),
    customerId: z.string().nullable().optional(),
  });

  app.get("/api/admin/time-entries", requireAuth, async (req, res) => {
    try {
      const result = await storage.getTimeEntriesByTenant(req.user!.tenantId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/time-entries", requireAuth, async (req, res) => {
    try {
      const parsed = createTimeEntrySchema.parse(req.body);
      const startAt = new Date(parsed.startAt);
      const endAt = parsed.endAt ? new Date(parsed.endAt) : null;
      let durationMinutes = parsed.durationMinutes || null;
      if (!durationMinutes && endAt) {
        durationMinutes = Math.round((endAt.getTime() - startAt.getTime()) / 60000);
      }
      const entry = await storage.createTimeEntry({
        ...parsed,
        startAt,
        endAt,
        durationMinutes,
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
      });
      res.json(entry);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/time-entries/:id", requireAuth, async (req, res) => {
    try {
      const entry = await storage.getTimeEntry(req.params.id as string);
      if (!entry || entry.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      const parsed = updateTimeEntrySchema.parse(req.body);
      const updateData: any = { ...parsed };
      if (parsed.startAt) updateData.startAt = new Date(parsed.startAt);
      if (parsed.endAt) updateData.endAt = new Date(parsed.endAt);
      const updated = await storage.updateTimeEntry(req.params.id as string, updateData);
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/time-entries/:id", requireAuth, async (req, res) => {
    try {
      const entry = await storage.getTimeEntry(req.params.id as string);
      if (!entry || entry.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      await storage.deleteTimeEntry(req.params.id as string);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  }
  