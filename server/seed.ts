import { storage } from "./storage";
import { db } from "./db";
import { tenants } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  const existing = await db.select().from(tenants).where(eq(tenants.slug, "default"));
  if (existing.length > 0) {
    console.log("Seed data already exists, skipping...");
    return;
  }

  console.log("Seeding database...");

  const tenant = await storage.createTenant({
    name: "Acme Consulting",
    slug: "default",
    brandColor: "#1d4ed8",
    timezone: "America/New_York",
    logoUrl: null,
  });

  const user = await storage.createUser({
    tenantId: tenant.id,
    name: "Alex Johnson",
    email: "alex@acmeconsulting.com",
    role: "OWNER",
    passwordHash: null,
  });

  const quickChat = await storage.createEventType({
    tenantId: tenant.id,
    ownerUserId: user.id,
    slug: "quick-chat",
    title: "Quick Chat",
    description: "A brief 15-minute introductory call to discuss your needs.",
    durationMinutes: 15,
    locationType: "VIDEO",
    locationValue: "Google Meet",
    color: "#059669",
    isActive: true,
    questionsJson: "[]",
  });

  const consultation = await storage.createEventType({
    tenantId: tenant.id,
    ownerUserId: user.id,
    slug: "consultation",
    title: "Strategy Consultation",
    description: "A 45-minute in-depth session to explore your project goals and create an action plan.",
    durationMinutes: 45,
    locationType: "VIDEO",
    locationValue: "Zoom",
    color: "#7c3aed",
    isActive: true,
    questionsJson: "[]",
  });

  await storage.createEventType({
    tenantId: tenant.id,
    ownerUserId: user.id,
    slug: "design-review",
    title: "Design Review",
    description: "30-minute session to review designs, wireframes, or prototypes.",
    durationMinutes: 30,
    locationType: "VIDEO",
    locationValue: "Google Meet",
    color: "#dc2626",
    isActive: true,
    questionsJson: "[]",
  });

  const weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;
  for (const day of weekdays) {
    await storage.createAvailabilityRule({
      tenantId: tenant.id,
      userId: user.id,
      dayOfWeek: day,
      startTime: "09:00",
      endTime: "12:00",
      timezone: "America/New_York",
    });
    await storage.createAvailabilityRule({
      tenantId: tenant.id,
      userId: user.id,
      dayOfWeek: day,
      startTime: "13:00",
      endTime: "17:00",
      timezone: "America/New_York",
    });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setMinutes(tomorrowEnd.getMinutes() + 15);

  await storage.createBooking({
    tenantId: tenant.id,
    eventTypeId: quickChat.id,
    hostUserId: user.id,
    inviteeName: "Sarah Mitchell",
    inviteeEmail: "sarah@example.com",
    startAt: tomorrow,
    endAt: tomorrowEnd,
    timezone: "America/New_York",
    status: "CONFIRMED",
    notes: "Looking forward to discussing the new project!",
    cancelReason: null,
  });

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 3);
  nextWeek.setHours(14, 0, 0, 0);

  const nextWeekEnd = new Date(nextWeek);
  nextWeekEnd.setMinutes(nextWeekEnd.getMinutes() + 45);

  await storage.createBooking({
    tenantId: tenant.id,
    eventTypeId: consultation.id,
    hostUserId: user.id,
    inviteeName: "David Chen",
    inviteeEmail: "david@techstartup.io",
    startAt: nextWeek,
    endAt: nextWeekEnd,
    timezone: "America/Los_Angeles",
    status: "CONFIRMED",
    notes: "Want to discuss our product roadmap and marketing strategy.",
    cancelReason: null,
  });

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 2);
  pastDate.setHours(11, 0, 0, 0);

  const pastEnd = new Date(pastDate);
  pastEnd.setMinutes(pastEnd.getMinutes() + 30);

  await storage.createBooking({
    tenantId: tenant.id,
    eventTypeId: quickChat.id,
    hostUserId: user.id,
    inviteeName: "Emily Rodriguez",
    inviteeEmail: "emily@creativestudio.co",
    startAt: pastDate,
    endAt: pastEnd,
    timezone: "America/Chicago",
    status: "CONFIRMED",
    notes: null,
    cancelReason: null,
  });

  await storage.createBooking({
    tenantId: tenant.id,
    eventTypeId: consultation.id,
    hostUserId: user.id,
    inviteeName: "Marcus Thompson",
    inviteeEmail: "marcus@fintech.com",
    startAt: pastDate,
    endAt: pastEnd,
    timezone: "Europe/London",
    status: "CANCELED",
    notes: "Had to reschedule due to conflict.",
    cancelReason: "Schedule conflict",
  });

  console.log("Seed data created successfully!");
}
