import type { Express } from "express";
  import { storage } from "../storage";
  import { z } from "zod";
  import { requireAuth } from "../auth";

  const createTicketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]).default("OPEN"),
  assignedUserId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
});

const updateTicketSchema = z.object({
  subject: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]).optional(),
  assignedUserId: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
});

export function registerSupportRoutes(app: Express) {
    app.get("/api/admin/tickets", requireAuth, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const result = await storage.getTicketsByTenant(req.user!.tenantId, status);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/tickets", requireAuth, async (req, res) => {
    try {
      const parsed = createTicketSchema.parse(req.body);
      const ticket = await storage.createTicket({
        ...parsed,
        tenantId: req.user!.tenantId,
        createdByUserId: req.user!.id,
      });
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "ticket",
        entityId: ticket.id,
        action: "created",
        details: JSON.stringify({ subject: ticket.subject }),
      });
      res.json(ticket);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/tickets/:id", requireAuth, async (req, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id as string);
      if (!ticket || ticket.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/tickets/:id", requireAuth, async (req, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id as string);
      if (!ticket || ticket.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      const parsed = updateTicketSchema.parse(req.body);
      const updated = await storage.updateTicket(req.params.id as string, parsed);
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "ticket",
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

  app.delete("/api/admin/tickets/:id", requireAuth, async (req, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id as string);
      if (!ticket || ticket.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      await storage.deleteTicket(req.params.id as string);
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "ticket",
        entityId: req.params.id as string,
        action: "deleted",
        details: JSON.stringify({ subject: ticket.subject }),
      });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  }
  