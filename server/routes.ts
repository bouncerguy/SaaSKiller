import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import type { AvailabilityRule, Lead } from "@shared/schema";
import { fetchIcsEvents, getBusyRangesForDate, testIcsUrl } from "./ics-calendar";
import { requireAuth, hashPassword } from "./auth";
import passport from "passport";

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

function generateTimeSlots(
  rules: AvailabilityRule[],
  dateStr: string,
  durationMinutes: number,
  existingBookings: { startAt: Date; endAt: Date }[],
  icsBusyRanges: { start: Date; end: Date }[] = [],
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
        const hasBookingConflict = existingBookings.some((booking) => {
          const bStart = new Date(booking.startAt);
          const bEnd = new Date(booking.endAt);
          return slotStart < bEnd && slotEnd > bStart;
        });

        const hasIcsConflict = icsBusyRanges.some((busy) => {
          return slotStart < busy.end && slotEnd > busy.start;
        });

        if (!hasBookingConflict && !hasIcsConflict) {
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

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const addTeamMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["OWNER", "MEMBER"]).default("MEMBER"),
});

const updateTeamMemberSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["OWNER", "MEMBER"]).optional(),
}).strict();

const setupSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  slug: z.string().min(1, "URL slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  timezone: z.string().min(1, "Timezone is required"),
  userName: z.string().min(1, "Name is required"),
  userEmail: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {

  app.get("/api/setup/status", async (_req, res) => {
    try {
      const allTenants = await storage.getAllTenants();
      res.json({ needsSetup: allTenants.length === 0 });
    } catch (e: any) {
      res.json({ needsSetup: true });
    }
  });

  app.post("/api/setup", async (req, res, next) => {
    try {
      const allTenants = await storage.getAllTenants();
      if (allTenants.length > 0) {
        return res.status(403).json({ message: "Setup already completed" });
      }

      const parsed = setupSchema.parse(req.body);

      const existingSlug = await storage.getTenantBySlug(parsed.slug);
      if (existingSlug) {
        return res.status(400).json({ message: "This URL slug is already taken" });
      }

      const tenant = await storage.createTenant({
        name: parsed.organizationName,
        slug: parsed.slug,
        timezone: parsed.timezone,
        brandColor: "#5b4cdb",
        logoUrl: null,
      });

      const passwordHash = await hashPassword(parsed.password);
      const user = await storage.createUser({
        tenantId: tenant.id,
        name: parsed.userName,
        email: parsed.userEmail,
        role: "OWNER",
        passwordHash,
      });

      await storage.seedDefaultFeatures();

      await storage.logActivity({
        tenantId: tenant.id,
        userId: user.id,
        entityType: "system",
        entityId: tenant.id,
        action: "setup_completed",
        details: JSON.stringify({ organizationName: parsed.organizationName }),
      });

      req.login(
        { id: user.id, tenantId: user.tenantId, name: user.name, email: user.email, role: user.role },
        (err) => {
          if (err) return next(err);
          res.json({ id: user.id, name: user.name, email: user.email, role: user.role, tenantId: tenant.id });
        },
      );
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const parsed = registerSchema.parse(req.body);

      const existing = await storage.getUserByEmail(parsed.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const tenant = await getDefaultTenant();
      const users = await storage.getUsersByTenant(tenant.id);
      const role = users.length === 0 ? "OWNER" : "MEMBER";

      if (users.length > 0 && (!req.isAuthenticated() || req.user?.role !== "OWNER")) {
        return res.status(403).json({ message: "Only the account owner can register new users" });
      }

      const passwordHash = await hashPassword(parsed.password);
      const user = await storage.createUser({
        tenantId: tenant.id,
        name: parsed.name,
        email: parsed.email,
        role,
        passwordHash,
      });

      if (users.length === 0) {
        req.login(
          { id: user.id, tenantId: user.tenantId, name: user.name, email: user.email, role: user.role },
          (err) => {
            if (err) return next(err);
            res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
          },
        );
      } else {
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
      }
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });

      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  app.get("/api/admin/tenant", requireAuth, async (req, res) => {
    try {
      const tenant = await storage.getTenant(req.user!.tenantId);
      if (!tenant) return res.status(404).json({ message: "Tenant not found" });
      res.json(tenant);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/tenant", requireAuth, async (req, res) => {
    try {
      const updateTenantSchema = z.object({
        name: z.string().min(1).optional(),
        brandColor: z.string().optional(),
        timezone: z.string().optional(),
        logoUrl: z.string().nullable().optional(),
        calendarIcsUrl: z.string().url().nullable().optional(),
      }).strict();

      const parsed = updateTenantSchema.parse(req.body);

      if (parsed.calendarIcsUrl) {
        const url = new URL(parsed.calendarIcsUrl);
        if (!["http:", "https:"].includes(url.protocol)) {
          return res.status(400).json({ message: "Only http/https calendar URLs are supported" });
        }
      }

      const updated = await storage.updateTenant(req.user!.tenantId, parsed);
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/event-types", requireAuth, async (req, res) => {
    try {
      const events = await storage.getEventTypesByTenant(req.user!.tenantId);
      res.json(events);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/event-types", requireAuth, async (req, res) => {
    try {
      const parsed = createEventTypeSchema.parse(req.body);
      const event = await storage.createEventType({
        ...parsed,
        tenantId: req.user!.tenantId,
        ownerUserId: req.user!.id,
      });
      res.json(event);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/event-types/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateEventType(req.params.id as string, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/bookings", requireAuth, async (req, res) => {
    try {
      const bookingsList = await storage.getBookingsByTenant(req.user!.tenantId);
      res.json(bookingsList);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/bookings/:id/cancel", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateBooking(req.params.id as string, {
        status: "CANCELED",
        cancelReason: req.body.reason || "Canceled by admin",
      });
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/availability", requireAuth, async (req, res) => {
    try {
      const rules = await storage.getAvailabilityRules(req.user!.tenantId, req.user!.id);
      res.json(rules);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/availability", requireAuth, async (req, res) => {
    try {
      const parsed = createAvailabilitySchema.parse(req.body);
      const rule = await storage.createAvailabilityRule({
        ...parsed,
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
      });
      res.json(rule);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/availability/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteAvailabilityRule(req.params.id as string);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/calendar/test", requireAuth, async (req, res) => {
    try {
      const schema = z.object({ url: z.string().url("Please enter a valid URL") });
      const { url } = schema.parse(req.body);
      const result = await testIcsUrl(url);
      res.json(result);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Invalid URL" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/team", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can manage team members" });
      }
      const members = await storage.getUsersByTenant(req.user!.tenantId);
      const safeMembers = members.map(({ passwordHash, ...rest }) => rest);
      res.json(safeMembers);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/team", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can add team members" });
      }

      const parsed = addTeamMemberSchema.parse(req.body);

      const existing = await storage.getUserByEmail(parsed.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const passwordHash = await hashPassword(parsed.password);
      const user = await storage.createUser({
        tenantId: req.user!.tenantId,
        name: parsed.name,
        email: parsed.email,
        role: parsed.role,
        passwordHash,
      });

      const { passwordHash: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/team/:id", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can update team members" });
      }

      const targetUser = await storage.getUser(req.params.id as string);
      if (!targetUser || targetUser.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Team member not found" });
      }

      const parsed = updateTeamMemberSchema.parse(req.body);
      const updated = await storage.updateUser(req.params.id as string, parsed);
      const { passwordHash: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/team/:id", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can remove team members" });
      }

      const targetUser = await storage.getUser(req.params.id as string);
      if (!targetUser || targetUser.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Team member not found" });
      }

      if ((req.params.id as string) === req.user!.id) {
        return res.status(400).json({ message: "Cannot remove yourself" });
      }

      await storage.deleteUser(req.params.id as string);
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

      let icsBusyRanges: { start: Date; end: Date }[] = [];
      if (tenant.calendarIcsUrl) {
        try {
          const allEvents = await fetchIcsEvents(tenant.calendarIcsUrl);
          icsBusyRanges = getBusyRangesForDate(allEvents, dateStr);
        } catch (err) {
          console.error("Failed to fetch ICS calendar:", err);
        }
      }

      const slots = generateTimeSlots(rules, dateStr, eventType.durationMinutes, existingBookings, icsBusyRanges);

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

      if (tenant.calendarIcsUrl) {
        try {
          const allEvents = await fetchIcsEvents(tenant.calendarIcsUrl);
          const icsBusy = getBusyRangesForDate(allEvents, parsed.date);
          const hasIcsConflict = icsBusy.some((busy) => startAt < busy.end && endAt > busy.start);
          if (hasIcsConflict) {
            return res.status(409).json({ message: "This time slot conflicts with an existing calendar event" });
          }
        } catch (err) {
          console.error("Failed to check ICS calendar during booking:", err);
        }
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

  app.get("/api/hud/groups", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can manage groups" });
      }
      const groupsList = await storage.getGroupsByTenant(req.user!.tenantId);
      const groupsWithCounts = await Promise.all(
        groupsList.map(async (group) => {
          const members = await storage.getGroupMembers(group.id);
          return { ...group, memberCount: members.length };
        })
      );
      res.json(groupsWithCounts);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/hud/groups", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can create groups" });
      }
      const schema = z.object({
        name: z.string().min(1, "Group name is required"),
        description: z.string().optional().nullable(),
      });
      const parsed = schema.parse(req.body);
      const group = await storage.createGroup({
        tenantId: req.user!.tenantId,
        name: parsed.name,
        description: parsed.description || null,
      });
      res.json(group);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/hud/groups/:id", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can update groups" });
      }
      const group = await storage.getGroup(req.params.id as string);
      if (!group || group.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Group not found" });
      }
      const schema = z.object({
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
      });
      const parsed = schema.parse(req.body);
      const updated = await storage.updateGroup(req.params.id as string, parsed);
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/hud/groups/:id", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can delete groups" });
      }
      const group = await storage.getGroup(req.params.id as string);
      if (!group || group.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Group not found" });
      }
      await storage.deleteGroup(req.params.id as string);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/hud/groups/:id/members", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can view group members" });
      }
      const group = await storage.getGroup(req.params.id as string);
      if (!group || group.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Group not found" });
      }
      const members = await storage.getGroupMembers(req.params.id as string);
      const safeMembers = members.map(({ passwordHash, ...rest }) => rest);
      res.json(safeMembers);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/hud/groups/:id/members", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can manage group members" });
      }
      const group = await storage.getGroup(req.params.id as string);
      if (!group || group.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Group not found" });
      }
      const schema = z.object({ userId: z.string().min(1) });
      const { userId } = schema.parse(req.body);
      const targetUser = await storage.getUser(userId);
      if (!targetUser || targetUser.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "User not found" });
      }
      const ug = await storage.addUserToGroup(userId, req.params.id as string);
      res.json(ug);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/hud/groups/:id/members", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can manage group members" });
      }
      const group = await storage.getGroup(req.params.id as string);
      if (!group || group.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Group not found" });
      }
      const schema = z.object({ userId: z.string().min(1) });
      const { userId } = schema.parse(req.body);
      await storage.removeUserFromGroup(userId, req.params.id as string);
      res.json({ success: true });
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/hud/groups/:id/features", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can view group features" });
      }
      const group = await storage.getGroup(req.params.id as string);
      if (!group || group.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Group not found" });
      }
      const allFeatures = await storage.getFeatures();
      const gf = await storage.getGroupFeatures(req.params.id as string);
      const result = allFeatures.map((feature) => {
        const override = gf.find((g) => g.featureId === feature.id);
        return {
          featureId: feature.id,
          featureName: feature.name,
          featureSlug: feature.slug,
          enabledGlobally: feature.enabledGlobally,
          enabled: override ? override.enabled : feature.enabledGlobally,
          hasOverride: !!override,
        };
      });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/hud/groups/:id/features", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can manage group features" });
      }
      const group = await storage.getGroup(req.params.id as string);
      if (!group || group.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Group not found" });
      }
      const schema = z.object({
        featureId: z.string().min(1),
        enabled: z.boolean(),
      });
      const { featureId, enabled } = schema.parse(req.body);
      await storage.setGroupFeature(req.params.id as string, featureId, enabled);
      res.json({ success: true });
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/hud/users", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can manage users" });
      }
      const members = await storage.getUsersByTenant(req.user!.tenantId);
      const usersWithGroups = await Promise.all(
        members.map(async ({ passwordHash, ...rest }) => {
          const userGroupsList = await storage.getUserGroups(rest.id);
          return { ...rest, groups: userGroupsList };
        })
      );
      res.json(usersWithGroups);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/hud/users/:id/active", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can manage users" });
      }
      const targetUser = await storage.getUser(req.params.id as string);
      if (!targetUser || targetUser.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "User not found" });
      }
      if ((req.params.id as string) === req.user!.id) {
        return res.status(400).json({ message: "Cannot deactivate yourself" });
      }
      const schema = z.object({ isActive: z.boolean() });
      const { isActive } = schema.parse(req.body);
      const updated = await storage.updateUser(req.params.id as string, { isActive });
      const { passwordHash: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/hud/users/:id/groups", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can manage user groups" });
      }
      const targetUser = await storage.getUser(req.params.id as string);
      if (!targetUser || targetUser.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "User not found" });
      }
      const schema = z.object({ groupId: z.string().min(1) });
      const { groupId } = schema.parse(req.body);
      const group = await storage.getGroup(groupId);
      if (!group || group.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Group not found" });
      }
      const ug = await storage.addUserToGroup(req.params.id as string, groupId);
      res.json(ug);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/hud/users/:id/groups/:groupId", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== "OWNER") {
        return res.status(403).json({ message: "Only owners can manage user groups" });
      }
      const targetUser = await storage.getUser(req.params.id as string);
      if (!targetUser || targetUser.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.removeUserFromGroup(req.params.id as string, req.params.groupId as string);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  const createCustomerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
    businessName: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    billingType: z.string().optional().nullable(),
    paymentStatus: z.enum(["CURRENT", "PAST_DUE_30", "PAST_DUE_60", "COLLECTIONS"]).default("CURRENT"),
  });

  const updateCustomerSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    businessName: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    billingType: z.string().nullable().optional(),
    paymentStatus: z.enum(["CURRENT", "PAST_DUE_30", "PAST_DUE_60", "COLLECTIONS"]).optional(),
    isActive: z.boolean().optional(),
  });

  app.get("/api/admin/customers", requireAuth, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const result = search
        ? await storage.searchCustomers(req.user!.tenantId, search)
        : await storage.getCustomersByTenant(req.user!.tenantId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/customers", requireAuth, async (req, res) => {
    try {
      const parsed = createCustomerSchema.parse(req.body);
      const existing = await storage.getCustomerByEmail(req.user!.tenantId, parsed.email);
      if (existing) {
        return res.status(400).json({ message: "A customer with this email already exists" });
      }
      const customer = await storage.createCustomer({
        ...parsed,
        tenantId: req.user!.tenantId,
      });
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "customer",
        entityId: customer.id,
        action: "created",
        details: JSON.stringify({ name: customer.name, email: customer.email }),
      });
      res.json(customer);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/customers/:id", requireAuth, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id as string);
      if (!customer || customer.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Customer not found" });
      }
      const [customerNotes, activity, customerTickets, customerInvoices, customerTimeEntries] = await Promise.all([
        storage.getNotes("customer", customer.id, req.user!.tenantId),
        storage.getActivityLog({ entityType: "customer", entityId: customer.id, limit: 50 }),
        storage.getTicketsByCustomer(req.user!.tenantId, customer.id),
        storage.getInvoicesByCustomer(req.user!.tenantId, customer.id),
        storage.getTimeEntriesByCustomer(req.user!.tenantId, customer.id),
      ]);
      res.json({ customer, notes: customerNotes, activity, tickets: customerTickets, invoices: customerInvoices, timeEntries: customerTimeEntries });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/customers/:id", requireAuth, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id as string);
      if (!customer || customer.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Customer not found" });
      }
      const parsed = updateCustomerSchema.parse(req.body);
      const updated = await storage.updateCustomer(req.params.id as string, parsed);
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "customer",
        entityId: updated.id,
        action: "updated",
        details: JSON.stringify(parsed),
      });
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  const createLeadSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    source: z.string().optional().nullable(),
    pipelineId: z.string().optional().nullable(),
    stage: z.string().optional(),
  });

  const updateLeadSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
    pipelineId: z.string().nullable().optional(),
    stage: z.string().optional(),
    awarenessData: z.string().nullable().optional(),
  });

  app.get("/api/admin/pipelines", requireAuth, async (req, res) => {
    try {
      let pipelinesList = await storage.getPipelinesByTenant(req.user!.tenantId);
      if (pipelinesList.length === 0) {
        const defaultPipeline = await storage.createPipeline({
          tenantId: req.user!.tenantId,
          name: "Sales Pipeline",
          stages: JSON.stringify(["New Lead", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]),
          isDefault: true,
        });
        pipelinesList = [defaultPipeline];
      }
      res.json(pipelinesList);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/pipelines", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1, "Pipeline name is required"),
        stages: z.string().min(1, "Stages are required"),
      });
      const parsed = schema.parse(req.body);
      const pipeline = await storage.createPipeline({
        tenantId: req.user!.tenantId,
        name: parsed.name,
        stages: parsed.stages,
        isDefault: false,
      });
      res.json(pipeline);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/pipelines/:id", requireAuth, async (req, res) => {
    try {
      const pipeline = await storage.getPipeline(req.params.id as string);
      if (!pipeline || pipeline.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Pipeline not found" });
      }
      const schema = z.object({
        name: z.string().min(1).optional(),
        stages: z.string().optional(),
      });
      const parsed = schema.parse(req.body);
      const updated = await storage.updatePipeline(req.params.id as string, parsed);
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/pipelines/:id", requireAuth, async (req, res) => {
    try {
      const pipeline = await storage.getPipeline(req.params.id as string);
      if (!pipeline || pipeline.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Pipeline not found" });
      }
      const pipelineLeads = await storage.getLeadsByPipeline(req.params.id as string);
      if (pipelineLeads.length > 0) {
        return res.status(400).json({ message: "Cannot delete pipeline with existing leads. Move or delete leads first." });
      }
      await storage.deletePipeline(req.params.id as string);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/leads", requireAuth, async (req, res) => {
    try {
      const pipelineId = req.query.pipelineId as string | undefined;
      if (pipelineId) {
        const pipeline = await storage.getPipeline(pipelineId);
        if (!pipeline || pipeline.tenantId !== req.user!.tenantId) {
          return res.status(404).json({ message: "Pipeline not found" });
        }
      }
      const result = pipelineId
        ? await storage.getLeadsByPipeline(pipelineId)
        : await storage.getLeadsByTenant(req.user!.tenantId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/leads", requireAuth, async (req, res) => {
    try {
      const parsed = createLeadSchema.parse(req.body);
      let pipelineId = parsed.pipelineId;
      let stage = parsed.stage || "New Lead";
      if (!pipelineId) {
        let pipelinesList = await storage.getPipelinesByTenant(req.user!.tenantId);
        if (pipelinesList.length === 0) {
          const defaultPipeline = await storage.createPipeline({
            tenantId: req.user!.tenantId,
            name: "Sales Pipeline",
            stages: JSON.stringify(["New Lead", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]),
            isDefault: true,
          });
          pipelinesList = [defaultPipeline];
        }
        pipelineId = pipelinesList[0].id;
      }
      const lead = await storage.createLead({
        tenantId: req.user!.tenantId,
        name: parsed.name,
        email: parsed.email || null,
        phone: parsed.phone || null,
        source: parsed.source || null,
        pipelineId,
        stage,
      });
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "lead",
        entityId: lead.id,
        action: "created",
        details: JSON.stringify({ name: lead.name, email: lead.email }),
      });
      res.json(lead);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/leads/:id", requireAuth, async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id as string);
      if (!lead || lead.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Lead not found" });
      }
      const leadNotes = await storage.getNotes("lead", lead.id);
      const activity = await storage.getActivityLog({ entityType: "lead", entityId: lead.id, limit: 50 });
      res.json({ lead, notes: leadNotes, activity });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/leads/:id", requireAuth, async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id as string);
      if (!lead || lead.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Lead not found" });
      }
      const parsed = updateLeadSchema.parse(req.body);
      const updated = await storage.updateLead(req.params.id as string, parsed);
      if (parsed.stage && parsed.stage !== lead.stage) {
        await storage.logActivity({
          tenantId: req.user!.tenantId,
          userId: req.user!.id,
          entityType: "lead",
          entityId: updated.id,
          action: "stage_changed",
          details: JSON.stringify({ from: lead.stage, to: parsed.stage }),
        });
      }
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/leads/:id", requireAuth, async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id as string);
      if (!lead || lead.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Lead not found" });
      }
      await storage.deleteLead(req.params.id as string);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/leads/:id/convert", requireAuth, async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id as string);
      if (!lead || lead.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Lead not found" });
      }
      if (!lead.email) {
        return res.status(400).json({ message: "Lead must have an email to convert to customer" });
      }
      const existingCustomer = await storage.getCustomerByEmail(req.user!.tenantId, lead.email);
      if (existingCustomer) {
        return res.status(400).json({ message: "A customer with this email already exists" });
      }
      const customer = await storage.createCustomer({
        tenantId: req.user!.tenantId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        paymentStatus: "CURRENT",
        isActive: true,
      });
      await storage.updateLead(lead.id, { stage: "Won" });
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "lead",
        entityId: lead.id,
        action: "converted_to_customer",
        details: JSON.stringify({ customerId: customer.id }),
      });
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "customer",
        entityId: customer.id,
        action: "created_from_lead",
        details: JSON.stringify({ leadId: lead.id }),
      });
      res.json({ customer, lead: { ...lead, stage: "Won" } });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/notes/:entityType/:entityId", requireAuth, async (req, res) => {
    try {
      const notesList = await storage.getNotes(req.params.entityType, req.params.entityId, req.user!.tenantId);
      res.json(notesList);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/notes", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        entityType: z.string().min(1),
        entityId: z.string().min(1),
        content: z.string().min(1, "Note content is required"),
      });
      const parsed = schema.parse(req.body);
      const note = await storage.createNote({
        tenantId: req.user!.tenantId,
        entityType: parsed.entityType,
        entityId: parsed.entityId,
        userId: req.user!.id,
        content: parsed.content,
      });
      res.json(note);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/notes/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteNote(req.params.id as string, req.user!.tenantId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  const createProductSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().optional().nullable(),
    price: z.number().int().min(0).default(0),
    billingCycle: z.enum(["ONE_TIME", "MONTHLY", "QUARTERLY", "YEARLY"]).default("ONE_TIME"),
    category: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  });

  const updateProductSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    price: z.number().int().min(0).optional(),
    billingCycle: z.enum(["ONE_TIME", "MONTHLY", "QUARTERLY", "YEARLY"]).optional(),
    category: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  });

  app.get("/api/admin/products", requireAuth, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const result = search
        ? await storage.searchProducts(req.user!.tenantId, search)
        : await storage.getProductsByTenant(req.user!.tenantId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/products", requireAuth, async (req, res) => {
    try {
      const parsed = createProductSchema.parse(req.body);
      const product = await storage.createProduct({
        ...parsed,
        tenantId: req.user!.tenantId,
      });
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "product",
        entityId: product.id,
        action: "created",
        details: JSON.stringify({ name: product.name }),
      });
      res.json(product);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/products/:id", requireAuth, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id as string);
      if (!product || product.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/products/:id", requireAuth, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id as string);
      if (!product || product.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Product not found" });
      }
      const parsed = updateProductSchema.parse(req.body);
      const updated = await storage.updateProduct(req.params.id as string, parsed);
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "product",
        entityId: updated.id,
        action: "updated",
        details: JSON.stringify(parsed),
      });
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/products/:id", requireAuth, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id as string);
      if (!product || product.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Product not found" });
      }
      await storage.deleteProduct(req.params.id as string);
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "product",
        entityId: req.params.id as string,
        action: "deleted",
        details: JSON.stringify({ name: product.name }),
      });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  const createTicketSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    description: z.string().optional().nullable(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    status: z.enum(["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]).default("OPEN"),
    assignedUserId: z.string().optional().nullable(),
    customerId: z.string().optional().nullable(),
  });

  const updateTicketSchema = z.object({
    subject: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    status: z.enum(["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"]).optional(),
    assignedUserId: z.string().nullable().optional(),
    customerId: z.string().nullable().optional(),
  });

  app.get("/api/admin/tickets", requireAuth, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const result = await storage.getTicketsByTenant(req.user!.tenantId, status);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/tickets", requireAuth, async (req, res) => {
    try {
      const parsed = createTicketSchema.parse(req.body);
      const ticket = await storage.createTicket({
        ...parsed,
        tenantId: req.user!.tenantId,
        createdByUserId: req.user!.id,
      });
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "ticket",
        entityId: ticket.id,
        action: "created",
        details: JSON.stringify({ subject: ticket.subject }),
      });
      res.json(ticket);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/tickets/:id", requireAuth, async (req, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id as string);
      if (!ticket || ticket.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/tickets/:id", requireAuth, async (req, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id as string);
      if (!ticket || ticket.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      const parsed = updateTicketSchema.parse(req.body);
      const updated = await storage.updateTicket(req.params.id as string, parsed);
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "ticket",
        entityId: updated.id,
        action: "updated",
        details: JSON.stringify(parsed),
      });
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/tickets/:id", requireAuth, async (req, res) => {
    try {
      const ticket = await storage.getTicket(req.params.id as string);
      if (!ticket || ticket.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      await storage.deleteTicket(req.params.id as string);
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "ticket",
        entityId: req.params.id as string,
        action: "deleted",
        details: JSON.stringify({ subject: ticket.subject }),
      });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  const createInvoiceSchema = z.object({
    customerId: z.string().optional().nullable(),
    status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).default("DRAFT"),
    subtotal: z.number().int().min(0).default(0),
    tax: z.number().int().min(0).default(0),
    total: z.number().int().min(0).default(0),
    dueDate: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    lineItemsJson: z.string().optional(),
  });

  const updateInvoiceSchema = z.object({
    customerId: z.string().nullable().optional(),
    status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).optional(),
    subtotal: z.number().int().min(0).optional(),
    tax: z.number().int().min(0).optional(),
    total: z.number().int().min(0).optional(),
    dueDate: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    lineItemsJson: z.string().optional(),
  });

  app.get("/api/admin/invoices", requireAuth, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const result = await storage.getInvoicesByTenant(req.user!.tenantId, status);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/invoices/next-number", requireAuth, async (req, res) => {
    try {
      const num = await storage.getNextInvoiceNumber(req.user!.tenantId);
      res.json({ invoiceNumber: num });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/invoices", requireAuth, async (req, res) => {
    try {
      const parsed = createInvoiceSchema.parse(req.body);
      const invoiceNumber = await storage.getNextInvoiceNumber(req.user!.tenantId);
      const invoice = await storage.createInvoice({
        ...parsed,
        invoiceNumber,
        tenantId: req.user!.tenantId,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      });
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "invoice",
        entityId: invoice.id,
        action: "created",
        details: JSON.stringify({ invoiceNumber: invoice.invoiceNumber }),
      });
      res.json(invoice);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/invoices/:id", requireAuth, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id as string);
      if (!invoice || invoice.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/invoices/:id", requireAuth, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id as string);
      if (!invoice || invoice.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      const parsed = updateInvoiceSchema.parse(req.body);
      const updateData: any = { ...parsed };
      if (parsed.dueDate) {
        updateData.dueDate = new Date(parsed.dueDate);
      }
      const updated = await storage.updateInvoice(req.params.id as string, updateData);
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "invoice",
        entityId: updated.id,
        action: "updated",
        details: JSON.stringify(parsed),
      });
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/invoices/:id", requireAuth, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id as string);
      if (!invoice || invoice.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      await storage.deleteInvoice(req.params.id as string);
      await storage.logActivity({
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
        entityType: "invoice",
        entityId: req.params.id as string,
        action: "deleted",
        details: JSON.stringify({ invoiceNumber: invoice.invoiceNumber }),
      });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  const createTimeEntrySchema = z.object({
    description: z.string().optional().nullable(),
    startAt: z.string(),
    endAt: z.string().optional().nullable(),
    durationMinutes: z.number().int().min(0).optional().nullable(),
    billable: z.boolean().default(true),
    hourlyRate: z.number().int().min(0).optional().nullable(),
    customerId: z.string().optional().nullable(),
  });

  const updateTimeEntrySchema = z.object({
    description: z.string().nullable().optional(),
    startAt: z.string().optional(),
    endAt: z.string().nullable().optional(),
    durationMinutes: z.number().int().min(0).nullable().optional(),
    billable: z.boolean().optional(),
    hourlyRate: z.number().int().min(0).nullable().optional(),
    customerId: z.string().nullable().optional(),
  });

  app.get("/api/admin/time-entries", requireAuth, async (req, res) => {
    try {
      const result = await storage.getTimeEntriesByTenant(req.user!.tenantId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/time-entries", requireAuth, async (req, res) => {
    try {
      const parsed = createTimeEntrySchema.parse(req.body);
      const startAt = new Date(parsed.startAt);
      const endAt = parsed.endAt ? new Date(parsed.endAt) : null;
      let durationMinutes = parsed.durationMinutes || null;
      if (!durationMinutes && endAt) {
        durationMinutes = Math.round((endAt.getTime() - startAt.getTime()) / 60000);
      }
      const entry = await storage.createTimeEntry({
        ...parsed,
        startAt,
        endAt,
        durationMinutes,
        tenantId: req.user!.tenantId,
        userId: req.user!.id,
      });
      res.json(entry);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/time-entries/:id", requireAuth, async (req, res) => {
    try {
      const entry = await storage.getTimeEntry(req.params.id as string);
      if (!entry || entry.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      const parsed = updateTimeEntrySchema.parse(req.body);
      const updateData: any = { ...parsed };
      if (parsed.startAt) updateData.startAt = new Date(parsed.startAt);
      if (parsed.endAt) updateData.endAt = new Date(parsed.endAt);
      const updated = await storage.updateTimeEntry(req.params.id as string, updateData);
      res.json(updated);
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/time-entries/:id", requireAuth, async (req, res) => {
    try {
      const entry = await storage.getTimeEntry(req.params.id as string);
      if (!entry || entry.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Time entry not found" });
      }
      await storage.deleteTimeEntry(req.params.id as string);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  return httpServer;
}
