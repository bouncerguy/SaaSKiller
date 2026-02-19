import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "./db";
import {
  tenants, users, eventTypes, availabilityRules, bookings,
  type Tenant, type InsertTenant,
  type User, type InsertUser,
  type EventType, type InsertEventType,
  type AvailabilityRule, type InsertAvailabilityRule,
  type Booking, type InsertBooking,
} from "@shared/schema";

export interface IStorage {
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  updateTenant(id: string, data: Partial<InsertTenant>): Promise<Tenant>;
  createTenant(data: InsertTenant): Promise<Tenant>;

  getUser(id: string): Promise<User | undefined>;
  getUsersByTenant(tenantId: string): Promise<User[]>;
  createUser(data: InsertUser): Promise<User>;

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

  async createUser(data: InsertUser): Promise<User> {
    const [u] = await db.insert(users).values(data).returning();
    return u;
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
}

export const storage = new DatabaseStorage();
