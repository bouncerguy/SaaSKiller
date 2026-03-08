import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db } from "./db";
import {
  tenants, users, eventTypes, availabilityRules, bookings,
  groups, userGroups, features, groupFeatures, userFeatures, settings, activityLog,
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
      { name: "CRM", slug: "crm", description: "Customer and lead management", enabledGlobally: false },
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
}

export const storage = new DatabaseStorage();
