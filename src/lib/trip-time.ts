// Shared, pure trip-scheduling helpers (used by the planner UI and tests).

export function timeToMinutes(time?: string | null): number | null {
  if (!time) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function minutesToTime(total: number): string {
  const clamped = ((Math.round(total) % 1440) + 1440) % 1440;
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatTime12h(time?: string | null): string {
  const mins = timeToMinutes(time);
  if (mins == null) return "Flexible";
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function endTimeFor(start?: string | null, durationMinutes = 60): string | null {
  const s = timeToMinutes(start);
  if (s == null) return null;
  return minutesToTime(s + (durationMinutes || 60));
}

/** Rough road-travel minutes between two stops (straight-line × 1.4 detour, ~28 km/h rural roads). */
export function estimateTravelMinutes(
  a?: { latitude?: number | null; longitude?: number | null },
  b?: { latitude?: number | null; longitude?: number | null }
): number {
  if (!a?.latitude || !a?.longitude || !b?.latitude || !b?.longitude) return 15;
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const km = 2 * R * Math.asin(Math.sqrt(h)) * 1.4;
  return Math.max(5, Math.round((km / 28) * 60));
}

export interface SchedulableStop {
  visitTime?: string | null;
  durationMinutes?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface StopTimingIssue {
  index: number;
  kind: "overlap" | "tight" | "unscheduled";
  message: string;
  /** Suggested arrival time (HH:mm) that resolves the issue, when computable. */
  suggestedTime: string | null;
}

export function analyzeSchedule(stops: SchedulableStop[]): StopTimingIssue[] {
  const issues: StopTimingIssue[] = [];
  for (let i = 0; i < stops.length; i++) {
    const cur = stops[i];
    const start = timeToMinutes(cur.visitTime);
    if (start == null) {
      if (stops.length > 1) {
        issues.push({
          index: i,
          kind: "unscheduled",
          message: "No arrival time set yet.",
          suggestedTime: i === 0 ? "08:30" : suggestedNextTime(stops, i),
        });
      }
      continue;
    }
    if (i === 0) continue;
    const prev = stops[i - 1];
    const prevStart = timeToMinutes(prev.visitTime);
    if (prevStart == null) continue;
    const travel = estimateTravelMinutes(prev, cur);
    const earliest = prevStart + (prev.durationMinutes || 60) + travel;
    if (start < earliest - travel) {
      issues.push({
        index: i,
        kind: "overlap",
        message: `Overlaps the previous stop (ends ${formatTime12h(minutesToTime(prevStart + (prev.durationMinutes || 60)))}).`,
        suggestedTime: minutesToTime(earliest),
      });
    } else if (start < earliest) {
      issues.push({
        index: i,
        kind: "tight",
        message: `Only ${Math.max(0, start - (prevStart + (prev.durationMinutes || 60)))} min to travel (~${travel} min needed).`,
        suggestedTime: minutesToTime(earliest),
      });
    }
  }
  return issues;
}

export function suggestedNextTime(stops: SchedulableStop[], index: number): string | null {
  if (index <= 0) return "08:30";
  const prev = stops[index - 1];
  const prevStart = timeToMinutes(prev.visitTime);
  if (prevStart == null) return null;
  return minutesToTime(prevStart + (prev.durationMinutes || 60) + estimateTravelMinutes(prev, stops[index]));
}

/** Sequentially (re)schedule every stop from `firstTime`, respecting durations + travel gaps. */
export function buildSuggestedSchedule<T extends SchedulableStop>(
  stops: T[],
  firstTime = "08:30"
): Array<T & { visitTime: string }> {
  let cursor = timeToMinutes(firstTime) ?? 510;
  return stops.map((stop, i) => {
    if (i > 0) {
      const prev = stops[i - 1];
      cursor += (prev.durationMinutes || 60) + estimateTravelMinutes(prev, stop);
    }
    return { ...stop, visitTime: minutesToTime(cursor) };
  });
}
