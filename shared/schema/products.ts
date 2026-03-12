import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  import { tenants } from "./core";

  export const billingCycleEnum = pgEnum("billing_cycle", ["ONE_TIME", "MONTHLY", "QUARTERLY", "YEARLY"]);

  export const products = pgTable("products", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    name: text("name").notNull(),
    description: text("description"),
    price: integer("price").notNull().default(0),
    billingCycle: billingCycleEnum("billing_cycle").notNull().default("ONE_TIME"),
    category: text("category"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });

  export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
  export type InsertProduct = z.infer<typeof insertProductSchema>;
  export type Product = typeof products.$inferSelect;
  