import { describe, it, expect } from "vitest";
import { generateTimeSlots, isTimeWithinRules } from "../server/routes/helpers";
import type { AvailabilityRule } from "@shared/schema";

function makeRule(overrides: Partial<AvailabilityRule> = {}): AvailabilityRule {
  return {
    id: "rule-1",
    tenantId: "t1",
    userId: "u1",
    dayOfWeek: "MONDAY",
    startTime: "09:00",
    endTime: "17:00",
    timezone: "America/New_York",
    ...overrides,
  };
}

describe("generateTimeSlots", () => {
  it("produces correct 30-minute intervals within availability window", () => {
    const rules = [makeRule({ startTime: "09:00", endTime: "11:00" })];
    const farFuture = "2030-01-07";
    const slots = generateTimeSlots(rules, farFuture, 30, []);
    expect(slots).toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });

  it("respects event duration — 60-minute meetings produce fewer slots", () => {
    const rules = [makeRule({ startTime: "09:00", endTime: "11:00" })];
    const farFuture = "2030-01-07";
    const slots = generateTimeSlots(rules, farFuture, 60, []);
    expect(slots).toEqual(["09:00", "09:30", "10:00"]);
  });

  it("returns empty array for days with no availability rules", () => {
    const rules = [makeRule({ dayOfWeek: "TUESDAY" })];
    const monday = "2030-01-07";
    const slots = generateTimeSlots(rules, monday, 30, []);
    expect(slots).toEqual([]);
  });

  it("excludes slots that conflict with existing bookings", () => {
    const rules = [makeRule({ startTime: "09:00", endTime: "11:00" })];
    const farFuture = "2030-01-07";
    const existingBookings = [
      {
        startAt: new Date("2030-01-07T09:30:00"),
        endAt: new Date("2030-01-07T10:00:00"),
      },
    ];
    const slots = generateTimeSlots(rules, farFuture, 30, existingBookings);
    expect(slots).not.toContain("09:30");
    expect(slots).toContain("09:00");
    expect(slots).toContain("10:00");
  });

  it("excludes slots that conflict with ICS busy ranges", () => {
    const rules = [makeRule({ startTime: "09:00", endTime: "11:00" })];
    const farFuture = "2030-01-07";
    const icsBusy = [
      {
        start: new Date("2030-01-07T10:00:00"),
        end: new Date("2030-01-07T10:30:00"),
      },
    ];
    const slots = generateTimeSlots(rules, farFuture, 30, [], icsBusy);
    expect(slots).not.toContain("10:00");
    expect(slots).toContain("09:00");
    expect(slots).toContain("10:30");
  });

  it("merges multiple availability rules on the same day", () => {
    const rules = [
      makeRule({ startTime: "09:00", endTime: "10:00" }),
      makeRule({ id: "rule-2", startTime: "14:00", endTime: "15:00" }),
    ];
    const farFuture = "2030-01-07";
    const slots = generateTimeSlots(rules, farFuture, 30, []);
    expect(slots).toContain("09:00");
    expect(slots).toContain("09:30");
    expect(slots).toContain("14:00");
    expect(slots).toContain("14:30");
    expect(slots).not.toContain("12:00");
  });

  it("handles short windows where no slot fits the duration", () => {
    const rules = [makeRule({ startTime: "09:00", endTime: "09:20" })];
    const farFuture = "2030-01-07";
    const slots = generateTimeSlots(rules, farFuture, 30, []);
    expect(slots).toEqual([]);
  });

  it("returns sorted slots even when rules are unordered", () => {
    const rules = [
      makeRule({ startTime: "14:00", endTime: "15:00" }),
      makeRule({ id: "rule-2", startTime: "09:00", endTime: "10:00" }),
    ];
    const farFuture = "2030-01-07";
    const slots = generateTimeSlots(rules, farFuture, 30, []);
    const sorted = [...slots].sort();
    expect(slots).toEqual(sorted);
  });
});

describe("isTimeWithinRules", () => {
  it("returns true when requested time fits within an availability rule", () => {
    const rules = [makeRule({ startTime: "09:00", endTime: "17:00" })];
    const result = isTimeWithinRules(rules, "2030-01-07", "10:00", 30);
    expect(result).toBe(true);
  });

  it("returns false when requested time is outside availability", () => {
    const rules = [makeRule({ startTime: "09:00", endTime: "12:00" })];
    const result = isTimeWithinRules(rules, "2030-01-07", "13:00", 30);
    expect(result).toBe(false);
  });

  it("returns false when meeting would extend past availability end", () => {
    const rules = [makeRule({ startTime: "09:00", endTime: "10:00" })];
    const result = isTimeWithinRules(rules, "2030-01-07", "09:45", 30);
    expect(result).toBe(false);
  });

  it("returns true at the exact boundary start", () => {
    const rules = [makeRule({ startTime: "09:00", endTime: "10:00" })];
    const result = isTimeWithinRules(rules, "2030-01-07", "09:00", 60);
    expect(result).toBe(true);
  });

  it("returns false when no rules exist for the requested day", () => {
    const rules = [makeRule({ dayOfWeek: "TUESDAY" })];
    const result = isTimeWithinRules(rules, "2030-01-07", "10:00", 30);
    expect(result).toBe(false);
  });

  it("returns true when time fits in any of multiple rules", () => {
    const rules = [
      makeRule({ startTime: "09:00", endTime: "12:00" }),
      makeRule({ id: "rule-2", startTime: "14:00", endTime: "17:00" }),
    ];
    const result = isTimeWithinRules(rules, "2030-01-07", "15:00", 30);
    expect(result).toBe(true);
  });
});
