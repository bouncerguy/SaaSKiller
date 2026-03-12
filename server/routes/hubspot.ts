import type { Express } from "express";
  import { storage } from "../storage";
  import { z } from "zod";
  import { requireAuth } from "../auth";
  import { fetchHubSpotContacts, fetchHubSpotWorkflows, mapContactName, isHubSpotConfigured } from "../hubspot";

  export function registerHubSpotRoutes(app: Express) {
    // HubSpot Integration Routes
  app.get("/api/admin/hubspot/status", requireAuth, async (_req, res) => {
    res.json({ configured: isHubSpotConfigured() });
  });

  app.get("/api/admin/hubspot/contacts", requireAuth, async (req, res) => {
    try {
      const contacts = await fetchHubSpotContacts(500);
      const mapped = contacts.map((c) => ({
        hubspotId: c.id,
        name: mapContactName(c),
        email: c.properties.email || "",
        phone: c.properties.phone || "",
        company: c.properties.company || "",
        address: c.properties.address || "",
        lifecycleStage: c.properties.lifecyclestage || "",
      }));
      res.json(mapped);
    } catch (e: any) {
      res.status(502).json({ message: e.message });
    }
  });

  app.post("/api/admin/hubspot/import-customers", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        contacts: z.array(z.object({
          name: z.string(),
          email: z.string(),
          phone: z.string().optional(),
          company: z.string().optional(),
          address: z.string().optional(),
        })),
      });
      const { contacts } = schema.parse(req.body);
      const tenantId = req.user!.tenantId;

      const existing = await storage.getCustomersByTenant(tenantId);
      const existingEmails = new Set(existing.map((c) => c.email?.toLowerCase()));

      let imported = 0;
      let skipped = 0;

      for (const contact of contacts) {
        if (contact.email && existingEmails.has(contact.email.toLowerCase())) {
          skipped++;
          continue;
        }
        await storage.createCustomer({
          tenantId,
          name: contact.name,
          email: contact.email,
          phone: contact.phone || null,
          businessName: contact.company || null,
          address: contact.address || null,
          paymentStatus: "CURRENT",
          isActive: true,
        });
        imported++;
      }

      res.json({ imported, skipped, total: contacts.length });
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(502).json({ message: e.message });
    }
  });

  app.post("/api/admin/hubspot/import-leads", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        contacts: z.array(z.object({
          name: z.string(),
          email: z.string().optional(),
          phone: z.string().optional(),
          company: z.string().optional(),
        })),
        pipelineId: z.string().optional(),
      });
      const { contacts, pipelineId } = schema.parse(req.body);
      const tenantId = req.user!.tenantId;

      const existing = await storage.getLeadsByTenant(tenantId);
      const existingEmails = new Set(
        existing.filter((l) => l.email).map((l) => l.email!.toLowerCase())
      );

      let imported = 0;
      let skipped = 0;

      for (const contact of contacts) {
        if (contact.email && existingEmails.has(contact.email.toLowerCase())) {
          skipped++;
          continue;
        }
        await storage.createLead({
          tenantId,
          name: contact.name,
          email: contact.email || null,
          phone: contact.phone || null,
          source: contact.company ? `HubSpot (${contact.company})` : "HubSpot",
          pipelineId: pipelineId || null,
          stage: "New Lead",
        });
        imported++;
      }

      res.json({ imported, skipped, total: contacts.length });
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(502).json({ message: e.message });
    }
  });

  app.get("/api/admin/hubspot/workflows", requireAuth, async (_req, res) => {
    try {
      const workflows = await fetchHubSpotWorkflows();
      res.json(workflows);
    } catch (e: any) {
      res.status(502).json({ message: e.message });
    }
  });

  app.post("/api/admin/hubspot/import-workflows", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        workflows: z.array(z.object({
          id: z.number(),
          name: z.string(),
          type: z.string(),
          enabled: z.boolean(),
          actions: z.any().optional(),
        })),
      });
      const { workflows } = schema.parse(req.body);
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;

      let imported = 0;

      for (const wf of workflows) {
        const triggerTypeMap: Record<string, string> = {
          "CONTACT_BASED": "new_customer",
          "TICKET_BASED": "new_ticket",
          "DEAL_BASED": "manual",
          "FORM_BASED": "form_submission",
        };

        await storage.createAgent({
          tenantId,
          name: `[HubSpot] ${wf.name}`,
          description: `Imported from HubSpot (${wf.type}, ID: ${wf.id}). Originally ${wf.enabled ? "enabled" : "disabled"}.`,
          status: "DRAFT",
          triggerType: triggerTypeMap[wf.type] || "manual",
          triggerConfig: JSON.stringify({ hubspotId: wf.id, hubspotType: wf.type }),
          actionsJson: JSON.stringify(wf.actions || []),
          createdByUserId: userId,
        });
        imported++;
      }

      res.json({ imported, total: workflows.length });
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(502).json({ message: e.message });
    }
  });
  }
  