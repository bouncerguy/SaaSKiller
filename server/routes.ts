import type { Express } from "express";
import type { Server } from "http";
import { registerAllRoutes } from "./routes/index";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  registerAllRoutes(app);
  return httpServer;
}
