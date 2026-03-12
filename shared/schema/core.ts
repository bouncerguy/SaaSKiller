import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";

  export const locationTypeEnum = pgEnum("location_type", ["IN_PERSON", "PHONE", "VIDEO", "CUSTOM"]);
  export const bookingStatusEnum = pgEnum("booking_status", ["CONFIRMED", "CANCELED"]);
  export const dayOfWeekEnum = pgEnum("day_of_week", ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]);
  export const paymentStatusEnum = pgEnum("payment_status", ["CURRENT", "PAST_DUE_30", "PAST_DUE_60", "COLLECTIONS"]);

  export const tenants = pgTable("tenants", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logoUrl: text("logo_url"),
    brandColor: text("brand_color").default("#1d4ed8"),
    timezone: text("timezone").default("America/New_York"),
    calendarIcsUrl: text("calendar_ics_url"),
  });

  export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true });
  export type InsertTenant = z.infer<typeof insertTenantSchema>;
  export type Tenant = typeof tenants.$inferSelect;

  export const users = pgTable("users", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    name: text("name").notNull(),
    email: text("email").notNull(),
    role: text("role").notNull().default("MEMBER"),
    passwordHash: text("password_hash"),
    isActive: boolean("is_active").notNull().default(true),
  });

  export const insertUserSchema = createInsertSchema(users).omit({ id: true });
  export type InsertUser = z.infer<typeof insertUserSchema>;
  export type User = typeof users.$inferSelect;
  