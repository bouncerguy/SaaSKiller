import type { Express } from "express";
  import { storage } from "../storage";
  import { z } from "zod";
  import { requireAuth } from "../auth";
  import PDFDocument from "pdfkit";

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

  app.get("/api/admin/invoices/:id/pdf", requireAuth, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id as string);
      if (!invoice || invoice.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      const tenant = await storage.getTenant(req.user!.tenantId);
      let customer = null;
      if (invoice.customerId) {
        customer = await storage.getCustomer(invoice.customerId);
      }

      let lineItems: { description: string; quantity: number; unitPrice: number; amount: number }[] = [];
      try { lineItems = JSON.parse(invoice.lineItemsJson || "[]"); } catch {}

      const doc = new PDFDocument({ margin: 50, size: "A4" });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      doc.pipe(res);

      doc.fontSize(20).text(tenant?.name || "Company", 50, 50);
      doc.fontSize(10).fillColor("#666").text(tenant?.slug ? `${tenant.slug}` : "", 50, 75);

      doc.fontSize(24).fillColor("#000").text("INVOICE", 400, 50, { align: "right" });
      doc.fontSize(10).fillColor("#666");
      doc.text(`#${invoice.invoiceNumber}`, 400, 80, { align: "right" });
      doc.text(`Status: ${invoice.status}`, 400, 95, { align: "right" });
      doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 400, 110, { align: "right" });
      if (invoice.dueDate) {
        doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 125, { align: "right" });
      }

      doc.moveTo(50, 150).lineTo(545, 150).strokeColor("#ddd").stroke();

      let y = 170;
      if (customer) {
        doc.fontSize(10).fillColor("#333").text("Bill To:", 50, y);
        y += 15;
        doc.fontSize(11).fillColor("#000").text(customer.name, 50, y);
        y += 15;
        if (customer.email) { doc.fontSize(9).fillColor("#666").text(customer.email, 50, y); y += 12; }
        if (customer.phone) { doc.fontSize(9).text(customer.phone, 50, y); y += 12; }
      }

      y = Math.max(y, 210) + 20;

      if (lineItems.length > 0) {
        doc.fontSize(9).fillColor("#888");
        doc.text("DESCRIPTION", 50, y);
        doc.text("QTY", 300, y, { width: 50, align: "right" });
        doc.text("UNIT PRICE", 360, y, { width: 80, align: "right" });
        doc.text("AMOUNT", 450, y, { width: 95, align: "right" });
        y += 5;
        doc.moveTo(50, y + 10).lineTo(545, y + 10).strokeColor("#eee").stroke();
        y += 20;

        doc.fillColor("#000").fontSize(10);
        for (const item of lineItems) {
          doc.text(item.description || "", 50, y, { width: 240 });
          doc.text(String(item.quantity || 1), 300, y, { width: 50, align: "right" });
          doc.text(`$${((item.unitPrice || 0) / 100).toFixed(2)}`, 360, y, { width: 80, align: "right" });
          doc.text(`$${((item.amount || 0) / 100).toFixed(2)}`, 450, y, { width: 95, align: "right" });
          y += 20;
        }
        y += 10;
        doc.moveTo(50, y).lineTo(545, y).strokeColor("#eee").stroke();
        y += 15;
      }

      doc.fontSize(10).fillColor("#666");
      doc.text("Subtotal:", 380, y, { width: 70, align: "right" });
      doc.fillColor("#000").text(`$${(invoice.subtotal / 100).toFixed(2)}`, 450, y, { width: 95, align: "right" });
      y += 18;
      doc.fillColor("#666").text("Tax:", 380, y, { width: 70, align: "right" });
      doc.fillColor("#000").text(`$${(invoice.tax / 100).toFixed(2)}`, 450, y, { width: 95, align: "right" });
      y += 18;
      doc.moveTo(380, y).lineTo(545, y).strokeColor("#ddd").stroke();
      y += 10;
      doc.fontSize(13).fillColor("#000").text("Total:", 380, y, { width: 70, align: "right" });
      doc.text(`$${(invoice.total / 100).toFixed(2)}`, 450, y, { width: 95, align: "right" });

      if (invoice.notes) {
        y += 40;
        doc.fontSize(9).fillColor("#888").text("Notes:", 50, y);
        y += 12;
        doc.fontSize(10).fillColor("#333").text(invoice.notes, 50, y, { width: 495 });
      }

      doc.end();
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/invoices/:id/send", requireAuth, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id as string);
      if (!invoice || invoice.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      if (!invoice.customerId) {
        return res.status(400).json({ message: "Invoice has no customer assigned" });
      }
      const customer = await storage.getCustomer(invoice.customerId);
      if (!customer?.email) {
        return res.status(400).json({ message: "Customer has no email address" });
      }
      const tenant = await storage.getTenant(req.user!.tenantId);
      const { sendEmail } = await import("../email");

      let lineItems: any[] = [];
      try { lineItems = JSON.parse(invoice.lineItemsJson || "[]"); } catch {}
      const itemsHtml = lineItems.length > 0
        ? `<table style="width:100%;border-collapse:collapse;margin:16px 0"><tr style="background:#f5f5f5"><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd">Description</th><th style="text-align:right;padding:8px;border-bottom:1px solid #ddd">Qty</th><th style="text-align:right;padding:8px;border-bottom:1px solid #ddd">Price</th><th style="text-align:right;padding:8px;border-bottom:1px solid #ddd">Amount</th></tr>${lineItems.map((i: any) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.description || ""}</td><td style="text-align:right;padding:8px;border-bottom:1px solid #eee">${i.quantity || 1}</td><td style="text-align:right;padding:8px;border-bottom:1px solid #eee">$${((i.unitPrice || 0) / 100).toFixed(2)}</td><td style="text-align:right;padding:8px;border-bottom:1px solid #eee">$${((i.amount || 0) / 100).toFixed(2)}</td></tr>`).join("")}</table>`
        : "";

      const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2>Invoice ${invoice.invoiceNumber}</h2><p>Dear ${customer.name},</p><p>Please find your invoice details below.</p>${itemsHtml}<table style="margin-top:16px"><tr><td style="padding:4px 16px 4px 0;color:#666">Subtotal:</td><td style="text-align:right">$${(invoice.subtotal / 100).toFixed(2)}</td></tr><tr><td style="padding:4px 16px 4px 0;color:#666">Tax:</td><td style="text-align:right">$${(invoice.tax / 100).toFixed(2)}</td></tr><tr style="font-weight:bold;font-size:18px"><td style="padding:8px 16px 4px 0">Total:</td><td style="text-align:right">$${(invoice.total / 100).toFixed(2)}</td></tr></table>${invoice.dueDate ? `<p style="margin-top:16px;color:#666">Due date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>` : ""}${invoice.notes ? `<p style="margin-top:12px;color:#666;font-size:14px">Notes: ${invoice.notes}</p>` : ""}<p style="margin-top:24px">Thank you for your business!</p><p style="color:#999;font-size:12px">${tenant?.name || "Company"}</p></div>`;

      const result = await sendEmail({
        to: customer.email,
        toName: customer.name,
        subject: `Invoice ${invoice.invoiceNumber} from ${tenant?.name || "Company"}`,
        html,
        tenantId: req.user!.tenantId,
      });

      if (invoice.status === "DRAFT") {
        await storage.updateInvoice(invoice.id, { status: "SENT" });
      }

      res.json({ success: true, emailStatus: result.status });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  }
  