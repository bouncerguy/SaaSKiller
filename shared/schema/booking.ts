import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  import { tenants, users, locationTypeEnum, bookingStatusEnum, dayOfWeekEnum } from "./core";

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
  