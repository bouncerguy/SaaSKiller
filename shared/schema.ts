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

export const eventTypes = pgTable("event_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  ownerUserId: varchar("owner_user_id").notNull().references(() => users.id),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  locationType: locationTypeEnum("location_type").notNull().default("VIDEO"),
  locationValue: text("location_value"),
  color: text("color").default("#1d4ed8"),
  isActive: boolean("is_active").notNull().default(true),
  questionsJson: text("questions_json").default("[]"),
});

export const insertEventTypeSchema = createInsertSchema(eventTypes).omit({ id: true });
export type InsertEventType = z.infer<typeof insertEventTypeSchema>;
export type EventType = typeof eventTypes.$inferSelect;

export const availabilityRules = pgTable("availability_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  timezone: text("timezone").notNull().default("America/New_York"),
});

export const insertAvailabilityRuleSchema = createInsertSchema(availabilityRules).omit({ id: true });
export type InsertAvailabilityRule = z.infer<typeof insertAvailabilityRuleSchema>;
export type AvailabilityRule = typeof availabilityRules.$inferSelect;

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  eventTypeId: varchar("event_type_id").notNull().references(() => eventTypes.id),
  hostUserId: varchar("host_user_id").notNull().references(() => users.id),
  inviteeName: text("invitee_name").notNull(),
  inviteeEmail: text("invitee_email").notNull(),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  timezone: text("timezone").notNull(),
  status: bookingStatusEnum("status").notNull().default("CONFIRMED"),
  cancelReason: text("cancel_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export const bookingFormSchema = z.object({
  inviteeName: z.string().min(1, "Name is required"),
  inviteeEmail: z.string().email("Valid email is required"),
  notes: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  timezone: z.string().min(1, "Timezone is required"),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;

export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;

export const userGroups = pgTable("user_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  groupId: varchar("group_id").notNull().references(() => groups.id),
});

export const insertUserGroupSchema = createInsertSchema(userGroups).omit({ id: true });
export type InsertUserGroup = z.infer<typeof insertUserGroupSchema>;
export type UserGroup = typeof userGroups.$inferSelect;

export const features = pgTable("features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  enabledGlobally: boolean("enabled_globally").notNull().default(false),
});

export const insertFeatureSchema = createInsertSchema(features).omit({ id: true });
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type Feature = typeof features.$inferSelect;

export const groupFeatures = pgTable("group_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id),
  featureId: varchar("feature_id").notNull().references(() => features.id),
  enabled: boolean("enabled").notNull().default(false),
});

export const insertGroupFeatureSchema = createInsertSchema(groupFeatures).omit({ id: true });
export type InsertGroupFeature = z.infer<typeof insertGroupFeatureSchema>;
export type GroupFeature = typeof groupFeatures.$inferSelect;

export const userFeatures = pgTable("user_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  featureId: varchar("feature_id").notNull().references(() => features.id),
  enabled: boolean("enabled").notNull().default(false),
});

export const insertUserFeatureSchema = createInsertSchema(userFeatures).omit({ id: true });
export type InsertUserFeature = z.infer<typeof insertUserFeatureSchema>;
export type UserFeature = typeof userFeatures.$inferSelect;

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value"),
  category: text("category"),
});

export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

export const activityLog = pgTable("activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  userId: varchar("user_id").references(() => users.id),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({ id: true, createdAt: true });
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;

export const pipelines = pgTable("pipelines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  stages: text("stages").notNull().default('["New Lead","Contacted","Qualified","Proposal","Negotiation","Won","Lost"]'),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertPipelineSchema = createInsertSchema(pipelines).omit({ id: true, createdAt: true });
export type InsertPipeline = z.infer<typeof insertPipelineSchema>;
export type Pipeline = typeof pipelines.$inferSelect;

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  businessName: text("business_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  billingType: text("billing_type"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("CURRENT"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  source: text("source"),
  pipelineId: varchar("pipeline_id").references(() => pipelines.id),
  stage: text("stage").notNull().default("New Lead"),
  awarenessData: text("awareness_data"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertNoteSchema = createInsertSchema(notes).omit({ id: true, createdAt: true });
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;
