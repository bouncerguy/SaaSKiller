import { describe, it, expect, vi, beforeEach } from "vitest";
import express, { type Express } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import supertest from "supertest";

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
import { hashPassword, comparePasswords } from "../server/auth";
import { registerAuthRoutes } from "../server/routes/auth";

const mockedStorage = vi.mocked(storage);

function buildApp(): Express {
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
      async (email: string, password: string, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !user.passwordHash) {
            return done(null, false, { message: "Invalid email or password" });
          }
          const isValid = await comparePasswords(password, user.passwordHash);
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

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
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

  registerAuthRoutes(app);

  return app;
}

const MOCK_TENANT = {
  id: "t1",
  slug: "default",
  name: "Default",
  brandColor: "#000",
  logoUrl: null,
  calendarIcsUrl: null,
};

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

describe("Auth routes (registerAuthRoutes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/auth/register creates the first user as OWNER", async () => {
    const app = buildApp();
    const mockUser = {
      id: "u1", tenantId: "t1", name: "Alice",
      email: "alice@test.com", role: "OWNER", passwordHash: "hashed",
    };

    mockedStorage.getTenantBySlug.mockResolvedValue(MOCK_TENANT as ReturnType<typeof storage.getTenantBySlug> extends Promise<infer T> ? T : never);
    mockedStorage.getUserByEmail.mockResolvedValue(undefined);
    mockedStorage.getUsersByTenant.mockResolvedValue([]);
    mockedStorage.createUser.mockResolvedValue(mockUser as ReturnType<typeof storage.createUser> extends Promise<infer T> ? T : never);
    mockedStorage.getUser.mockResolvedValue(mockUser as ReturnType<typeof storage.getUser> extends Promise<infer T> ? T : never);

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
    const existingUser = {
      id: "u1", tenantId: "t1", name: "Alice",
      email: "alice@test.com", role: "OWNER", passwordHash: "x",
    };
    mockedStorage.getUserByEmail.mockResolvedValue(existingUser as ReturnType<typeof storage.getUserByEmail> extends Promise<infer T> ? T : never);

    const res = await supertest(app)
      .post("/api/auth/register")
      .send({ name: "Alice", email: "alice@test.com", password: "password123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("already registered");
  });

  it("POST /api/auth/login succeeds with correct credentials", async () => {
    const app = buildApp();
    const hash = await hashPassword("password123");
    const mockUser = {
      id: "u1", tenantId: "t1", name: "Alice",
      email: "alice@test.com", role: "OWNER", passwordHash: hash,
    };
    mockedStorage.getUserByEmail.mockResolvedValue(mockUser as ReturnType<typeof storage.getUserByEmail> extends Promise<infer T> ? T : never);
    mockedStorage.getUser.mockResolvedValue(mockUser as ReturnType<typeof storage.getUser> extends Promise<infer T> ? T : never);

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
    const mockUser = {
      id: "u1", tenantId: "t1", name: "Alice",
      email: "alice@test.com", role: "OWNER", passwordHash: hash,
    };
    mockedStorage.getUserByEmail.mockResolvedValue(mockUser as ReturnType<typeof storage.getUserByEmail> extends Promise<infer T> ? T : never);

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
    const mockUser = {
      id: "u1", tenantId: "t1", name: "Alice",
      email: "alice@test.com", role: "OWNER", passwordHash: hash,
    };
    mockedStorage.getUserByEmail.mockResolvedValue(mockUser as ReturnType<typeof storage.getUserByEmail> extends Promise<infer T> ? T : never);
    mockedStorage.getUser.mockResolvedValue(mockUser as ReturnType<typeof storage.getUser> extends Promise<infer T> ? T : never);

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
