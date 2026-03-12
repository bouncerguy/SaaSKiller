import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import supertest from "supertest";
import { hashPassword, comparePasswords } from "../server/auth";

vi.mock("../server/storage", () => ({
  storage: {
    getUserByEmail: vi.fn(),
    getUsersByTenant: vi.fn(),
    createUser: vi.fn(),
    getUser: vi.fn(),
    getTenantBySlug: vi.fn(),
  },
}));

import { storage } from "../server/storage";

const mockedStorage = vi.mocked(storage);

function buildApp() {
  const app = express();
  app.use(express.json());

  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email: string, password: string, done: any) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(user as any).passwordHash) {
            return done(null, false, { message: "Invalid email or password" });
          }
          const isValid = await comparePasswords(password, (user as any).passwordHash);
          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, {
            id: user.id,
            tenantId: user.tenantId,
            name: user.name,
            email: user.email,
            role: user.role,
          });
        } catch (err) {
          return done(err);
        }
      },
    ),
  );

  passport.serializeUser((user: any, done: any) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done: any) => {
    try {
      const user = await storage.getUser(id);
      if (!user) return done(null, false);
      done(null, {
        id: user.id,
        tenantId: user.tenantId,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/auth/register", async (req: any, res: any, next: any) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password || password.length < 6) {
        return res.status(400).json({ message: "Validation failed" });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const tenant = await storage.getTenantBySlug("default");
      if (!tenant) {
        return res.status(500).json({ message: "Default tenant not found" });
      }

      const users = await storage.getUsersByTenant(tenant.id);
      const role = (users as any[]).length === 0 ? "OWNER" : "MEMBER";

      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({
        tenantId: tenant.id,
        name,
        email,
        role,
        passwordHash,
      });

      if ((users as any[]).length === 0) {
        req.login(
          { id: user.id, tenantId: user.tenantId, name: user.name, email: user.email, role: user.role },
          (err: any) => {
            if (err) return next(err);
            res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
          },
        );
      } else {
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
      }
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/login", (req: any, res: any, next: any) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.login(user, (loginErr: any) => {
        if (loginErr) return next(loginErr);
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req: any, res: any) => {
    req.logout((err: any) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/user", (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  return app;
}

describe("Password hashing", () => {
  it("hashPassword produces a bcrypt hash", async () => {
    const hash = await hashPassword("mypassword");
    expect(hash).toBeTruthy();
    expect(hash).not.toBe("mypassword");
    expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);
  });

  it("comparePasswords returns true for matching password", async () => {
    const hash = await hashPassword("secret123");
    const result = await comparePasswords("secret123", hash);
    expect(result).toBe(true);
  });

  it("comparePasswords returns false for wrong password", async () => {
    const hash = await hashPassword("secret123");
    const result = await comparePasswords("wrongpassword", hash);
    expect(result).toBe(false);
  });
});

describe("Auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/auth/register creates the first user as OWNER", async () => {
    const app = buildApp();
    const mockTenant = { id: "t1", slug: "default", name: "Default", brandColor: "#000", logoUrl: null, calendarIcsUrl: null };
    const mockUser = { id: "u1", tenantId: "t1", name: "Alice", email: "alice@test.com", role: "OWNER", passwordHash: "hashed" };

    mockedStorage.getTenantBySlug.mockResolvedValue(mockTenant as any);
    mockedStorage.getUserByEmail.mockResolvedValue(undefined);
    mockedStorage.getUsersByTenant.mockResolvedValue([]);
    mockedStorage.createUser.mockResolvedValue(mockUser as any);
    mockedStorage.getUser.mockResolvedValue(mockUser as any);

    const res = await supertest(app)
      .post("/api/auth/register")
      .send({ name: "Alice", email: "alice@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("OWNER");
    expect(res.body.email).toBe("alice@test.com");
    expect(mockedStorage.createUser).toHaveBeenCalledOnce();
    const callArgs = mockedStorage.createUser.mock.calls[0][0];
    expect(callArgs.role).toBe("OWNER");
  });

  it("POST /api/auth/register rejects duplicate email", async () => {
    const app = buildApp();
    const existingUser = { id: "u1", tenantId: "t1", name: "Alice", email: "alice@test.com", role: "OWNER", passwordHash: "x" };
    mockedStorage.getUserByEmail.mockResolvedValue(existingUser as any);

    const res = await supertest(app)
      .post("/api/auth/register")
      .send({ name: "Alice", email: "alice@test.com", password: "password123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("already registered");
  });

  it("POST /api/auth/login succeeds with correct credentials", async () => {
    const app = buildApp();
    const hash = await hashPassword("password123");
    const mockUser = { id: "u1", tenantId: "t1", name: "Alice", email: "alice@test.com", role: "OWNER", passwordHash: hash };
    mockedStorage.getUserByEmail.mockResolvedValue(mockUser as any);
    mockedStorage.getUser.mockResolvedValue(mockUser as any);

    const res = await supertest(app)
      .post("/api/auth/login")
      .send({ email: "alice@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("alice@test.com");
    expect(res.body.id).toBe("u1");
  });

  it("POST /api/auth/login returns 401 for wrong password", async () => {
    const app = buildApp();
    const hash = await hashPassword("correctpassword");
    const mockUser = { id: "u1", tenantId: "t1", name: "Alice", email: "alice@test.com", role: "OWNER", passwordHash: hash };
    mockedStorage.getUserByEmail.mockResolvedValue(mockUser as any);

    const res = await supertest(app)
      .post("/api/auth/login")
      .send({ email: "alice@test.com", password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  it("POST /api/auth/login returns 401 for non-existent user", async () => {
    const app = buildApp();
    mockedStorage.getUserByEmail.mockResolvedValue(undefined);

    const res = await supertest(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.com", password: "password123" });

    expect(res.status).toBe(401);
  });

  it("POST /api/auth/logout ends the session", async () => {
    const app = buildApp();
    const hash = await hashPassword("password123");
    const mockUser = { id: "u1", tenantId: "t1", name: "Alice", email: "alice@test.com", role: "OWNER", passwordHash: hash };
    mockedStorage.getUserByEmail.mockResolvedValue(mockUser as any);
    mockedStorage.getUser.mockResolvedValue(mockUser as any);

    const agent = supertest.agent(app);

    await agent
      .post("/api/auth/login")
      .send({ email: "alice@test.com", password: "password123" });

    const userRes = await agent.get("/api/auth/user");
    expect(userRes.status).toBe(200);
    expect(userRes.body.email).toBe("alice@test.com");

    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(200);

    const afterLogout = await agent.get("/api/auth/user");
    expect(afterLogout.status).toBe(401);
  });

  it("GET /api/auth/user returns 401 when not authenticated", async () => {
    const app = buildApp();
    const res = await supertest(app).get("/api/auth/user");
    expect(res.status).toBe(401);
  });
});
