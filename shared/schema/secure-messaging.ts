import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  import { tenants, users } from "./core";
  import { customers } from "./crm";

  export const secureMessageStatusEnum = pgEnum("secure_message_status", ["DRAFT", "SENT", "READ", "EXPIRED"]);

  export const secureMessages = pgTable("secure_messages", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    createdByUserId: varchar("created_by_user_id").notNull().references(() => users.id),
    recipientName: text("recipient_name").notNull(),
    recipientEmail: text("recipient_email").notNull(),
    customerId: varchar("customer_id").references(() => customers.id),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    accessToken: varchar("access_token").notNull().unique().default(sql`gen_random_uuid()`),
    status: secureMessageStatusEnum("status").notNull().default("DRAFT"),
    expiresAt: timestamp("expires_at"),
    sentAt: timestamp("sent_at"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });

  export const insertSecureMessageSchema = createInsertSchema(secureMessages).omit({ id: true, accessToken: true, createdAt: true, updatedAt: true });
  export type InsertSecureMessage = z.infer<typeof insertSecureMessageSchema>;
  export type SecureMessage = typeof secureMessages.$inferSelect;

  export const secureMessageActivity = pgTable("secure_message_activity", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    messageId: varchar("message_id").notNull().references(() => secureMessages.id),
    action: text("action").notNull(),
    details: text("details"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  });

  export const insertSecureMessageActivitySchema = createInsertSchema(secureMessageActivity).omit({ id: true, createdAt: true });
  export type InsertSecureMessageActivity = z.infer<typeof insertSecureMessageActivitySchema>;
  export type SecureMessageActivity = typeof secureMessageActivity.$inferSelect;
  