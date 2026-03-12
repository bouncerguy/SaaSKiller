import type { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { requireAuth } from "../auth";
import { runAgent, isOpenAIConfigured } from "../ai";

export function registerAgentRoutes(app: Express) {
  const createAgentSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional().nullable(),
    triggerType: z.enum(["manual", "schedule", "form_submission", "new_customer", "new_ticket"]).optional(),
  });

  const updateAgentSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    status: z.enum(["ACTIVE", "PAUSED", "DRAFT"]).optional(),
    triggerType: z.enum(["manual", "schedule", "form_submission", "new_customer", "new_ticket"]).optional(),
    triggerConfig: z.string().optional().nullable(),
    actionsJson: z.string().optional().nullable(),
  });

  app.get("/api/admin/agents", requireAuth, async (req, res) => {
    try {
      const result = await storage.getAgentsByTenant(req.user!.tenantId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/agents", requireAuth, async (req, res) => {
    try {
      const parsed = createAgentSchema.parse(req.body);
      const agent = await storage.createAgent({
        ...parsed,
        tenantId: req.user!.tenantId,
        createdByUserId: req.user!.id,
        status: "DRAFT",
        triggerType: parsed.triggerType || "manual",
        triggerConfig: "{}",
        actionsJson: "[]",
      });
      res.json(agent);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/agents/:id", requireAuth, async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id as string);
      if (!agent || agent.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Agent not found" });
      }
      const runs = await storage.getAgentRuns(agent.id);
      res.json({ ...agent, runs });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/agents/:id", requireAuth, async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id as string);
      if (!agent || agent.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Agent not found" });
      }
      const parsed = updateAgentSchema.parse(req.body);
      const updated = await storage.updateAgent(agent.id, parsed);
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/agents/:id", requireAuth, async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id as string);
      if (!agent || agent.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Agent not found" });
      }
      await storage.deleteAgent(agent.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/agents/status/ai", requireAuth, async (_req, res) => {
    res.json({ openaiConfigured: isOpenAIConfigured() });
  });

  app.post("/api/admin/agents/:id/run", requireAuth, async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id as string);
      if (!agent || agent.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Agent not found" });
      }

      const prompt = (req.body.prompt as string) || "Execute your configured actions.";

      const run = await storage.createAgentRun({
        tenantId: req.user!.tenantId,
        agentId: agent.id,
        status: "running",
        resultJson: null,
      });

      const aiResult = await runAgent({
        agentName: agent.name,
        agentDescription: agent.description,
        actionsJson: agent.actionsJson,
        triggerType: agent.triggerType,
        prompt,
      });

      const updatedRun = await storage.updateAgentRun(run.id, {
        status: aiResult.success ? "success" : "failed",
        completedAt: new Date(),
        resultJson: JSON.stringify({
          response: aiResult.response,
          model: aiResult.model,
          tokensUsed: aiResult.tokensUsed,
          triggeredBy: req.user!.name,
          prompt,
        }),
        errorMessage: aiResult.success ? null : aiResult.response,
      });

      await storage.incrementAgentRunCount(agent.id);
      res.json(updatedRun);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/agents/:id/runs", requireAuth, async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id as string);
      if (!agent || agent.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Agent not found" });
      }
      const runs = await storage.getAgentRuns(agent.id);
      res.json(runs);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/webhooks/agent/:id", async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id as string);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      if (agent.status !== "ACTIVE") {
        return res.status(400).json({ message: "Agent is not active" });
      }

      let triggerCfg: Record<string, any> = {};
      try { triggerCfg = JSON.parse(agent.triggerConfig || "{}"); } catch {}
      if (triggerCfg.webhookSecret) {
        const provided = req.headers["x-webhook-secret"] || req.query.secret;
        if (provided !== triggerCfg.webhookSecret) {
          return res.status(401).json({ message: "Invalid webhook secret" });
        }
      }

      const prompt = (req.body.prompt as string) || JSON.stringify(req.body);

      const run = await storage.createAgentRun({
        tenantId: agent.tenantId,
        agentId: agent.id,
        status: "running",
        resultJson: null,
      });

      const aiResult = await runAgent({
        agentName: agent.name,
        agentDescription: agent.description,
        actionsJson: agent.actionsJson,
        triggerType: agent.triggerType,
        prompt,
      });

      await storage.updateAgentRun(run.id, {
        status: aiResult.success ? "success" : "failed",
        completedAt: new Date(),
        resultJson: JSON.stringify({
          response: aiResult.response,
          model: aiResult.model,
          tokensUsed: aiResult.tokensUsed,
          source: "webhook",
        }),
        errorMessage: aiResult.success ? null : aiResult.response,
      });

      await storage.incrementAgentRunCount(agent.id);
      res.json({ success: aiResult.success, response: aiResult.response });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
}
