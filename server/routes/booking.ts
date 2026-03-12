import type { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { requireAuth, hashPassword } from "../auth";
import { fetchIcsEvents, getBusyRangesForDate, testIcsUrl } from "../ics-calendar";
import { generateTimeSlots, isTimeWithinRules, getDefaultTenant } from "./helpers";

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

  export function registerBookingRoutes(app: Express) {
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
      const tenantId = req.user!.tenantId;
      const bookingsList = await storage.getBookingsByTenant(tenantId);
      const videoProvider = await storage.getSetting(`video_provider:${tenantId}`);
      const jitsiServerUrl = await storage.getSetting(`jitsi_server_url:${tenantId}`);
      const tenant = await storage.getTenant(tenantId);
      const eventTypesList = await storage.getEventTypesByTenant(tenantId);
      const eventTypesMap = new Map(eventTypesList.map(et => [et.id, et]));

      const enriched = bookingsList.map(booking => {
        const et = eventTypesMap.get(booking.eventTypeId);
        let meetingUrl: string | null = null;
        if (videoProvider === "jitsi" && et?.locationType === "VIDEO" && et.locationValue === "Jitsi Meet" && jitsiServerUrl) {
          const baseUrl = jitsiServerUrl.replace(/\/+$/, "");
          const roomName = `${tenant?.slug || "meet"}-${et.slug}-${booking.id.substring(0, 8)}`;
          meetingUrl = `${baseUrl}/${roomName}`;
        } else if (videoProvider === "zoom" && et?.locationType === "VIDEO" && et.locationValue?.startsWith("http")) {
          meetingUrl = et.locationValue;
        }
        return { ...booking, meetingUrl };
      });

      res.json(enriched);
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

      let meetingUrl: string | null = null;
      const videoProvider = await storage.getSetting(`video_provider:${tenant.id}`);
      if (videoProvider === "jitsi" && eventType.locationType === "VIDEO" && eventType.locationValue === "Jitsi Meet") {
        const jitsiServerUrl = await storage.getSetting(`jitsi_server_url:${tenant.id}`);
        if (jitsiServerUrl) {
          const baseUrl = jitsiServerUrl.replace(/\/+$/, "");
          const roomName = `${tenant.slug}-${eventType.slug}-${booking.id.substring(0, 8)}`;
          meetingUrl = `${baseUrl}/${roomName}`;
        }
      } else if (videoProvider === "zoom" && eventType.locationType === "VIDEO" && eventType.locationValue?.startsWith("http")) {
        meetingUrl = eventType.locationValue;
      }

      res.json({ ...booking, meetingUrl });
    } catch (e: any) {
      if (e.name === "ZodError") {
        return res.status(400).json({ message: e.errors[0]?.message || "Validation failed" });
      }
      res.status(500).json({ message: e.message });
    }
  });
  }
  