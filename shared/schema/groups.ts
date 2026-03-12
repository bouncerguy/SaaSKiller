import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  import { tenants, users } from "./core";

  export const groups = pgTable("groups", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  });

  export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
  export type InsertGroup = z.infer<typeof insertGroupSchema>;
  export type Group = typeof groups.$inferSelect;

  export const userGroups = pgTable("user_groups", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id),
    groupId: varchar("group_id").notNull().references(() => groups.id),
  });

  export const insertUserGroupSchema = createInsertSchema(userGroups).omit({ id: true });
  export type InsertUserGroup = z.infer<typeof insertUserGroupSchema>;
  export type UserGroup = typeof userGroups.$inferSelect;

  export const features = pgTable("features", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    enabledGlobally: boolean("enabled_globally").notNull().default(false),
  });

  export const insertFeatureSchema = createInsertSchema(features).omit({ id: true });
  export type InsertFeature = z.infer<typeof insertFeatureSchema>;
  export type Feature = typeof features.$inferSelect;

  export const groupFeatures = pgTable("group_features", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    groupId: varchar("group_id").notNull().references(() => groups.id),
    featureId: varchar("feature_id").notNull().references(() => features.id),
    enabled: boolean("enabled").notNull().default(false),
  });

  export const insertGroupFeatureSchema = createInsertSchema(groupFeatures).omit({ id: true });
  export type InsertGroupFeature = z.infer<typeof insertGroupFeatureSchema>;
  export type GroupFeature = typeof groupFeatures.$inferSelect;

  export const userFeatures = pgTable("user_features", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id),
    featureId: varchar("feature_id").notNull().references(() => features.id),
    enabled: boolean("enabled").notNull().default(false),
  });

  export const insertUserFeatureSchema = createInsertSchema(userFeatures).omit({ id: true });
  export type InsertUserFeature = z.infer<typeof insertUserFeatureSchema>;
  export type UserFeature = typeof userFeatures.$inferSelect;

  export const settings = pgTable("settings", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    key: text("key").notNull().unique(),
    value: text("value"),
    category: text("category"),
  });

  export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });
  export type InsertSetting = z.infer<typeof insertSettingSchema>;
  export type Setting = typeof settings.$inferSelect;

  export const activityLog = pgTable("activity_log", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").references(() => tenants.id),
    userId: varchar("user_id").references(() => users.id),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    action: text("action").notNull(),
    details: text("details"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  });

  export const insertActivityLogSchema = createInsertSchema(activityLog).omit({ id: true, createdAt: true });
  export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
  export type ActivityLog = typeof activityLog.$inferSelect;
  