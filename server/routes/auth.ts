import type { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { requireAuth, hashPassword } from "../auth";
import passport from "passport";
import { getDefaultTenant } from "./helpers";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function registerAuthRoutes(app: Express) {
    app.post("/api/auth/register", async (req, res, next) => {
    try {
      const parsed = registerSchema.parse(req.body);

      const existing = await storage.getUserByEmail(parsed.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const tenant = await getDefaultTenant();
      const users = await storage.getUsersByTenant(tenant.id);
      const role = users.length === 0 ? "OWNER" : "MEMBER";

      if (users.length > 0 && (!req.isAuthenticated() || req.user?.role !== "OWNER")) {
        return res.status(403).json({ message: "Only the account owner can register new users" });
      }

      const passwordHash = await hashPassword(parsed.password);
      const user = await storage.createUser({
        tenantId: tenant.id,
        name: parsed.name,
        email: parsed.email,
        role,
        passwordHash,
      });

      if (users.length === 0) {
        req.login(
          { id: user.id, tenantId: user.tenantId, name: user.name, email: user.email, role: user.role },
          (err) => {
            if (err) return next(err);
            res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
          },
        );
      } else {
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
      }
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });

      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
  }
  