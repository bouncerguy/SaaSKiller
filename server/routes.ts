import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import type { AvailabilityRule } from "@shared/schema";

const DAY_MAP: Record<string, number> = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
  THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
};

const DEFAULT_TENANT_SLUG = "default";

async function getDefaultTenant() {
  const tenant = await storage.getTenantBySlug(DEFAULT_TENANT_SLUG);
  if (!tenant) throw new Error("Default tenant not found");
  return tenant;
}

async function getDefaultUser(tenantId: string) {
  const users = await storage.getUsersByTenant(tenantId);
  const owner = users.find((u) => u.role === "OWNER") || users[0];
  if (!owner) throw new Error("No user found for tenant");
  return owner;
}

function generateTimeSlots(
  rules: AvailabilityRule[],
  dateStr: string,
  durationMinutes: number,
  existingBookings: { startAt: Date; endAt: Date }[],
): string[] {
  const date = new Date(dateStr + "T00:00:00");
  const dayOfWeek = date.getDay();
  const dayName = Object.entries(DAY_MAP).find(([, v]) => v === dayOfWeek)?.[0];
  if (!dayName) return [];

  const dayRules = rules.filter((r) => r.dayOfWeek === dayName);
  if (dayRules.length === 0) return [];

  const slots: string[] = [];
  const now = new Date();

  for (const rule of dayRules) {
    const [startH, startM] = rule.startTime.split(":").map(Number);
    const [endH, endM] = rule.endTime.split(":").map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + durationMinutes <= endMinutes) {
      const slotH = Math.floor(currentMinutes / 60);
      const slotM = currentMinutes % 60;
      const slotTime = `${String(slotH).padStart(2, "0")}:${String(slotM).padStart(2, "0")}`;

      const slotStart = new Date(date);
      slotStart.setHours(slotH, slotM, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

      if (slotStart > now) {
        const hasConflict = existingBookings.some((booking) => {
          const bStart = new Date(booking.startAt);
          const bEnd = new Date(booking.endAt);
          return slotStart < bEnd && slotEnd > bStart;
        });

        if (!hasConflict) {
          slots.push(slotTime);
        }
      }

      currentMinutes += 30;
    }
  }

  return slots.sort();
}

function isTimeWithinRules(
  rules: AvailabilityRule[],
  dateStr: string,
  time: string,
  durationMinutes: number,
): boolean {
  const date = new Date(dateStr + "T00:00:00");
  const dayOfWeek = date.getDay();
  const dayName = Object.entries(DAY_MAP).find(([, v]) => v === dayOfWeek)?.[0];
  if (!dayName) return false;

  const dayRules = rules.filter((r) => r.dayOfWeek === dayName);
  if (dayRules.length === 0) return false;

  const [timeH, timeM] = time.split(":").map(Number);
  const requestedStart = timeH * 60 + timeM;
  const requestedEnd = requestedStart + durationMinutes;

  return dayRules.some((rule) => {
    const [rStartH, rStartM] = rule.startTime.split(":").map(Number);
    const [rEndH, rEndM] = rule.endTime.split(":").map(Number);
    const ruleStart = rStartH * 60 + rStartM;
    const ruleEnd = rEndH * 60 + rEndM;
    return requestedStart >= ruleStart && requestedEnd <= ruleEnd;
  });
}

const createEventTypeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  locationType: z.enum(["IN_PERSON", "PHONE", "VIDEO", "CUSTOM"]).default("VIDEO"),
  locationValue: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  questionsJson: z.string().optional().nullable(),
});

const createBookingSchema = z.object({
  inviteeName: z.string().min(1, "Name is required"),
  inviteeEmail: z.string().email("Valid email is required"),
  notes: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  timezone: z.string().min(1).default("America/New_York"),
});

