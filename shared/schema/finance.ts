import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  import { tenants, users } from "./core";
  import { customers } from "./crm";

  export const invoiceStatusEnum = pgEnum("invoice_status", ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]);

  export const invoices = pgTable("invoices", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    customerId: varchar("customer_id").references(() => customers.id),
    invoiceNumber: text("invoice_number").notNull(),
    status: invoiceStatusEnum("status").notNull().default("DRAFT"),
    subtotal: integer("subtotal").notNull().default(0),
    tax: integer("tax").notNull().default(0),
    total: integer("total").notNull().default(0),
    dueDate: timestamp("due_date"),
    paidAt: timestamp("paid_at"),
    notes: text("notes"),
    lineItemsJson: text("line_items_json").default("[]"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });

  export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true, paidAt: true });
  export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
  export type Invoice = typeof invoices.$inferSelect;

  export const timeEntries = pgTable("time_entries", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    userId: varchar("user_id").notNull().references(() => users.id),
    customerId: varchar("customer_id").references(() => customers.id),
    description: text("description"),
    startAt: timestamp("start_at").notNull(),
    endAt: timestamp("end_at"),
    durationMinutes: integer("duration_minutes"),
    billable: boolean("billable").notNull().default(true),
    hourlyRate: integer("hourly_rate"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  });

  export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({ id: true, createdAt: true });
  export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
  export type TimeEntry = typeof timeEntries.$inferSelect;
  