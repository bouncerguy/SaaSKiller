import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  import { tenants } from "./core";
  import { customers } from "./crm";

  export const callDirectionEnum = pgEnum("call_direction", ["INBOUND", "OUTBOUND"]);
  export const callStatusEnum = pgEnum("call_status", ["QUEUED", "RINGING", "IN_PROGRESS", "COMPLETED", "BUSY", "NO_ANSWER", "FAILED", "CANCELED"]);
  export const smsDirectionEnum = pgEnum("sms_direction", ["INBOUND", "OUTBOUND"]);
  export const smsStatusEnum = pgEnum("sms_status", ["QUEUED", "SENT", "DELIVERED", "FAILED", "RECEIVED"]);

  export const phoneNumbers = pgTable("phone_numbers", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    number: text("number").notNull(),
    friendlyName: text("friendly_name"),
    provider: text("provider").notNull().default("twilio"),
    capabilities: text("capabilities").notNull().default("voice,sms"),
    isActive: boolean("is_active").notNull().default(true),
    forwardTo: text("forward_to"),
    voicemailEnabled: boolean("voicemail_enabled").notNull().default(false),
    voicemailGreeting: text("voicemail_greeting"),
    twilioSid: text("twilio_sid"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });

  export const insertPhoneNumberSchema = createInsertSchema(phoneNumbers).omit({ id: true, createdAt: true, updatedAt: true });
  export type InsertPhoneNumber = z.infer<typeof insertPhoneNumberSchema>;
  export type PhoneNumber = typeof phoneNumbers.$inferSelect;

  export const callLogs = pgTable("call_logs", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    phoneNumberId: varchar("phone_number_id").references(() => phoneNumbers.id),
    direction: callDirectionEnum("direction").notNull(),
    fromNumber: text("from_number").notNull(),
    toNumber: text("to_number").notNull(),
    status: callStatusEnum("status").notNull().default("QUEUED"),
    duration: integer("duration").default(0),
    recordingUrl: text("recording_url"),
    voicemailUrl: text("voicemail_url"),
    callSid: text("call_sid"),
    customerId: varchar("customer_id").references(() => customers.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  });

  export const insertCallLogSchema = createInsertSchema(callLogs).omit({ id: true, createdAt: true });
  export type InsertCallLog = z.infer<typeof insertCallLogSchema>;
  export type CallLog = typeof callLogs.$inferSelect;

  export const smsMessages = pgTable("sms_messages", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    phoneNumberId: varchar("phone_number_id").references(() => phoneNumbers.id),
    direction: smsDirectionEnum("direction").notNull(),
    fromNumber: text("from_number").notNull(),
    toNumber: text("to_number").notNull(),
    body: text("body").notNull(),
    status: smsStatusEnum("status").notNull().default("QUEUED"),
    messageSid: text("message_sid"),
    customerId: varchar("customer_id").references(() => customers.id),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  });

  export const insertSmsMessageSchema = createInsertSchema(smsMessages).omit({ id: true, createdAt: true });
  export type InsertSmsMessage = z.infer<typeof insertSmsMessageSchema>;
  export type SmsMessage = typeof smsMessages.$inferSelect;
  