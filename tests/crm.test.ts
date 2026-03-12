import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import supertest from "supertest";

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
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    requireAuth: (req: any, res: any, next: any) => {
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

const MOCK_USER = {
  id: "u1",
  tenantId: "t1",
  name: "Test User",
  email: "test@test.com",
  role: "OWNER",
  passwordHash: "",
};

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
      const valid = await comparePasswords(password, (user as any).passwordHash);
      if (!valid) return done(null, false);
      return done(null, { id: user.id, tenantId: user.tenantId, name: user.name, email: user.email, role: user.role });
    }),
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    if (!user) return done(null, false);
    done(null, { id: user.id, tenantId: user.tenantId, name: user.name, email: user.email, role: user.role });
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any) => {
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
  const userWithHash = { ...MOCK_USER, passwordHash: hash };

  mockedStorage.getUserByEmail.mockResolvedValue(userWithHash as any);
  mockedStorage.getUser.mockResolvedValue(userWithHash as any);

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
    mockedStorage.logActivity.mockResolvedValue({} as any);
    agent = await authenticatedAgent(app);
  });

  it("GET /api/admin/customers lists customers for the tenant", async () => {
    const mockCustomers = [
      { id: "c1", tenantId: "t1", name: "Acme Corp", email: "acme@test.com" },
      { id: "c2", tenantId: "t1", name: "Beta Inc", email: "beta@test.com" },
    ];
    mockedStorage.getCustomersByTenant.mockResolvedValue(mockCustomers as any);

    const res = await agent.get("/api/admin/customers");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe("Acme Corp");
  });

  it("POST /api/admin/customers creates a new customer", async () => {
    const newCustomer = { id: "c3", tenantId: "t1", name: "New Co", email: "new@test.com", paymentStatus: "CURRENT", isActive: true };
    mockedStorage.getCustomerByEmail.mockResolvedValue(undefined);
    mockedStorage.createCustomer.mockResolvedValue(newCustomer as any);

    const res = await agent
      .post("/api/admin/customers")
      .send({ name: "New Co", email: "new@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New Co");
    expect(mockedStorage.createCustomer).toHaveBeenCalledOnce();
  });

  it("POST /api/admin/customers rejects duplicate email", async () => {
    const existing = { id: "c1", tenantId: "t1", name: "Old", email: "dup@test.com" };
    mockedStorage.getCustomerByEmail.mockResolvedValue(existing as any);

    const res = await agent
      .post("/api/admin/customers")
      .send({ name: "New", email: "dup@test.com" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("already exists");
  });

  it("PATCH /api/admin/customers/:id updates customer fields", async () => {
    const existing = { id: "c1", tenantId: "t1", name: "Old Name", email: "c@test.com" };
    const updated = { ...existing, name: "New Name" };
    mockedStorage.getCustomer.mockResolvedValue(existing as any);
    mockedStorage.updateCustomer.mockResolvedValue(updated as any);

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
    const results = [{ id: "c1", tenantId: "t1", name: "Acme", email: "acme@test.com" }];
    mockedStorage.searchCustomers.mockResolvedValue(results as any);

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
    mockedStorage.logActivity.mockResolvedValue({} as any);
    agent = await authenticatedAgent(app);
  });

  it("GET /api/admin/leads lists all leads", async () => {
    const mockLeads = [
      { id: "l1", tenantId: "t1", name: "Lead A", stage: "New Lead" },
    ];
    mockedStorage.getLeadsByTenant.mockResolvedValue(mockLeads as any);

    const res = await agent.get("/api/admin/leads");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("POST /api/admin/leads creates a lead in the default pipeline", async () => {
    const mockPipeline = { id: "p1", tenantId: "t1", name: "Sales", stages: '["New Lead","Won"]', isDefault: true };
    const mockLead = { id: "l1", tenantId: "t1", name: "Test Lead", stage: "New Lead", pipelineId: "p1" };

    mockedStorage.getPipelinesByTenant.mockResolvedValue([mockPipeline] as any);
    mockedStorage.createLead.mockResolvedValue(mockLead as any);

    const res = await agent
      .post("/api/admin/leads")
      .send({ name: "Test Lead" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Test Lead");
    expect(mockedStorage.createLead).toHaveBeenCalledOnce();
  });

  it("PATCH /api/admin/leads/:id updates lead stage (pipeline progression)", async () => {
    const existing = { id: "l1", tenantId: "t1", name: "Lead", stage: "New Lead" };
    const updated = { ...existing, stage: "Qualified" };
    mockedStorage.getLead.mockResolvedValue(existing as any);
    mockedStorage.updateLead.mockResolvedValue(updated as any);

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
    const existing = { id: "l1", tenantId: "t1", name: "Lead", stage: "New Lead" };
    mockedStorage.getLead.mockResolvedValue(existing as any);
    mockedStorage.updateLead.mockResolvedValue(existing as any);

    await agent
      .patch("/api/admin/leads/l1")
      .send({ name: "Updated Name" });

    const stageCalls = mockedStorage.logActivity.mock.calls.filter(
      (c) => (c[0] as any).action === "stage_changed",
    );
    expect(stageCalls).toHaveLength(0);
  });

  it("DELETE /api/admin/leads/:id removes the lead", async () => {
    const existing = { id: "l1", tenantId: "t1", name: "Lead" };
    mockedStorage.getLead.mockResolvedValue(existing as any);
    mockedStorage.deleteLead.mockResolvedValue(undefined);

    const res = await agent.delete("/api/admin/leads/l1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockedStorage.deleteLead).toHaveBeenCalledWith("l1");
  });

  it("DELETE /api/admin/leads/:id returns 404 for wrong tenant", async () => {
    const otherTenantLead = { id: "l1", tenantId: "other-tenant", name: "Lead" };
    mockedStorage.getLead.mockResolvedValue(otherTenantLead as any);

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
    mockedStorage.logActivity.mockResolvedValue({} as any);
    agent = await authenticatedAgent(app);
  });

  it("tracks stage progression from New Lead → Contacted → Qualified", async () => {
    const lead = { id: "l1", tenantId: "t1", name: "Progressive Lead", stage: "New Lead" };

    mockedStorage.getLead.mockResolvedValue(lead as any);
    mockedStorage.updateLead.mockResolvedValue({ ...lead, stage: "Contacted" } as any);

    await agent.patch("/api/admin/leads/l1").send({ stage: "Contacted" });

    expect(mockedStorage.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "stage_changed",
        details: JSON.stringify({ from: "New Lead", to: "Contacted" }),
      }),
    );

    vi.clearAllMocks();
    mockedStorage.getUser.mockResolvedValue({ ...MOCK_USER, passwordHash: await hashPassword("password123") } as any);
    const contactedLead = { id: "l1", tenantId: "t1", name: "Progressive Lead", stage: "Contacted" };
    mockedStorage.getLead.mockResolvedValue(contactedLead as any);
    mockedStorage.updateLead.mockResolvedValue({ ...contactedLead, stage: "Qualified" } as any);

    await agent.patch("/api/admin/leads/l1").send({ stage: "Qualified" });

    expect(mockedStorage.logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "stage_changed",
        details: JSON.stringify({ from: "Contacted", to: "Qualified" }),
      }),
    );
  });
});
