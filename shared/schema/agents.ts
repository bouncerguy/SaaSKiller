import { sql } from "drizzle-orm";
  import { pgTable, text, varchar, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
  import { createInsertSchema } from "drizzle-zod";
  import { z } from "zod";
  import { tenants, users } from "./core";

  export const agentStatusEnum = pgEnum("agent_status", ["ACTIVE", "PAUSED", "DRAFT"]);

  export const agents = pgTable("agents", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    name: text("name").notNull(),
    description: text("description"),
    status: agentStatusEnum("status").notNull().default("DRAFT"),
    triggerType: text("trigger_type").notNull().default("manual"),
    triggerConfig: text("trigger_config").default("{}"),
    actionsJson: text("actions_json").default("[]"),
    lastRunAt: timestamp("last_run_at"),
    runCount: integer("run_count").notNull().default(0),
    createdByUserId: varchar("created_by_user_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });

  export const insertAgentSchema = createInsertSchema(agents).omit({ id: true, createdAt: true, updatedAt: true, lastRunAt: true, runCount: true });
  export type InsertAgent = z.infer<typeof insertAgentSchema>;
  export type Agent = typeof agents.$inferSelect;

  export const agentRuns = pgTable("agent_runs", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
    agentId: varchar("agent_id").notNull().references(() => agents.id),
    status: text("status").notNull().default("running"),
    startedAt: timestamp("started_at").notNull().default(sql`now()`),
    completedAt: timestamp("completed_at"),
    resultJson: text("result_json"),
    errorMessage: text("error_message"),
  });

  export const insertAgentRunSchema = createInsertSchema(agentRuns).omit({ id: true, startedAt: true, completedAt: true });
  export type InsertAgentRun = z.infer<typeof insertAgentRunSchema>;
  export type AgentRun = typeof agentRuns.$inferSelect;
  