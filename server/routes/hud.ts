import type { Express } from "express";
  import { storage } from "../storage";
  import { z } from "zod";
  import { requireAuth } from "../auth";

  export function registerHudRoutes(app: Express) {
    app.get("/api/hud/groups", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can manage groups" });
      }
      const groupsList = await storage.getGroupsByTenant(req.user!.tenantId);
      const groupsWithCounts = await Promise.all(
        groupsList.map(async (group) => {
          const members = await storage.getGroupMembers(group.id);
          return { ...group, memberCount: members.length };
        })
      );
      res.json(groupsWithCounts);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/hud/groups", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can create groups" });
      }
      const schema = z.object({
        name: z.string().min(1, "Group name is required"),
        description: z.string().optional().nullable(),
      });
      const parsed = schema.parse(req.body);
      const group = await storage.createGroup({
        tenantId: req.user!.tenantId,
        name: parsed.name,
        description: parsed.description || null,
      });
      res.json(group);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/hud/groups/:id", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can update groups" });
      }
      const group = await storage.getGroup(req.params.id as string);
      if (!group || group.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Group not found" });
      }
      const schema = z.object({
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
      });
      const parsed = schema.parse(req.body);
      const updated = await storage.updateGroup(req.params.id as string, parsed);
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/hud/groups/:id", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can delete groups" });
      }
      const group = await storage.getGroup(req.params.id as string);
      if (!group || group.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Group not found" });
      }
      await storage.deleteGroup(req.params.id as string);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/hud/groups/:id/members", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can view group members" });
      }
      const group = await storage.getGroup(req.params.id as string);
      if (!group || group.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Group not found" });
      }
      const members = await storage.getGroupMembers(req.params.id as string);
      const safeMembers = members.map(({ passwordHash, ...rest }) => rest);
      res.json(safeMembers);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/hud/groups/:id/members", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can manage group members" });
      }
      const group = await storage.getGroup(req.params.id as string);
      if (!group || group.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Group not found" });
      }
      const schema = z.object({ userId: z.string().min(1) });
      const { userId } = schema.parse(req.body);
      const targetUser = await storage.getUser(userId);
      if (!targetUser || targetUser.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "User not found" });
      }
      const ug = await storage.addUserToGroup(userId, req.params.id as string);
      res.json(ug);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/hud/groups/:id/members", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can manage group members" });
      }
      const group = await storage.getGroup(req.params.id as string);
      if (!group || group.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Group not found" });
      }
      const schema = z.object({ userId: z.string().min(1) });
      const { userId } = schema.parse(req.body);
      await storage.removeUserFromGroup(userId, req.params.id as string);
      res.json({ success: true });
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/hud/groups/:id/features", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can view group features" });
      }
      const group = await storage.getGroup(req.params.id as string);
      if (!group || group.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Group not found" });
      }
      const allFeatures = await storage.getFeatures();
      const gf = await storage.getGroupFeatures(req.params.id as string);
      const result = allFeatures.map((feature) => {
        const override = gf.find((g) => g.featureId === feature.id);
        return {
          featureId: feature.id,
          featureName: feature.name,
          featureSlug: feature.slug,
          enabledGlobally: feature.enabledGlobally,
          enabled: override ? override.enabled : feature.enabledGlobally,
          hasOverride: !!override,
        };
      });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/hud/groups/:id/features", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can manage group features" });
      }
      const group = await storage.getGroup(req.params.id as string);
      if (!group || group.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Group not found" });
      }
      const schema = z.object({
        featureId: z.string().min(1),
        enabled: z.boolean(),
      });
      const { featureId, enabled } = schema.parse(req.body);
      await storage.setGroupFeature(req.params.id as string, featureId, enabled);
      res.json({ success: true });
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/hud/users", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can manage users" });
      }
      const members = await storage.getUsersByTenant(req.user!.tenantId);
      const usersWithGroups = await Promise.all(
        members.map(async ({ passwordHash, ...rest }) => {
          const userGroupsList = await storage.getUserGroups(rest.id);
          return { ...rest, groups: userGroupsList };
        })
      );
      res.json(usersWithGroups);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/hud/users/:id/active", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can manage users" });
      }
      const targetUser = await storage.getUser(req.params.id as string);
      if (!targetUser || targetUser.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "User not found" });
      }
      if ((req.params.id as string) === req.user!.id) {
        return res.status(400).json({ message: "Cannot deactivate yourself" });
      }
      const schema = z.object({ isActive: z.boolean() });
      const { isActive } = schema.parse(req.body);
      const updated = await storage.updateUser(req.params.id as string, { isActive });
      const { passwordHash: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/hud/users/:id/groups", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can manage user groups" });
      }
      const targetUser = await storage.getUser(req.params.id as string);
      if (!targetUser || targetUser.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "User not found" });
      }
      const schema = z.object({ groupId: z.string().min(1) });
      const { groupId } = schema.parse(req.body);
      const group = await storage.getGroup(groupId);
      if (!group || group.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Group not found" });
      }
      const ug = await storage.addUserToGroup(req.params.id as string, groupId);
      res.json(ug);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/hud/users/:id/groups/:groupId", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can manage user groups" });
      }
      const targetUser = await storage.getUser(req.params.id as string);
      if (!targetUser || targetUser.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.removeUserFromGroup(req.params.id as string, req.params.groupId as string);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  }
  