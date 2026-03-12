import type { AvailabilityRule } from "@shared/schema";
  import { storage } from "../storage";

  const DAY_MAP: Record<string, number> = {
    SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
    THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
  };

  const DEFAULT_TENANT_SLUG = "default";

  export async function getDefaultTenant() {
    const tenant = await storage.getTenantBySlug(DEFAULT_TENANT_SLUG);
    if (!tenant) throw new Error("Default tenant not found");
    return tenant;
  }

  export function generateTimeSlots(
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

  export function isTimeWithinRules(
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
  