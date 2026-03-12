import type { Express } from "express";
  import { storage } from "../storage";
  import { z } from "zod";
  import { requireAuth } from "../auth";
  import type { Lead } from "@shared/schema";

  const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  businessName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  billingType: z.string().optional().nullable(),
  paymentStatus: z.enum(["CURRENT", "PAST_DUE_30", "PAST_DUE_60", "COLLECTIONS"]).default("CURRENT"),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  businessName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  billingType: z.string().nullable().optional(),
  paymentStatus: z.enum(["CURRENT", "PAST_DUE_30", "PAST_DUE_60", "COLLECTIONS"]).optional(),
  isActive: z.boolean().optional(),
});

export function registerCrmRoutes(app: Express) {
    app.get("/api/admin/customers", requireAuth, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const result = search
        ? await storage.searchCustomers(req.user!.tenantId, search)
        : await storage.getCustomersByTenant(req.user!.tenantId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/customers", requireAuth, async (req, res) => {
    try {
      const parsed = createCustomerSchema.parse(req.body);
      const existing = await storage.getCustomerByEmail(req.user!.tenantId, parsed.email);
      if (existing) {
        return res.status(400).json({ message: "A customer with this email already exists" });
      }
      const customer = await storage.createCustomer({
        ...parsed,
        tenantId: req.user!.tenantId,
      });
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "customer",
        entityId: customer.id,
        action: "created",
        details: JSON.stringify({ name: customer.name, email: customer.email }),
      });
      res.json(customer);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/customers/:id", requireAuth, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id as string);
      if (!customer || customer.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Customer not found" });
      }
      const [customerNotes, activity, customerTickets, customerInvoices, customerTimeEntries] = await Promise.all([
        storage.getNotes("customer", customer.id, req.user!.tenantId),
        storage.getActivityLog({ entityType: "customer", entityId: customer.id, limit: 50 }),
        storage.getTicketsByCustomer(req.user!.tenantId, customer.id),
        storage.getInvoicesByCustomer(req.user!.tenantId, customer.id),
        storage.getTimeEntriesByCustomer(req.user!.tenantId, customer.id),
      ]);
      res.json({ customer, notes: customerNotes, activity, tickets: customerTickets, invoices: customerInvoices, timeEntries: customerTimeEntries });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/customers/:id", requireAuth, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id as string);
      if (!customer || customer.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Customer not found" });
      }
      const parsed = updateCustomerSchema.parse(req.body);
      const updated = await storage.updateCustomer(req.params.id as string, parsed);
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "customer",
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

  const createLeadSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    source: z.string().optional().nullable(),
    pipelineId: z.string().optional().nullable(),
    stage: z.string().optional(),
  });

  const updateLeadSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
    pipelineId: z.string().nullable().optional(),
    stage: z.string().optional(),
    awarenessData: z.string().nullable().optional(),
  });

  app.get("/api/admin/pipelines", requireAuth, async (req, res) => {
    try {
      let pipelinesList = await storage.getPipelinesByTenant(req.user!.tenantId);
      if (pipelinesList.length === 0) {
        const defaultPipeline = await storage.createPipeline({
          tenantId: req.user!.tenantId,
          name: "Sales Pipeline",
          stages: JSON.stringify(["New Lead", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]),
          isDefault: true,
        });
        pipelinesList = [defaultPipeline];
      }
      res.json(pipelinesList);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/pipelines", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1, "Pipeline name is required"),
        stages: z.string().min(1, "Stages are required"),
      });
      const parsed = schema.parse(req.body);
      const pipeline = await storage.createPipeline({
        tenantId: req.user!.tenantId,
        name: parsed.name,
        stages: parsed.stages,
        isDefault: false,
      });
      res.json(pipeline);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/pipelines/:id", requireAuth, async (req, res) => {
    try {
      const pipeline = await storage.getPipeline(req.params.id as string);
      if (!pipeline || pipeline.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Pipeline not found" });
      }
      const schema = z.object({
        name: z.string().min(1).optional(),
        stages: z.string().optional(),
      });
      const parsed = schema.parse(req.body);
      const updated = await storage.updatePipeline(req.params.id as string, parsed);
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/pipelines/:id", requireAuth, async (req, res) => {
    try {
      const pipeline = await storage.getPipeline(req.params.id as string);
      if (!pipeline || pipeline.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Pipeline not found" });
      }
      const pipelineLeads = await storage.getLeadsByPipeline(req.params.id as string);
      if (pipelineLeads.length > 0) {
        return res.status(400).json({ message: "Cannot delete pipeline with existing leads. Move or delete leads first." });
      }
      await storage.deletePipeline(req.params.id as string);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/leads", requireAuth, async (req, res) => {
    try {
      const pipelineId = req.query.pipelineId as string | undefined;
      if (pipelineId) {
        const pipeline = await storage.getPipeline(pipelineId);
        if (!pipeline || pipeline.tenantId !== req.user!.tenantId) {
          return res.status(404).json({ message: "Pipeline not found" });
        }
      }
      const result = pipelineId
        ? await storage.getLeadsByPipeline(pipelineId)
        : await storage.getLeadsByTenant(req.user!.tenantId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/leads", requireAuth, async (req, res) => {
    try {
      const parsed = createLeadSchema.parse(req.body);
      let pipelineId = parsed.pipelineId;
      let stage = parsed.stage || "New Lead";
      if (!pipelineId) {
        let pipelinesList = await storage.getPipelinesByTenant(req.user!.tenantId);
        if (pipelinesList.length === 0) {
          const defaultPipeline = await storage.createPipeline({
            tenantId: req.user!.tenantId,
            name: "Sales Pipeline",
            stages: JSON.stringify(["New Lead", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]),
            isDefault: true,
          });
          pipelinesList = [defaultPipeline];
        }
        pipelineId = pipelinesList[0].id;
      }
      const lead = await storage.createLead({
        tenantId: req.user!.tenantId,
        name: parsed.name,
        email: parsed.email || null,
        phone: parsed.phone || null,
        source: parsed.source || null,
        pipelineId,
        stage,
      });
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "lead",
        entityId: lead.id,
        action: "created",
        details: JSON.stringify({ name: lead.name, email: lead.email }),
      });
      res.json(lead);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/leads/:id", requireAuth, async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id as string);
      if (!lead || lead.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Lead not found" });
      }
      const leadNotes = await storage.getNotes("lead", lead.id);
      const activity = await storage.getActivityLog({ entityType: "lead", entityId: lead.id, limit: 50 });
      res.json({ lead, notes: leadNotes, activity });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/leads/:id", requireAuth, async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id as string);
      if (!lead || lead.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Lead not found" });
      }
      const parsed = updateLeadSchema.parse(req.body);
      const updated = await storage.updateLead(req.params.id as string, parsed);
      if (parsed.stage && parsed.stage !== lead.stage) {
        await storage.logActivity({
          tenantId: req.user!.tenantId,
          userId: req.user!.id,
          entityType: "lead",
          entityId: updated.id,
          action: "stage_changed",
          details: JSON.stringify({ from: lead.stage, to: parsed.stage }),
        });
      }
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/leads/:id", requireAuth, async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id as string);
      if (!lead || lead.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Lead not found" });
      }
      await storage.deleteLead(req.params.id as string);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/leads/:id/convert", requireAuth, async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id as string);
      if (!lead || lead.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Lead not found" });
      }
      if (!lead.email) {
        return res.status(400).json({ message: "Lead must have an email to convert to customer" });
      }
      const existingCustomer = await storage.getCustomerByEmail(req.user!.tenantId, lead.email);
      if (existingCustomer) {
        return res.status(400).json({ message: "A customer with this email already exists" });
      }
      const customer = await storage.createCustomer({
        tenantId: req.user!.tenantId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        paymentStatus: "CURRENT",
        isActive: true,
      });
      await storage.updateLead(lead.id, { stage: "Won" });
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "lead",
        entityId: lead.id,
        action: "converted_to_customer",
        details: JSON.stringify({ customerId: customer.id }),
      });
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "customer",
        entityId: customer.id,
        action: "created_from_lead",
        details: JSON.stringify({ leadId: lead.id }),
      });
      res.json({ customer, lead: { ...lead, stage: "Won" } });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/notes/:entityType/:entityId", requireAuth, async (req, res) => {
    try {
      const notesList = await storage.getNotes(req.params.entityType, req.params.entityId, req.user!.tenantId);
      res.json(notesList);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/notes", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        entityType: z.string().min(1),
        entityId: z.string().min(1),
        content: z.string().min(1, "Note content is required"),
      });
      const parsed = schema.parse(req.body);
      const note = await storage.createNote({
        tenantId: req.user!.tenantId,
        entityType: parsed.entityType,
        entityId: parsed.entityId,
        userId: req.user!.id,
        content: parsed.content,
      });
      res.json(note);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/notes/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteNote(req.params.id as string, req.user!.tenantId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  }
  