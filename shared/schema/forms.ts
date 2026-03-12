import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  import { tenants, users } from "./core";

  export const formStatusEnum = pgEnum("form_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);

  export const forms = pgTable("forms", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    name: text("name").notNull(),
    description: text("description"),
    slug: text("slug").notNull(),
    status: formStatusEnum("status").notNull().default("DRAFT"),
    fieldsJson: text("fields_json").default("[]"),
    settingsJson: text("settings_json").default("{}"),
    responseCount: integer("response_count").notNull().default(0),
    createdByUserId: varchar("created_by_user_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });

  export const insertFormSchema = createInsertSchema(forms).omit({ id: true, createdAt: true, updatedAt: true, responseCount: true });
  export type InsertForm = z.infer<typeof insertFormSchema>;
  export type Form = typeof forms.$inferSelect;

  export const formResponses = pgTable("form_responses", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    formId: varchar("form_id").notNull().references(() => forms.id),
    dataJson: text("data_json").notNull().default("{}"),
    submittedAt: timestamp("submitted_at").notNull().default(sql`now()`),
    ipAddress: text("ip_address"),
    referrer: text("referrer"),
  });

  export const insertFormResponseSchema = createInsertSchema(formResponses).omit({ id: true, submittedAt: true });
  export type InsertFormResponse = z.infer<typeof insertFormResponseSchema>;
  export type FormResponse = typeof formResponses.$inferSelect;
  