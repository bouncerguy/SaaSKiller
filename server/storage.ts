import { eq, and, gte, lte, desc, or, ilike, sql } from "drizzle-orm";
import { db } from "./db";
import {
  tenants, users, eventTypes, availabilityRules, bookings,
  groups, userGroups, features, groupFeatures, userFeatures, settings, activityLog,
  customers, leads, pipelines, notes, products, tickets, invoices, timeEntries,
  forms, formResponses, emailTemplates, emailLogs, agents, agentRuns, mediaAssets,
  type Tenant, type InsertTenant,
  type User, type InsertUser,
  type EventType, type InsertEventType,
  type AvailabilityRule, type InsertAvailabilityRule,
  type Booking, type InsertBooking,
  type Group, type InsertGroup,
  type UserGroup, type InsertUserGroup,
  type Feature, type InsertFeature,
  type GroupFeature,
  type UserFeature,
  type Setting, type InsertSetting,
  type ActivityLog, type InsertActivityLog,
  type Customer, type InsertCustomer,
  type Lead, type InsertLead,
  type Pipeline, type InsertPipeline,
  type Note, type InsertNote,
  type Product, type InsertProduct,
  type Ticket, type InsertTicket,
  type Invoice, type InsertInvoice,
  type TimeEntry, type InsertTimeEntry,
  type Form, type InsertForm,
  type FormResponse, type InsertFormResponse,
  type EmailTemplate, type InsertEmailTemplate,
  type EmailLog, type InsertEmailLog,
  type Agent, type InsertAgent,
  type AgentRun, type InsertAgentRun,
  type MediaAsset, type InsertMediaAsset,
} from "@shared/schema";

export interface IStorage {
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  getAllTenants(): Promise<Tenant[]>;
  updateTenant(id: string, data: Partial<InsertTenant>): Promise<Tenant>;
  createTenant(data: InsertTenant): Promise<Tenant>;

  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByTenant(tenantId: string): Promise<User[]>;
  createUser(data: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  getEventType(id: string): Promise<EventType | undefined>;
  getEventTypeBySlug(tenantId: string, slug: string): Promise<EventType | undefined>;
  getEventTypesByTenant(tenantId: string): Promise<EventType[]>;
  createEventType(data: InsertEventType): Promise<EventType>;
  updateEventType(id: string, data: Partial<InsertEventType>): Promise<EventType>;

  getAvailabilityRules(tenantId: string, userId: string): Promise<AvailabilityRule[]>;
  createAvailabilityRule(data: InsertAvailabilityRule): Promise<AvailabilityRule>;
  deleteAvailabilityRule(id: string): Promise<void>;

  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByTenant(tenantId: string): Promise<Booking[]>;
  getBookingsByDateRange(tenantId: string, hostUserId: string, start: Date, end: Date): Promise<Booking[]>;
  createBooking(data: InsertBooking): Promise<Booking>;
  updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking>;

  createGroup(data: InsertGroup): Promise<Group>;
  getGroupsByTenant(tenantId: string): Promise<Group[]>;
  getGroup(id: string): Promise<Group | undefined>;
  updateGroup(id: string, data: Partial<InsertGroup>): Promise<Group>;
  deleteGroup(id: string): Promise<void>;

  addUserToGroup(userId: string, groupId: string): Promise<UserGroup>;
  removeUserFromGroup(userId: string, groupId: string): Promise<void>;
  getUserGroups(userId: string): Promise<Group[]>;
  getGroupMembers(groupId: string): Promise<User[]>;

  createFeature(data: InsertFeature): Promise<Feature>;
  getFeatures(): Promise<Feature[]>;
  getFeatureBySlug(slug: string): Promise<Feature | undefined>;
  seedDefaultFeatures(): Promise<void>;

  setGroupFeature(groupId: string, featureId: string, enabled: boolean): Promise<void>;
  getGroupFeatures(groupId: string): Promise<(GroupFeature & { feature: Feature })[]>;

  setUserFeature(userId: string, featureId: string, enabled: boolean): Promise<void>;
  getUserFeatures(userId: string): Promise<(UserFeature & { feature: Feature })[]>;

  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string, category?: string): Promise<Setting>;
  getSettingsByCategory(category: string): Promise<Setting[]>;
  getAllSettings(): Promise<Setting[]>;

  logActivity(data: InsertActivityLog): Promise<ActivityLog>;
  getActivityLog(filters: { tenantId?: string; entityType?: string; entityId?: string; userId?: string; limit?: number; offset?: number }): Promise<ActivityLog[]>;

