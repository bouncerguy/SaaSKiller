import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import supertest from "supertest";
import type { User, Customer, Lead, Pipeline, ActivityLog } from "@shared/schema";

vi.mock("../server/storage", () => ({
  storage: {
    getCustomersByTenant: vi.fn(),
    searchCustomers: vi.fn(),
    createCustomer: vi.fn(),
    getCustomer: vi.fn(),
    getCustomerByEmail: vi.fn(),
    updateCustomer: vi.fn(),
    getLeadsByTenant: vi.fn(),
    getLeadsByPipeline: vi.fn(),
    createLead: vi.fn(),
    getLead: vi.fn(),
    updateLead: vi.fn(),
    deleteLead: vi.fn(),
    getPipelinesByTenant: vi.fn(),
    createPipeline: vi.fn(),
    getPipeline: vi.fn(),
    logActivity: vi.fn(),
    getNotes: vi.fn(),
    getActivityLog: vi.fn(),
    getTicketsByCustomer: vi.fn(),
    getInvoicesByCustomer: vi.fn(),
    getTimeEntriesByCustomer: vi.fn(),
    getUserByEmail: vi.fn(),
    getUser: vi.fn(),
  },
}));

vi.mock("../server/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../server/auth")>();
  return {
    ...actual,
    requireAuth: (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      next();
    },
  };
});

import { storage } from "../server/storage";
import { hashPassword, comparePasswords } from "../server/auth";
import { registerCrmRoutes } from "../server/routes/crm";

const mockedStorage = vi.mocked(storage);

const now = new Date();

function mockUser(overrides: Partial<User> = {}): User {
  return {
    id: "u1",
    tenantId: "t1",
    name: "Test User",
    email: "test@test.com",
    role: "OWNER",
    passwordHash: "",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function mockCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "c1",
    tenantId: "t1",
    userId: null,
    name: "Acme Corp",
    businessName: null,
    email: "acme@test.com",
    phone: null,
    address: null,
    billingType: null,
    paymentStatus: "CURRENT",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function mockLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "l1",
    tenantId: "t1",
    name: "Test Lead",
    email: null,
    phone: null,
    source: null,
    pipelineId: "p1",
    stage: "New Lead",
    awarenessData: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function mockPipeline(overrides: Partial<Pipeline> = {}): Pipeline {
  return {
    id: "p1",
    tenantId: "t1",
    name: "Sales Pipeline",
    stages: '["New Lead","Contacted","Qualified","Proposal","Negotiation","Won","Lost"]',
    isDefault: true,
    createdAt: now,
    ...overrides,
  };
}

function mockActivity(overrides: Partial<ActivityLog> = {}): ActivityLog {
  return {
    id: "a1",
    tenantId: "t1",
    userId: "u1",
    entityType: "customer",
    entityId: "c1",
    action: "created",
    details: "{}",
    createdAt: now,
    ...overrides,
  };
}

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
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
      const user = await storage.getUserByEmail(email);
      if (!user) return done(null, false);
      const valid = await comparePasswords(password, user.passwordHash);
      if (!valid) return done(null, false);
      return done(null, { id: user.id, tenantId: user.tenantId, name: user.name, email: user.email, role: user.role });
    }),
  );

  passport.serializeUser((user: Express.User, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    if (!user) return done(null, false);
    done(null, { id: user.id, tenantId: user.tenantId, name: user.name, email: user.email, role: user.role });
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid" });
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json(user);
      });
    })(req, res, next);
  });

  registerCrmRoutes(app);

  return app;
}

async function authenticatedAgent(app: express.Express) {
  const hash = await hashPassword("password123");
  const user = mockUser({ passwordHash: hash });

  mockedStorage.getUserByEmail.mockResolvedValue(user);
  mockedStorage.getUser.mockResolvedValue(user);

  const agent = supertest.agent(app);
  await agent.post("/api/auth/login").send({ email: "test@test.com", password: "password123" });
  return agent;
}

