import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  import { tenants, users } from "./core";

  export const socialPlatformEnum = pgEnum("social_platform", ["twitter", "facebook", "linkedin", "instagram"]);
  export const socialAccountStatusEnum = pgEnum("social_account_status", ["ACTIVE", "INACTIVE"]);
  export const socialPostStatusEnum = pgEnum("social_post_status", ["DRAFT", "SCHEDULED", "PUBLISHING", "PUBLISHED", "FAILED"]);

  export const socialAccounts = pgTable("social_accounts", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    platform: socialPlatformEnum("platform").notNull(),
    accountName: text("account_name").notNull(),
    accessToken: text("access_token").notNull(),
    accessTokenSecret: text("access_token_secret"),
    apiKey: text("api_key"),
    apiSecret: text("api_secret"),
    pageId: text("page_id"),
    status: socialAccountStatusEnum("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });

  export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({ id: true, createdAt: true, updatedAt: true });
  export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
  export type SocialAccount = typeof socialAccounts.$inferSelect;

  export const socialPosts = pgTable("social_posts", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    content: text("content").notNull(),
    mediaUrl: text("media_url"),
    status: socialPostStatusEnum("status").notNull().default("DRAFT"),
    scheduledAt: timestamp("scheduled_at"),
    publishedAt: timestamp("published_at"),
    createdBy: varchar("created_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });

  export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({ id: true, createdAt: true, updatedAt: true });
  export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
  export type SocialPost = typeof socialPosts.$inferSelect;

  export const socialPostPlatforms = pgTable("social_post_platforms", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    postId: varchar("post_id").notNull().references(() => socialPosts.id),
    platform: socialPlatformEnum("platform").notNull(),
    socialAccountId: varchar("social_account_id").notNull().references(() => socialAccounts.id),
    platformPostId: text("platform_post_id"),
    status: socialPostStatusEnum("status").notNull().default("DRAFT"),
    error: text("error"),
    publishedAt: timestamp("published_at"),
  });

  export const insertSocialPostPlatformSchema = createInsertSchema(socialPostPlatforms).omit({ id: true });
  export type InsertSocialPostPlatform = z.infer<typeof insertSocialPostPlatformSchema>;
  export type SocialPostPlatform = typeof socialPostPlatforms.$inferSelect;
  