import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  import { tenants, users } from "./core";

  export const mediaAssets = pgTable("media_assets", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    filename: text("filename").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull().default(0),
    url: text("url").notNull(),
    alt: text("alt"),
    tagsJson: text("tags_json").default("[]"),
    folder: text("folder").default(""),
    uploadedByUserId: varchar("uploaded_by_user_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  });

  export const insertMediaAssetSchema = createInsertSchema(mediaAssets).omit({ id: true, createdAt: true });
  export type InsertMediaAsset = z.infer<typeof insertMediaAssetSchema>;
  export type MediaAsset = typeof mediaAssets.$inferSelect;
  