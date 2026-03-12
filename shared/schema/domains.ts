import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  import { tenants } from "./core";

  export const domains = pgTable("domains", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    domain: text("domain").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    isVerified: boolean("is_verified").notNull().default(false),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  });

  export const insertDomainSchema = createInsertSchema(domains).omit({ id: true, createdAt: true, isVerified: true });
  export type InsertDomain = z.infer<typeof insertDomainSchema>;
  export type Domain = typeof domains.$inferSelect;
  