const createAvailabilitySchema = z.object({
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  timezone: z.string().default("America/New_York"),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {

  app.get("/api/admin/tenant", async (_req, res) => {
    try {
      const tenant = await getDefaultTenant();
      res.json(tenant);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/tenant", async (req, res) => {
    try {
      const tenant = await getDefaultTenant();
      const updated = await storage.updateTenant(tenant.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/event-types", async (_req, res) => {
    try {
      const tenant = await getDefaultTenant();
      const events = await storage.getEventTypesByTenant(tenant.id);
      res.json(events);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/event-types", async (req, res) => {
    try {
      const parsed = createEventTypeSchema.parse(req.body);
      const tenant = await getDefaultTenant();
      const user = await getDefaultUser(tenant.id);
      const event = await storage.createEventType({
        ...parsed,
        tenantId: tenant.id,
        ownerUserId: user.id,
      });
      res.json(event);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/event-types/:id", async (req, res) => {
    try {
      const updated = await storage.updateEventType(req.params.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/bookings", async (_req, res) => {
    try {
      const tenant = await getDefaultTenant();
      const bookingsList = await storage.getBookingsByTenant(tenant.id);
      res.json(bookingsList);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/bookings/:id/cancel", async (req, res) => {
    try {
      const updated = await storage.updateBooking(req.params.id, {
        status: "CANCELED",
        cancelReason: req.body.reason || "Canceled by admin",
      });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/availability", async (_req, res) => {
    try {
      const tenant = await getDefaultTenant();
      const user = await getDefaultUser(tenant.id);
      const rules = await storage.getAvailabilityRules(tenant.id, user.id);
      res.json(rules);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/availability", async (req, res) => {
    try {
      const parsed = createAvailabilitySchema.parse(req.body);
      const tenant = await getDefaultTenant();
      const user = await getDefaultUser(tenant.id);
      const rule = await storage.createAvailabilityRule({
        ...parsed,
        tenantId: tenant.id,
        userId: user.id,
      });
      res.json(rule);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/availability/:id", async (req, res) => {
    try {
      await storage.deleteAvailabilityRule(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/public/:tenantSlug", async (req, res) => {
    try {
      const tenant = await storage.getTenantBySlug(req.params.tenantSlug);
      if (!tenant) return res.status(404).json({ message: "Tenant not found" });

      const events = await storage.getEventTypesByTenant(tenant.id);
      const activeEvents = events.filter((e) => e.isActive);
      res.json({ tenant, eventTypes: activeEvents });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/public/:tenantSlug/:eventSlug", async (req, res) => {
    try {
      const tenant = await storage.getTenantBySlug(req.params.tenantSlug);
      if (!tenant) return res.status(404).json({ message: "Tenant not found" });

      const eventType = await storage.getEventTypeBySlug(tenant.id, req.params.eventSlug);
      if (!eventType || !eventType.isActive) {
        return res.status(404).json({ message: "Event type not found" });
      }

      res.json({ eventType, tenant });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/public/:tenantSlug/:eventSlug/slots/:date/:timezone", async (req, res) => {
    try {
      const tenant = await storage.getTenantBySlug(req.params.tenantSlug);
      if (!tenant) return res.status(404).json({ message: "Tenant not found" });

      const eventType = await storage.getEventTypeBySlug(tenant.id, req.params.eventSlug);
      if (!eventType) return res.status(404).json({ message: "Event type not found" });

      const user = await storage.getUser(eventType.ownerUserId);
      if (!user) return res.status(404).json({ message: "Host not found" });

      const rules = await storage.getAvailabilityRules(tenant.id, user.id);

      const dateStr = req.params.date;
      const dayStart = new Date(dateStr + "T00:00:00");
      const dayEnd = new Date(dateStr + "T23:59:59");

      const existingBookings = await storage.getBookingsByDateRange(
        tenant.id, user.id, dayStart, dayEnd,
      );

      const slots = generateTimeSlots(rules, dateStr, eventType.durationMinutes, existingBookings);

      res.json({ date: dateStr, slots });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/public/:tenantSlug/:eventSlug/book", async (req, res) => {
    try {
      const parsed = createBookingSchema.parse(req.body);

      const tenant = await storage.getTenantBySlug(req.params.tenantSlug);
      if (!tenant) return res.status(404).json({ message: "Tenant not found" });

      const eventType = await storage.getEventTypeBySlug(tenant.id, req.params.eventSlug);
      if (!eventType || !eventType.isActive) {
        return res.status(404).json({ message: "Event type not found or inactive" });
      }

      const user = await storage.getUser(eventType.ownerUserId);
      if (!user) return res.status(404).json({ message: "Host not found" });

      const rules = await storage.getAvailabilityRules(tenant.id, user.id);
      if (!isTimeWithinRules(rules, parsed.date, parsed.time, eventType.durationMinutes)) {
        return res.status(400).json({ message: "Selected time is outside available hours" });
      }

      const startAt = new Date(`${parsed.date}T${parsed.time}:00`);
      const endAt = new Date(startAt);
      endAt.setMinutes(endAt.getMinutes() + eventType.durationMinutes);

      if (startAt <= new Date()) {
        return res.status(400).json({ message: "Cannot book a time in the past" });
      }

      const dayStart = new Date(parsed.date + "T00:00:00");
      const dayEnd = new Date(parsed.date + "T23:59:59");
      const existingBookings = await storage.getBookingsByDateRange(
        tenant.id, eventType.ownerUserId, dayStart, dayEnd,
      );

      const hasConflict = existingBookings.some((booking) => {
        const bStart = new Date(booking.startAt);
        const bEnd = new Date(booking.endAt);
        return startAt < bEnd && endAt > bStart;
      });

      if (hasConflict) {
        return res.status(409).json({ message: "This time slot is no longer available" });
      }

      const booking = await storage.createBooking({
        tenantId: tenant.id,
        eventTypeId: eventType.id,
        hostUserId: eventType.ownerUserId,
        inviteeName: parsed.inviteeName,
        inviteeEmail: parsed.inviteeEmail,
        startAt,
        endAt,
        timezone: parsed.timezone,
        status: "CONFIRMED",
        notes: parsed.notes || null,
        cancelReason: null,
      });

      res.json(booking);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  return httpServer;
}