  hasFeatureAccess(userId: string, featureSlug: string): Promise<boolean>;

  createCustomer(data: InsertCustomer): Promise<Customer>;
  getCustomersByTenant(tenantId: string): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  updateCustomer(id: string, data: Partial<InsertCustomer>): Promise<Customer>;
  searchCustomers(tenantId: string, query: string): Promise<Customer[]>;
  getCustomerByEmail(tenantId: string, email: string): Promise<Customer | undefined>;

  createLead(data: InsertLead): Promise<Lead>;
  getLeadsByTenant(tenantId: string): Promise<Lead[]>;
  getLeadsByPipeline(pipelineId: string): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  updateLead(id: string, data: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: string): Promise<void>;

  createPipeline(data: InsertPipeline): Promise<Pipeline>;
  getPipelinesByTenant(tenantId: string): Promise<Pipeline[]>;
  getPipeline(id: string): Promise<Pipeline | undefined>;
  updatePipeline(id: string, data: Partial<InsertPipeline>): Promise<Pipeline>;
  deletePipeline(id: string): Promise<void>;

  createNote(data: InsertNote): Promise<Note>;
  getNotes(entityType: string, entityId: string, tenantId: string): Promise<Note[]>;
  deleteNote(id: string, tenantId: string): Promise<void>;

  createProduct(data: InsertProduct): Promise<Product>;
  getProductsByTenant(tenantId: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  searchProducts(tenantId: string, query: string): Promise<Product[]>;

  createTicket(data: InsertTicket): Promise<Ticket>;
  getTicketsByTenant(tenantId: string, status?: string): Promise<Ticket[]>;
  getTicketsByCustomer(tenantId: string, customerId: string): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | undefined>;
  updateTicket(id: string, data: Partial<InsertTicket>): Promise<Ticket>;
  deleteTicket(id: string): Promise<void>;

  createInvoice(data: InsertInvoice): Promise<Invoice>;
  getInvoicesByTenant(tenantId: string, status?: string): Promise<Invoice[]>;
  getInvoicesByCustomer(tenantId: string, customerId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  updateInvoice(id: string, data: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;
  getNextInvoiceNumber(tenantId: string): Promise<string>;

  createTimeEntry(data: InsertTimeEntry): Promise<TimeEntry>;
  getTimeEntriesByTenant(tenantId: string): Promise<TimeEntry[]>;
  getTimeEntriesByCustomer(tenantId: string, customerId: string): Promise<TimeEntry[]>;
  getTimeEntry(id: string): Promise<TimeEntry | undefined>;
  updateTimeEntry(id: string, data: Partial<InsertTimeEntry>): Promise<TimeEntry>;
  deleteTimeEntry(id: string): Promise<void>;

  createForm(data: InsertForm): Promise<Form>;
  getFormsByTenant(tenantId: string): Promise<Form[]>;
  getForm(id: string): Promise<Form | undefined>;
  getFormBySlug(tenantId: string, slug: string): Promise<Form | undefined>;
  updateForm(id: string, data: Partial<InsertForm>): Promise<Form>;
  deleteForm(id: string): Promise<void>;
  createFormResponse(data: InsertFormResponse): Promise<FormResponse>;
  getFormResponses(formId: string): Promise<FormResponse[]>;
  incrementFormResponseCount(formId: string): Promise<void>;

  createEmailTemplate(data: InsertEmailTemplate): Promise<EmailTemplate>;
  getEmailTemplatesByTenant(tenantId: string): Promise<EmailTemplate[]>;
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  updateEmailTemplate(id: string, data: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(id: string): Promise<void>;
  createEmailLog(data: InsertEmailLog): Promise<EmailLog>;
  getEmailLogsByTenant(tenantId: string): Promise<EmailLog[]>;

  createAgent(data: InsertAgent): Promise<Agent>;
  getAgentsByTenant(tenantId: string): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | undefined>;
  updateAgent(id: string, data: Partial<InsertAgent>): Promise<Agent>;
  deleteAgent(id: string): Promise<void>;
  createAgentRun(data: InsertAgentRun): Promise<AgentRun>;
  getAgentRuns(agentId: string): Promise<AgentRun[]>;
  incrementAgentRunCount(agentId: string): Promise<void>;

  createMediaAsset(data: InsertMediaAsset): Promise<MediaAsset>;
  getMediaAssetsByTenant(tenantId: string, folder?: string): Promise<MediaAsset[]>;
  getMediaAsset(id: string): Promise<MediaAsset | undefined>;
  updateMediaAsset(id: string, data: Partial<InsertMediaAsset>): Promise<MediaAsset>;
  deleteMediaAsset(id: string): Promise<void>;
  searchMediaAssets(tenantId: string, query: string): Promise<MediaAsset[]>;
}

export class DatabaseStorage implements IStorage {
  async getTenant(id: string): Promise<Tenant | undefined> {
    const [t] = await db.select().from(tenants).where(eq(tenants.id, id));
    return t;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    const [t] = await db.select().from(tenants).where(eq(tenants.slug, slug));
    return t;
  }

  async updateTenant(id: string, data: Partial<InsertTenant>): Promise<Tenant> {
    const [t] = await db.update(tenants).set(data).where(eq(tenants.id, id)).returning();
    return t;
  }

  async createTenant(data: InsertTenant): Promise<Tenant> {
    const [t] = await db.insert(tenants).values(data).returning();
    return t;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [u] = await db.select().from(users).where(eq(users.id, id));
    return u;
  }

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.tenantId, tenantId));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [u] = await db.select().from(users).where(eq(users.email, email));
    return u;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [u] = await db.insert(users).values(data).returning();
    return u;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User> {
    const [u] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return u;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getEventType(id: string): Promise<EventType | undefined> {
    const [e] = await db.select().from(eventTypes).where(eq(eventTypes.id, id));
    return e;
  }

  async getEventTypeBySlug(tenantId: string, slug: string): Promise<EventType | undefined> {
    const [e] = await db.select().from(eventTypes).where(
      and(eq(eventTypes.tenantId, tenantId), eq(eventTypes.slug, slug)),
    );
    return e;
  }

  async getEventTypesByTenant(tenantId: string): Promise<EventType[]> {
    return db.select().from(eventTypes).where(eq(eventTypes.tenantId, tenantId));
  }

  async createEventType(data: InsertEventType): Promise<EventType> {
    const [e] = await db.insert(eventTypes).values(data).returning();
    return e;
  }

  async updateEventType(id: string, data: Partial<InsertEventType>): Promise<EventType> {
    const [e] = await db.update(eventTypes).set(data).where(eq(eventTypes.id, id)).returning();
    return e;
  }

  async getAvailabilityRules(tenantId: string, userId: string): Promise<AvailabilityRule[]> {
    return db.select().from(availabilityRules).where(
      and(eq(availabilityRules.tenantId, tenantId), eq(availabilityRules.userId, userId)),
    );
  }

  async createAvailabilityRule(data: InsertAvailabilityRule): Promise<AvailabilityRule> {
    const [r] = await db.insert(availabilityRules).values(data).returning();
    return r;
  }

  async deleteAvailabilityRule(id: string): Promise<void> {
    await db.delete(availabilityRules).where(eq(availabilityRules.id, id));
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [b] = await db.select().from(bookings).where(eq(bookings.id, id));
    return b;
  }

  async getBookingsByTenant(tenantId: string): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.tenantId, tenantId));
  }

