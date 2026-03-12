import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  import { tenants, users, paymentStatusEnum } from "./core";

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
  