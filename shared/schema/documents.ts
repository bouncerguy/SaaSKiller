import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  import { tenants, users } from "./core";
  import { customers } from "./crm";

  export const documentStatusEnum = pgEnum("document_status", ["DRAFT", "SENT", "COMPLETED", "CANCELLED", "EXPIRED"]);
  export const signerRoleEnum = pgEnum("signer_role", ["SIGNER", "VIEWER", "APPROVER"]);
  export const signerStatusEnum = pgEnum("signer_status", ["PENDING", "VIEWED", "SIGNED", "DECLINED"]);

  export const documents = pgTable("documents", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    content: text("content"),
    status: documentStatusEnum("status").notNull().default("DRAFT"),
    customerId: varchar("customer_id").references(() => customers.id),
    createdBy: varchar("created_by").references(() => users.id),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });

  export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true, updatedAt: true });
  export type InsertDocument = z.infer<typeof insertDocumentSchema>;
  export type Document = typeof documents.$inferSelect;

  export const documentSigners = pgTable("document_signers", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    documentId: varchar("document_id").notNull().references(() => documents.id),
    name: text("name").notNull(),
    email: text("email").notNull(),
    role: signerRoleEnum("role").notNull().default("SIGNER"),
    status: signerStatusEnum("status").notNull().default("PENDING"),
    signedAt: timestamp("signed_at"),
    signature: text("signature"),
    ipAddress: text("ip_address"),
    order: integer("order").notNull().default(1),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  });

  export const insertDocumentSignerSchema = createInsertSchema(documentSigners).omit({ id: true, createdAt: true });
  export type InsertDocumentSigner = z.infer<typeof insertDocumentSignerSchema>;
  export type DocumentSigner = typeof documentSigners.$inferSelect;

  export const documentActivityLog = pgTable("document_activity_log", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    documentId: varchar("document_id").notNull().references(() => documents.id),
    signerId: varchar("signer_id").references(() => documentSigners.id),
    action: text("action").notNull(),
    details: text("details"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  });

  export const insertDocumentActivitySchema = createInsertSchema(documentActivityLog).omit({ id: true, createdAt: true });
  export type InsertDocumentActivity = z.infer<typeof insertDocumentActivitySchema>;
  export type DocumentActivity = typeof documentActivityLog.$inferSelect;
  