  async getBookingsByDateRange(
    tenantId: string,
    hostUserId: string,
    start: Date,
    end: Date,
  ): Promise<Booking[]> {
    return db.select().from(bookings).where(
      and(
        eq(bookings.tenantId, tenantId),
        eq(bookings.hostUserId, hostUserId),
        eq(bookings.status, "CONFIRMED"),
        gte(bookings.startAt, start),
        lte(bookings.endAt, end),
      ),
    );
  }

  async createBooking(data: InsertBooking): Promise<Booking> {
    const [b] = await db.insert(bookings).values(data).returning();
    return b;
  }

  async updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking> {
    const [b] = await db.update(bookings).set(data).where(eq(bookings.id, id)).returning();
    return b;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return db.select().from(tenants);
  }

  async createGroup(data: InsertGroup): Promise<Group> {
    const [g] = await db.insert(groups).values(data).returning();
    return g;
  }

  async getGroupsByTenant(tenantId: string): Promise<Group[]> {
    return db.select().from(groups).where(eq(groups.tenantId, tenantId));
  }

  async getGroup(id: string): Promise<Group | undefined> {
    const [g] = await db.select().from(groups).where(eq(groups.id, id));
    return g;
  }

  async updateGroup(id: string, data: Partial<InsertGroup>): Promise<Group> {
    const [g] = await db.update(groups).set(data).where(eq(groups.id, id)).returning();
    return g;
  }

