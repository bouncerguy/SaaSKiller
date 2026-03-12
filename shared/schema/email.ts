import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  import { tenants, users } from "./core";

  export const emailTemplates = pgTable("email_templates", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    name: text("name").notNull(),
    subject: text("subject").notNull(),
    bodyHtml: text("body_html").default(""),
    bodyText: text("body_text").default(""),
    category: text("category").notNull().default("transactional"),
    variablesJson: text("variables_json").default("[]"),
    createdByUserId: varchar("created_by_user_id").notNull().references(() => users.id),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });

  export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ id: true, createdAt: true, updatedAt: true });
  export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
  export type EmailTemplate = typeof emailTemplates.$inferSelect;

  export const emailStatusEnum = pgEnum("email_status", ["QUEUED", "SENT", "FAILED", "BOUNCED"]);

  export const emailLogs = pgTable("email_logs", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    templateId: varchar("template_id").references(() => emailTemplates.id),
    toEmail: text("to_email").notNull(),
    toName: text("to_name"),
    subject: text("subject").notNull(),
    status: emailStatusEnum("status").notNull().default("QUEUED"),
    sentAt: timestamp("sent_at"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  });

  export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({ id: true, createdAt: true, sentAt: true });
  export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;
  export type EmailLog = typeof emailLogs.$inferSelect;
  