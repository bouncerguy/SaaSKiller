import ical, { VEvent } from "node-ical";

interface BusyRange {
  start: Date;
  end: Date;
  summary?: string;
}

interface CacheEntry {
  data: BusyRange[];
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function clearExpiredCache() {
  const now = Date.now();
  const keys = Array.from(cache.keys());
  for (const key of keys) {
    const entry = cache.get(key);
    if (entry && now - entry.fetchedAt > CACHE_TTL_MS) {
      cache.delete(key);
    }
  }
}

function parseEvents(events: ical.CalendarResponse): BusyRange[] {
  const busyRanges: BusyRange[] = [];

  for (const key of Object.keys(events)) {
    const component = events[key];
    if (!component || component.type !== "VEVENT") continue;
    const event = component as VEvent;
    if (!event.start || !event.end) continue;

    const summary = typeof event.summary === "string" ? event.summary : undefined;
    busyRanges.push({
      start: new Date(event.start),
      end: new Date(event.end),
      summary,
    });
  }

  return busyRanges;
}

function validateIcsUrl(url: string): void {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http/https calendar URLs are supported");
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number = 10000): Promise<ical.CalendarResponse> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Calendar fetch timed out")), timeoutMs);
    ical.async.fromURL(url)
      .then((result) => { clearTimeout(timer); resolve(result); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

export async function fetchIcsEvents(icsUrl: string): Promise<BusyRange[]> {
  validateIcsUrl(icsUrl);
  clearExpiredCache();

  const cached = cache.get(icsUrl);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const events = await fetchWithTimeout(icsUrl);
  const busyRanges = parseEvents(events);

  cache.set(icsUrl, { data: busyRanges, fetchedAt: Date.now() });
  return busyRanges;
}

export function getBusyRangesForDate(
  allEvents: BusyRange[],
  dateStr: string,
): { start: Date; end: Date }[] {
  const dayStart = new Date(dateStr + "T00:00:00");
  const dayEnd = new Date(dateStr + "T23:59:59.999");

  return allEvents.filter((event) => {
    return event.start < dayEnd && event.end > dayStart;
  });
}

export async function testIcsUrl(
  icsUrl: string,
): Promise<{ valid: boolean; eventCount: number; error?: string }> {
  try {
    validateIcsUrl(icsUrl);
    const events = await fetchWithTimeout(icsUrl);
    let eventCount = 0;
    for (const key of Object.keys(events)) {
      if (events[key]!.type === "VEVENT") eventCount++;
    }
    return { valid: true, eventCount };
  } catch (err: any) {
    return { valid: false, eventCount: 0, error: err.message || "Failed to fetch calendar" };
  }
}