  async deleteGroup(id: string): Promise<void> {
    await db.delete(userGroups).where(eq(userGroups.groupId, id));
    await db.delete(groupFeatures).where(eq(groupFeatures.groupId, id));
    await db.delete(groups).where(eq(groups.id, id));
  }

  async addUserToGroup(userId: string, groupId: string): Promise<UserGroup> {
    const existing = await db.select().from(userGroups).where(
      and(eq(userGroups.userId, userId), eq(userGroups.groupId, groupId))
    );
    if (existing.length > 0) return existing[0];
    const [ug] = await db.insert(userGroups).values({ userId, groupId }).returning();
    return ug;
  }

  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    await db.delete(userGroups).where(
      and(eq(userGroups.userId, userId), eq(userGroups.groupId, groupId))
    );
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const rows = await db.select({ group: groups })
      .from(userGroups)
      .innerJoin(groups, eq(userGroups.groupId, groups.id))
      .where(eq(userGroups.userId, userId));
    return rows.map(r => r.group);
  }

  async getGroupMembers(groupId: string): Promise<User[]> {
    const rows = await db.select({ user: users })
      .from(userGroups)
      .innerJoin(users, eq(userGroups.userId, users.id))
      .where(eq(userGroups.groupId, groupId));
    return rows.map(r => r.user);
  }

  async createFeature(data: InsertFeature): Promise<Feature> {
    const [f] = await db.insert(features).values(data).returning();
    return f;
  }

  async getFeatures(): Promise<Feature[]> {
    return db.select().from(features);
  }

  async getFeatureBySlug(slug: string): Promise<Feature | undefined> {
    const [f] = await db.select().from(features).where(eq(features.slug, slug));
    return f;
  }

  async seedDefaultFeatures(): Promise<void> {
    const defaultFeatures: InsertFeature[] = [
      { name: "Calendar", slug: "calendar", description: "Scheduling and booking management", enabledGlobally: true },
      { name: "CRM", slug: "crm", description: "Customer and lead management", enabledGlobally: true },
      { name: "Products", slug: "products", description: "Products and services management", enabledGlobally: false },
      { name: "Support", slug: "support", description: "Trouble tickets and support desk", enabledGlobally: false },
      { name: "Finance", slug: "finance", description: "Financial dashboard and ledger", enabledGlobally: false },
      { name: "Email", slug: "email", description: "Built-in email client", enabledGlobally: false },
      { name: "Forms", slug: "forms", description: "Form builder and submissions", enabledGlobally: false },
      { name: "AI Agents", slug: "agents", description: "AI agent configuration", enabledGlobally: false },
      { name: "Assets", slug: "assets", description: "Fixed asset management", enabledGlobally: false },
      { name: "Media", slug: "media", description: "Media gallery", enabledGlobally: false },
      { name: "Time Tracking", slug: "time-tracking", description: "Time tracker and retainer management", enabledGlobally: false },
      { name: "Backups", slug: "backups", description: "Backup management", enabledGlobally: false },
      { name: "Updates", slug: "updates", description: "Git-based update system", enabledGlobally: false },
    ];

    for (const feat of defaultFeatures) {
      const existing = await this.getFeatureBySlug(feat.slug);
      if (!existing) {
        await this.createFeature(feat);
      }
    }
  }

  async setGroupFeature(groupId: string, featureId: string, enabled: boolean): Promise<void> {
    const existing = await db.select().from(groupFeatures).where(
      and(eq(groupFeatures.groupId, groupId), eq(groupFeatures.featureId, featureId))
    );
    if (existing.length > 0) {
      await db.update(groupFeatures).set({ enabled }).where(eq(groupFeatures.id, existing[0].id));
    } else {
      await db.insert(groupFeatures).values({ groupId, featureId, enabled });
    }
  }

  async getGroupFeatures(groupId: string): Promise<(GroupFeature & { feature: Feature })[]> {
    const rows = await db.select({
      id: groupFeatures.id,
      groupId: groupFeatures.groupId,
      featureId: groupFeatures.featureId,
      enabled: groupFeatures.enabled,
      feature: features,
    })
      .from(groupFeatures)
      .innerJoin(features, eq(groupFeatures.featureId, features.id))
      .where(eq(groupFeatures.groupId, groupId));
    return rows;
  }

  async setUserFeature(userId: string, featureId: string, enabled: boolean): Promise<void> {
    const existing = await db.select().from(userFeatures).where(
      and(eq(userFeatures.userId, userId), eq(userFeatures.featureId, featureId))
    );
    if (existing.length > 0) {
      await db.update(userFeatures).set({ enabled }).where(eq(userFeatures.id, existing[0].id));
    } else {
      await db.insert(userFeatures).values({ userId, featureId, enabled });
    }
  }

  async getUserFeatures(userId: string): Promise<(UserFeature & { feature: Feature })[]> {
    const rows = await db.select({
      id: userFeatures.id,
      userId: userFeatures.userId,
      featureId: userFeatures.featureId,
      enabled: userFeatures.enabled,
      feature: features,
    })
      .from(userFeatures)
      .innerJoin(features, eq(userFeatures.featureId, features.id))
      .where(eq(userFeatures.userId, userId));
    return rows;
  }

  async getSetting(key: string): Promise<string | null> {
    const [s] = await db.select().from(settings).where(eq(settings.key, key));
    return s?.value ?? null;
  }

  async setSetting(key: string, value: string, category?: string): Promise<Setting> {
    const existing = await db.select().from(settings).where(eq(settings.key, key));
    if (existing.length > 0) {
      const [s] = await db.update(settings).set({ value, category }).where(eq(settings.id, existing[0].id)).returning();
      return s;
    }
    const [s] = await db.insert(settings).values({ key, value, category }).returning();
    return s;
  }

  async getSettingsByCategory(category: string): Promise<Setting[]> {
    return db.select().from(settings).where(eq(settings.category, category));
  }

  async getAllSettings(): Promise<Setting[]> {
    return db.select().from(settings);
  }

  async logActivity(data: InsertActivityLog): Promise<ActivityLog> {
    const [a] = await db.insert(activityLog).values(data).returning();
    return a;
  }

  async getActivityLog(filters: { tenantId?: string; entityType?: string; entityId?: string; userId?: string; limit?: number; offset?: number }): Promise<ActivityLog[]> {
    const conditions = [];
    if (filters.tenantId) conditions.push(eq(activityLog.tenantId, filters.tenantId));
    if (filters.entityType) conditions.push(eq(activityLog.entityType, filters.entityType));
    if (filters.entityId) conditions.push(eq(activityLog.entityId, filters.entityId));
    if (filters.userId) conditions.push(eq(activityLog.userId, filters.userId));

    let query = db.select().from(activityLog);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    query = query.orderBy(desc(activityLog.createdAt)) as any;
    if (filters.limit) query = query.limit(filters.limit) as any;
    if (filters.offset) query = (query as any).offset(filters.offset);
    return query;
  }

  async hasFeatureAccess(userId: string, featureSlug: string): Promise<boolean> {
    const feature = await this.getFeatureBySlug(featureSlug);
    if (!feature) return false;

    if (feature.enabledGlobally) return true;

    const userFeatRows = await db.select().from(userFeatures).where(
      and(eq(userFeatures.userId, userId), eq(userFeatures.featureId, feature.id))
    );
    if (userFeatRows.length > 0) return userFeatRows[0].enabled;

    const userGroupRows = await this.getUserGroups(userId);
    for (const group of userGroupRows) {
      const gfRows = await db.select().from(groupFeatures).where(
        and(eq(groupFeatures.groupId, group.id), eq(groupFeatures.featureId, feature.id))
      );
      if (gfRows.length > 0 && gfRows[0].enabled) return true;
    }

    return false;
  }

  async createCustomer(data: InsertCustomer): Promise<Customer> {
    const [c] = await db.insert(customers).values(data).returning();
    return c;
  }

  async getCustomersByTenant(tenantId: string): Promise<Customer[]> {
    return db.select().from(customers).where(eq(customers.tenantId, tenantId)).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [c] = await db.select().from(customers).where(eq(customers.id, id));
    return c;
  }

  async updateCustomer(id: string, data: Partial<InsertCustomer>): Promise<Customer> {
    const [c] = await db.update(customers).set({ ...data, updatedAt: new Date() }).where(eq(customers.id, id)).returning();
    return c;
  }

  async searchCustomers(tenantId: string, query: string): Promise<Customer[]> {
    const pattern = `%${query}%`;
    return db.select().from(customers).where(
      and(
        eq(customers.tenantId, tenantId),
        or(
          ilike(customers.name, pattern),
          ilike(customers.email, pattern),
          ilike(customers.phone, pattern),
          ilike(customers.businessName, pattern),
        ),
      ),
    ).orderBy(desc(customers.createdAt));
  }

  async getCustomerByEmail(tenantId: string, email: string): Promise<Customer | undefined> {
    const [c] = await db.select().from(customers).where(
      and(eq(customers.tenantId, tenantId), eq(customers.email, email)),
    );
    return c;
  }

  async createLead(data: InsertLead): Promise<Lead> {
    const [l] = await db.insert(leads).values(data).returning();
    return l;
  }

  async getLeadsByTenant(tenantId: string): Promise<Lead[]> {
    return db.select().from(leads).where(eq(leads.tenantId, tenantId)).orderBy(desc(leads.createdAt));
  }

  async getLeadsByPipeline(pipelineId: string): Promise<Lead[]> {
    return db.select().from(leads).where(eq(leads.pipelineId, pipelineId)).orderBy(desc(leads.createdAt));
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const [l] = await db.select().from(leads).where(eq(leads.id, id));
    return l;
  }

  async updateLead(id: string, data: Partial<InsertLead>): Promise<Lead> {
    const [l] = await db.update(leads).set({ ...data, updatedAt: new Date() }).where(eq(leads.id, id)).returning();
    return l;
  }

  async deleteLead(id: string): Promise<void> {
    await db.delete(notes).where(and(eq(notes.entityType, "lead"), eq(notes.entityId, id)));
    await db.delete(leads).where(eq(leads.id, id));
  }

  async createPipeline(data: InsertPipeline): Promise<Pipeline> {
    const [p] = await db.insert(pipelines).values(data).returning();
    return p;
  }

  async getPipelinesByTenant(tenantId: string): Promise<Pipeline[]> {
    return db.select().from(pipelines).where(eq(pipelines.tenantId, tenantId)).orderBy(desc(pipelines.createdAt));
  }

  async getPipeline(id: string): Promise<Pipeline | undefined> {
    const [p] = await db.select().from(pipelines).where(eq(pipelines.id, id));
    return p;
  }

  async updatePipeline(id: string, data: Partial<InsertPipeline>): Promise<Pipeline> {
    const [p] = await db.update(pipelines).set(data).where(eq(pipelines.id, id)).returning();
    return p;
  }

  async deletePipeline(id: string): Promise<void> {
    await db.delete(pipelines).where(eq(pipelines.id, id));
  }

  async createNote(data: InsertNote): Promise<Note> {
    const [n] = await db.insert(notes).values(data).returning();
    return n;
  }

  async getNotes(entityType: string, entityId: string, tenantId: string): Promise<Note[]> {
    return db.select().from(notes).where(
      and(eq(notes.entityType, entityType), eq(notes.entityId, entityId), eq(notes.tenantId, tenantId)),
    ).orderBy(desc(notes.createdAt));
  }

  async deleteNote(id: string, tenantId: string): Promise<void> {
    await db.delete(notes).where(and(eq(notes.id, id), eq(notes.tenantId, tenantId)));
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    const [p] = await db.insert(products).values(data).returning();
    return p;
  }

  async getProductsByTenant(tenantId: string): Promise<Product[]> {
    return db.select().from(products).where(eq(products.tenantId, tenantId)).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [p] = await db.select().from(products).where(eq(products.id, id));
    return p;
  }

  async updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product> {
    const [p] = await db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    return p;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async searchProducts(tenantId: string, query: string): Promise<Product[]> {
    const pattern = `%${query}%`;
    return db.select().from(products).where(
      and(
        eq(products.tenantId, tenantId),
        or(ilike(products.name, pattern), ilike(products.description, pattern), ilike(products.category, pattern)),
      ),
    ).orderBy(desc(products.createdAt));
  }

  async createTicket(data: InsertTicket): Promise<Ticket> {
    const [t] = await db.insert(tickets).values(data).returning();
    return t;
  }

  async getTicketsByTenant(tenantId: string, status?: string): Promise<Ticket[]> {
    const conditions = [eq(tickets.tenantId, tenantId)];
    if (status) {
      conditions.push(eq(tickets.status, status as any));
    }
    return db.select().from(tickets).where(and(...conditions)).orderBy(desc(tickets.createdAt));
  }

  async getTicketsByCustomer(tenantId: string, customerId: string): Promise<Ticket[]> {
    return db.select().from(tickets).where(
      and(eq(tickets.tenantId, tenantId), eq(tickets.customerId, customerId))
    ).orderBy(desc(tickets.createdAt));
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const [t] = await db.select().from(tickets).where(eq(tickets.id, id));
    return t;
  }

  async updateTicket(id: string, data: Partial<InsertTicket>): Promise<Ticket> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.status === "RESOLVED" || data.status === "CLOSED") {
      updateData.resolvedAt = new Date();
    }
    const [t] = await db.update(tickets).set(updateData).where(eq(tickets.id, id)).returning();
    return t;
  }

  async deleteTicket(id: string): Promise<void> {
    await db.delete(tickets).where(eq(tickets.id, id));
  }

  async createInvoice(data: InsertInvoice): Promise<Invoice> {
    const [inv] = await db.insert(invoices).values(data).returning();
    return inv;
  }

  async getInvoicesByTenant(tenantId: string, status?: string): Promise<Invoice[]> {
    const conditions = [eq(invoices.tenantId, tenantId)];
    if (status) {
      conditions.push(eq(invoices.status, status as any));
    }
    return db.select().from(invoices).where(and(...conditions)).orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByCustomer(tenantId: string, customerId: string): Promise<Invoice[]> {
    return db.select().from(invoices).where(
      and(eq(invoices.tenantId, tenantId), eq(invoices.customerId, customerId))
    ).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
    return inv;
  }

  async updateInvoice(id: string, data: Partial<InsertInvoice>): Promise<Invoice> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.status === "PAID") {
      updateData.paidAt = new Date();
    }
    const [inv] = await db.update(invoices).set(updateData).where(eq(invoices.id, id)).returning();
    return inv;
  }

  async deleteInvoice(id: string): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async getNextInvoiceNumber(tenantId: string): Promise<string> {
    const all = await db.select().from(invoices).where(eq(invoices.tenantId, tenantId));
    const num = all.length + 1;
    return `INV-${String(num).padStart(4, "0")}`;
  }

  async createTimeEntry(data: InsertTimeEntry): Promise<TimeEntry> {
    const [te] = await db.insert(timeEntries).values(data).returning();
    return te;
  }

  async getTimeEntriesByTenant(tenantId: string): Promise<TimeEntry[]> {
    return db.select().from(timeEntries).where(eq(timeEntries.tenantId, tenantId)).orderBy(desc(timeEntries.startAt));
  }

  async getTimeEntriesByCustomer(tenantId: string, customerId: string): Promise<TimeEntry[]> {
    return db.select().from(timeEntries).where(
      and(eq(timeEntries.tenantId, tenantId), eq(timeEntries.customerId, customerId))
    ).orderBy(desc(timeEntries.startAt));
  }

  async getTimeEntry(id: string): Promise<TimeEntry | undefined> {
    const [te] = await db.select().from(timeEntries).where(eq(timeEntries.id, id));
    return te;
  }

  async updateTimeEntry(id: string, data: Partial<InsertTimeEntry>): Promise<TimeEntry> {
    const [te] = await db.update(timeEntries).set(data).where(eq(timeEntries.id, id)).returning();
    return te;
  }

  async deleteTimeEntry(id: string): Promise<void> {
    await db.delete(timeEntries).where(eq(timeEntries.id, id));
  }

  async createForm(data: InsertForm): Promise<Form> {
    const [f] = await db.insert(forms).values(data).returning();
    return f;
  }

  async getFormsByTenant(tenantId: string): Promise<Form[]> {
    return db.select().from(forms).where(eq(forms.tenantId, tenantId)).orderBy(desc(forms.createdAt));
  }

  async getForm(id: string): Promise<Form | undefined> {
    const [f] = await db.select().from(forms).where(eq(forms.id, id));
    return f;
  }

  async getFormBySlug(tenantId: string, slug: string): Promise<Form | undefined> {
    const [f] = await db.select().from(forms).where(
      and(eq(forms.tenantId, tenantId), eq(forms.slug, slug))
    );
    return f;
  }

  async updateForm(id: string, data: Partial<InsertForm>): Promise<Form> {
    const [f] = await db.update(forms).set({ ...data, updatedAt: new Date() }).where(eq(forms.id, id)).returning();
    return f;
  }

  async deleteForm(id: string): Promise<void> {
    await db.delete(formResponses).where(eq(formResponses.formId, id));
    await db.delete(forms).where(eq(forms.id, id));
  }

  async createFormResponse(data: InsertFormResponse): Promise<FormResponse> {
    const [r] = await db.insert(formResponses).values(data).returning();
    return r;
  }

  async getFormResponses(formId: string): Promise<FormResponse[]> {
    return db.select().from(formResponses).where(eq(formResponses.formId, formId)).orderBy(desc(formResponses.submittedAt));
  }

  async incrementFormResponseCount(formId: string): Promise<void> {
    await db.update(forms).set({ responseCount: sql`${forms.responseCount} + 1` }).where(eq(forms.id, formId));
  }

  async createEmailTemplate(data: InsertEmailTemplate): Promise<EmailTemplate> {
    const [t] = await db.insert(emailTemplates).values(data).returning();
    return t;
  }

  async getEmailTemplatesByTenant(tenantId: string): Promise<EmailTemplate[]> {
    return db.select().from(emailTemplates).where(eq(emailTemplates.tenantId, tenantId)).orderBy(desc(emailTemplates.createdAt));
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const [t] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return t;
  }

  async updateEmailTemplate(id: string, data: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const [t] = await db.update(emailTemplates).set({ ...data, updatedAt: new Date() }).where(eq(emailTemplates.id, id)).returning();
    return t;
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  }

  async createEmailLog(data: InsertEmailLog): Promise<EmailLog> {
    const [l] = await db.insert(emailLogs).values(data).returning();
    return l;
  }

  async getEmailLogsByTenant(tenantId: string): Promise<EmailLog[]> {
    return db.select().from(emailLogs).where(eq(emailLogs.tenantId, tenantId)).orderBy(desc(emailLogs.createdAt));
  }

  async createAgent(data: InsertAgent): Promise<Agent> {
    const [a] = await db.insert(agents).values(data).returning();
    return a;
  }

  async getAgentsByTenant(tenantId: string): Promise<Agent[]> {
    return db.select().from(agents).where(eq(agents.tenantId, tenantId)).orderBy(desc(agents.createdAt));
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    const [a] = await db.select().from(agents).where(eq(agents.id, id));
    return a;
  }

  async updateAgent(id: string, data: Partial<InsertAgent>): Promise<Agent> {
    const [a] = await db.update(agents).set({ ...data, updatedAt: new Date() }).where(eq(agents.id, id)).returning();
    return a;
  }

  async deleteAgent(id: string): Promise<void> {
    await db.delete(agentRuns).where(eq(agentRuns.agentId, id));
    await db.delete(agents).where(eq(agents.id, id));
  }

  async createAgentRun(data: InsertAgentRun): Promise<AgentRun> {
    const [r] = await db.insert(agentRuns).values(data).returning();
    return r;
  }

  async getAgentRuns(agentId: string): Promise<AgentRun[]> {
    return db.select().from(agentRuns).where(eq(agentRuns.agentId, agentId)).orderBy(desc(agentRuns.startedAt));
  }

  async incrementAgentRunCount(agentId: string): Promise<void> {
    await db.update(agents).set({
      runCount: sql`${agents.runCount} + 1`,
      lastRunAt: new Date(),
    }).where(eq(agents.id, agentId));
  }

  async createMediaAsset(data: InsertMediaAsset): Promise<MediaAsset> {
    const [m] = await db.insert(mediaAssets).values(data).returning();
    return m;
  }

  async getMediaAssetsByTenant(tenantId: string, folder?: string): Promise<MediaAsset[]> {
    const conditions = [eq(mediaAssets.tenantId, tenantId)];
    if (folder !== undefined && folder !== "") {
      conditions.push(eq(mediaAssets.folder, folder));
    }
    return db.select().from(mediaAssets).where(and(...conditions)).orderBy(desc(mediaAssets.createdAt));
  }

  async getMediaAsset(id: string): Promise<MediaAsset | undefined> {
    const [m] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id));
    return m;
  }

  async updateMediaAsset(id: string, data: Partial<InsertMediaAsset>): Promise<MediaAsset> {
    const [m] = await db.update(mediaAssets).set(data).where(eq(mediaAssets.id, id)).returning();
    return m;
  }

  async deleteMediaAsset(id: string): Promise<void> {
    await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  }

  async searchMediaAssets(tenantId: string, query: string): Promise<MediaAsset[]> {
    return db.select().from(mediaAssets).where(
      and(
        eq(mediaAssets.tenantId, tenantId),
        or(
          ilike(mediaAssets.filename, `%${query}%`),
          ilike(mediaAssets.originalName, `%${query}%`),
          ilike(mediaAssets.alt, `%${query}%`),
          ilike(mediaAssets.tagsJson, `%${query}%`),
        )
      )
    ).orderBy(desc(mediaAssets.createdAt));
  }
}

export const storage = new DatabaseStorage();
