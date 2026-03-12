import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  import { tenants } from "./core";

  export const pageStatusEnum = pgEnum("page_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);

  export const pages = pgTable("pages", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    content: text("content").notNull().default("[]"),
    metaDescription: text("meta_description"),
    status: pageStatusEnum("status").notNull().default("DRAFT"),
    isHomepage: boolean("is_homepage").notNull().default(false),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });

  export const insertPageSchema = createInsertSchema(pages).omit({ id: true, createdAt: true, updatedAt: true });
  export type InsertPage = z.infer<typeof insertPageSchema>;
  export type Page = typeof pages.$inferSelect;

  export const funnelStatusEnum = pgEnum("funnel_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);

  export const funnels = pgTable("funnels", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    status: funnelStatusEnum("funnel_status").notNull().default("DRAFT"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });

  export const insertFunnelSchema = createInsertSchema(funnels).omit({ id: true, createdAt: true, updatedAt: true });
  export type InsertFunnel = z.infer<typeof insertFunnelSchema>;
  export type Funnel = typeof funnels.$inferSelect;

  export const funnelSteps = pgTable("funnel_steps", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    funnelId: varchar("funnel_id").notNull().references(() => funnels.id),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    title: text("title").notNull(),
    stepType: text("step_type").notNull().default("custom"),
    content: text("content").notNull().default("[]"),
    stepOrder: integer("step_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });

  export const insertFunnelStepSchema = createInsertSchema(funnelSteps).omit({ id: true, createdAt: true, updatedAt: true });
  export type InsertFunnelStep = z.infer<typeof insertFunnelStepSchema>;
  export type FunnelStep = typeof funnelSteps.$inferSelect;
  