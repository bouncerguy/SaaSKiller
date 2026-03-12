import type { Express } from "express";
  import { storage } from "../storage";
  import { z } from "zod";
  import { requireAuth } from "../auth";
  import { postToPlatform, testPlatformConnection } from "../social";

  export function registerSocialRoutes(app: Express) {
    app.get("/api/admin/social-accounts", requireAuth, async (req, res) => {
    try {
      const accounts = await storage.getSocialAccountsByTenant(req.user!.tenantId);
      res.json(accounts);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/social-accounts", requireAuth, async (req, res) => {
    try {
      const account = await storage.createSocialAccount({
        ...req.body,
        tenantId: req.user!.tenantId,
      });
      res.json(account);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/social-accounts/:id", requireAuth, async (req, res) => {
    try {
      const account = await storage.getSocialAccount(req.params.id as string);
      if (!account || account.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Account not found" });
      }
      const updated = await storage.updateSocialAccount(account.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/social-accounts/:id", requireAuth, async (req, res) => {
    try {
      const account = await storage.getSocialAccount(req.params.id as string);
      if (!account || account.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Account not found" });
      }
      await storage.deleteSocialAccount(account.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/social-accounts/:id/test", requireAuth, async (req, res) => {
    try {
      const account = await storage.getSocialAccount(req.params.id as string);
      if (!account || account.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Account not found" });
      }
      const result = await testPlatformConnection(account);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/social-posts", requireAuth, async (req, res) => {
    try {
      const posts = await storage.getSocialPostsByTenant(req.user!.tenantId);
      const postsWithPlatforms = await Promise.all(
        posts.map(async (post) => {
          const platforms = await storage.getSocialPostPlatforms(post.id);
          return { ...post, platforms };
        })
      );
      res.json(postsWithPlatforms);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/social-posts", requireAuth, async (req, res) => {
    try {
      const { platformAccountIds, ...postData } = req.body;
      const post = await storage.createSocialPost({
        ...postData,
        tenantId: req.user!.tenantId,
        createdBy: req.user!.id,
      });

      if (platformAccountIds && Array.isArray(platformAccountIds)) {
        for (const accountId of platformAccountIds) {
          const account = await storage.getSocialAccount(accountId);
          if (account && account.tenantId === req.user!.tenantId) {
            await storage.createSocialPostPlatform({
              tenantId: req.user!.tenantId,
              postId: post.id,
              platform: account.platform,
              socialAccountId: account.id,
            });
          }
        }
      }

      const platforms = await storage.getSocialPostPlatforms(post.id);
      res.json({ ...post, platforms });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/social-posts/:id", requireAuth, async (req, res) => {
    try {
      const post = await storage.getSocialPost(req.params.id as string);
      if (!post || post.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Post not found" });
      }
      const platforms = await storage.getSocialPostPlatforms(post.id);
      res.json({ ...post, platforms });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/social-posts/:id", requireAuth, async (req, res) => {
    try {
      const post = await storage.getSocialPost(req.params.id as string);
      if (!post || post.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Post not found" });
      }
      const { platformAccountIds, ...updateData } = req.body;
      const updated = await storage.updateSocialPost(post.id, updateData);
      const platforms = await storage.getSocialPostPlatforms(post.id);
      res.json({ ...updated, platforms });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/social-posts/:id", requireAuth, async (req, res) => {
    try {
      const post = await storage.getSocialPost(req.params.id as string);
      if (!post || post.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Post not found" });
      }
      await storage.deleteSocialPost(post.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/social-posts/:id/publish", requireAuth, async (req, res) => {
    try {
      const post = await storage.getSocialPost(req.params.id as string);
      if (!post || post.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Post not found" });
      }

      await storage.updateSocialPost(post.id, { status: "PUBLISHING" });

      const platforms = await storage.getSocialPostPlatforms(post.id);
      const results: Array<{ platform: string; success: boolean; error?: string }> = [];
      let allSuccess = true;

      for (const pp of platforms) {
        const account = await storage.getSocialAccount(pp.socialAccountId);
        if (!account) {
          await storage.updateSocialPostPlatform(pp.id, { status: "FAILED", error: "Account not found" });
          results.push({ platform: pp.platform, success: false, error: "Account not found" });
          allSuccess = false;
          continue;
        }

        const result = await postToPlatform(account, post.content, post.mediaUrl || undefined);
        if (result.success) {
          await storage.updateSocialPostPlatform(pp.id, {
            status: "PUBLISHED",
            platformPostId: result.platformPostId || null,
            publishedAt: new Date(),
          });
          results.push({ platform: pp.platform, success: true });
        } else {
          await storage.updateSocialPostPlatform(pp.id, {
            status: "FAILED",
            error: result.error || "Unknown error",
          });
          results.push({ platform: pp.platform, success: false, error: result.error });
          allSuccess = false;
        }
      }

      await storage.updateSocialPost(post.id, {
        status: allSuccess ? "PUBLISHED" : "FAILED",
        publishedAt: allSuccess ? new Date() : undefined,
      });

      const updatedPost = await storage.getSocialPost(post.id);
      const updatedPlatforms = await storage.getSocialPostPlatforms(post.id);
      res.json({ ...updatedPost, platforms: updatedPlatforms, publishResults: results });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
  }
  