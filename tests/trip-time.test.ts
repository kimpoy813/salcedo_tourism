import { describe, expect, it } from "vitest";
import {
  analyzeSchedule,
  buildSuggestedSchedule,
  endTimeFor,
  formatTime12h,
  suggestedNextTime,
  timeToMinutes,
} from "../src/lib/trip-time";

describe("trip-time helpers", () => {
  it("parses and formats times", () => {
    expect(timeToMinutes("08:30")).toBe(510);
    expect(timeToMinutes("bad")).toBeNull();
    expect(formatTime12h("13:05")).toBe("1:05 PM");
    expect(formatTime12h(null)).toBe("Flexible");
    expect(endTimeFor("09:00", 90)).toBe("10:30");
  });

  it("flags overlapping stops and suggests a fix", () => {
    const issues = analyzeSchedule([
      { visitTime: "09:00", durationMinutes: 120, latitude: 17.15, longitude: 120.53 },
      { visitTime: "09:30", durationMinutes: 60, latitude: 17.15, longitude: 120.53 },
    ]);
    expect(issues.some((i) => i.index === 1 && i.kind === "overlap")).toBe(true);
    expect(issues.find((i) => i.index === 1)?.suggestedTime).toBeTruthy();
  });

  it("flags unscheduled stops when others are timed", () => {
    const issues = analyzeSchedule([
      { visitTime: "09:00", durationMinutes: 60 },
      { visitTime: "", durationMinutes: 60 },
    ]);
    expect(issues.some((i) => i.kind === "unscheduled")).toBe(true);
  });

  it("builds a sequential schedule with travel gaps", () => {
    const stops = buildSuggestedSchedule(
      [
        { visitTime: "", durationMinutes: 60, latitude: 17.15107, longitude: 120.53634 },
        { visitTime: "", durationMinutes: 60, latitude: 17.0958, longitude: 120.5262 },
      ],
      "08:30"
    );
    expect(stops[0].visitTime).toBe("08:30");
    expect(timeToMinutes(stops[1].visitTime)!).toBeGreaterThan(timeToMinutes("09:30")!);
    expect(suggestedNextTime(stops, 1)).toBe(stops[1].visitTime);
  });
});
