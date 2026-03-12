import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  import { tenants, users } from "./core";
  import { customers } from "./crm";

  export const ticketPriorityEnum = pgEnum("ticket_priority", ["LOW", "MEDIUM", "HIGH", "URGENT"]);
  export const ticketStatusEnum = pgEnum("ticket_status", ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]);

  export const tickets = pgTable("tickets", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    subject: text("subject").notNull(),
    description: text("description"),
    priority: ticketPriorityEnum("priority").notNull().default("MEDIUM"),
    status: ticketStatusEnum("status").notNull().default("OPEN"),
    assignedUserId: varchar("assigned_user_id").references(() => users.id),
    customerId: varchar("customer_id").references(() => customers.id),
    createdByUserId: varchar("created_by_user_id").notNull().references(() => users.id),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });

  export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, createdAt: true, updatedAt: true, resolvedAt: true });
  export type InsertTicket = z.infer<typeof insertTicketSchema>;
  export type Ticket = typeof tickets.$inferSelect;
  