describe("Customer CRUD", () => {
  let app: express.Express;
  let agent: supertest.Agent;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildApp();
    mockedStorage.logActivity.mockResolvedValue(mockActivity());
    agent = await authenticatedAgent(app);
  });

  it("GET /api/admin/customers lists customers for the tenant", async () => {
    const customers = [
      mockCustomer({ id: "c1", name: "Acme Corp", email: "acme@test.com" }),
      mockCustomer({ id: "c2", name: "Beta Inc", email: "beta@test.com" }),
    ];
    mockedStorage.getCustomersByTenant.mockResolvedValue(customers);

    const res = await agent.get("/api/admin/customers");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe("Acme Corp");
  });

  it("POST /api/admin/customers creates a new customer", async () => {
    const newCustomer = mockCustomer({ id: "c3", name: "New Co", email: "new@test.com" });
    mockedStorage.getCustomerByEmail.mockResolvedValue(undefined);
    mockedStorage.createCustomer.mockResolvedValue(newCustomer);

    const res = await agent
      .post("/api/admin/customers")
      .send({ name: "New Co", email: "new@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New Co");
    expect(mockedStorage.createCustomer).toHaveBeenCalledOnce();
  });

  it("POST /api/admin/customers rejects duplicate email", async () => {
    mockedStorage.getCustomerByEmail.mockResolvedValue(
      mockCustomer({ email: "dup@test.com" }),
    );

    const res = await agent
      .post("/api/admin/customers")
      .send({ name: "New", email: "dup@test.com" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("already exists");
  });

  it("PATCH /api/admin/customers/:id updates customer fields", async () => {
    const existing = mockCustomer({ name: "Old Name" });
    const updated = mockCustomer({ name: "New Name" });
    mockedStorage.getCustomer.mockResolvedValue(existing);
    mockedStorage.updateCustomer.mockResolvedValue(updated);

    const res = await agent
      .patch("/api/admin/customers/c1")
      .send({ name: "New Name" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New Name");
  });

  it("PATCH /api/admin/customers/:id returns 404 for non-existent customer", async () => {
    mockedStorage.getCustomer.mockResolvedValue(undefined);

    const res = await agent
      .patch("/api/admin/customers/nonexistent")
      .send({ name: "X" });

    expect(res.status).toBe(404);
  });

  it("GET /api/admin/customers?search= searches customers", async () => {
    const results = [mockCustomer({ name: "Acme" })];
    mockedStorage.searchCustomers.mockResolvedValue(results);

    const res = await agent.get("/api/admin/customers?search=acme");

    expect(res.status).toBe(200);
    expect(mockedStorage.searchCustomers).toHaveBeenCalledWith("t1", "acme");
  });
});

describe("Lead CRUD", () => {
  let app: express.Express;
  let agent: supertest.Agent;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildApp();
    mockedStorage.logActivity.mockResolvedValue(mockActivity());
    agent = await authenticatedAgent(app);
  });

  it("GET /api/admin/leads lists all leads", async () => {
    mockedStorage.getLeadsByTenant.mockResolvedValue([mockLead()]);

    const res = await agent.get("/api/admin/leads");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("POST /api/admin/leads creates a lead in the default pipeline", async () => {
    const pipeline = mockPipeline();
    const lead = mockLead({ name: "Test Lead" });

    mockedStorage.getPipelinesByTenant.mockResolvedValue([pipeline]);
    mockedStorage.createLead.mockResolvedValue(lead);

    const res = await agent
      .post("/api/admin/leads")
      .send({ name: "Test Lead" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Test Lead");
    expect(mockedStorage.createLead).toHaveBeenCalledOnce();
  });

  it("PATCH /api/admin/leads/:id updates lead stage (pipeline progression)", async () => {
    const existing = mockLead({ stage: "New Lead" });
    const updated = mockLead({ stage: "Qualified" });
    mockedStorage.getLead.mockResolvedValue(existing);
    mockedStorage.updateLead.mockResolvedValue(updated);

    const res = await agent
      .patch("/api/admin/leads/l1")
      .send({ stage: "Qualified" });

    expect(res.status).toBe(200);
    expect(res.body.stage).toBe("Qualified");
    expect(mockedStorage.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "stage_changed",
        details: expect.stringContaining("New Lead"),
      }),
    );
  });

  it("PATCH /api/admin/leads/:id does NOT log stage change when stage is unchanged", async () => {
    const existing = mockLead({ stage: "New Lead" });
    mockedStorage.getLead.mockResolvedValue(existing);
    mockedStorage.updateLead.mockResolvedValue(existing);

    await agent
      .patch("/api/admin/leads/l1")
      .send({ name: "Updated Name" });

    const stageChangeCalls = mockedStorage.logActivity.mock.calls.filter(
      (call) => {
        const arg = call[0] as { action?: string };
        return arg.action === "stage_changed";
      },
    );
    expect(stageChangeCalls).toHaveLength(0);
  });

  it("DELETE /api/admin/leads/:id removes the lead", async () => {
    mockedStorage.getLead.mockResolvedValue(mockLead());
    mockedStorage.deleteLead.mockResolvedValue(undefined);

    const res = await agent.delete("/api/admin/leads/l1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockedStorage.deleteLead).toHaveBeenCalledWith("l1");
  });

  it("DELETE /api/admin/leads/:id returns 404 for wrong tenant", async () => {
    mockedStorage.getLead.mockResolvedValue(mockLead({ tenantId: "other-tenant" }));

    const res = await agent.delete("/api/admin/leads/l1");

    expect(res.status).toBe(404);
  });
});

describe("Pipeline stage progression", () => {
  let app: express.Express;
  let agent: supertest.Agent;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = buildApp();
    mockedStorage.logActivity.mockResolvedValue(mockActivity());
    agent = await authenticatedAgent(app);
  });

  it("tracks stage progression from New Lead → Contacted → Qualified", async () => {
    const lead = mockLead({ stage: "New Lead" });

    mockedStorage.getLead.mockResolvedValue(lead);
    mockedStorage.updateLead.mockResolvedValue(mockLead({ stage: "Contacted" }));

    await agent.patch("/api/admin/leads/l1").send({ stage: "Contacted" });

    expect(mockedStorage.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "stage_changed",
        details: JSON.stringify({ from: "New Lead", to: "Contacted" }),
      }),
    );

    vi.clearAllMocks();
    const hash = await hashPassword("password123");
    mockedStorage.getUser.mockResolvedValue(mockUser({ passwordHash: hash }));
    const contactedLead = mockLead({ stage: "Contacted" });
    mockedStorage.getLead.mockResolvedValue(contactedLead);
    mockedStorage.updateLead.mockResolvedValue(mockLead({ stage: "Qualified" }));

    await agent.patch("/api/admin/leads/l1").send({ stage: "Qualified" });

    expect(mockedStorage.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "stage_changed",
        details: JSON.stringify({ from: "Contacted", to: "Qualified" }),
      }),
    );
  });
});
