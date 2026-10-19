import { describe, expect, it } from "vitest";
import { getOverviewStart } from "./db";

describe("getOverviewStart", () => {
  const now = new Date(2026, 7, 21, 18, 42, 15, 800);

  it("uses the start of today for the daily overview", () => {
    const start = getOverviewStart("today", now);
    expect(start?.getFullYear()).toBe(2026);
    expect(start?.getMonth()).toBe(7);
    expect(start?.getDate()).toBe(21);
    expect(start?.getHours()).toBe(0);
  });

  it("uses a seven-day window and the first day of the month", () => {
    expect(getOverviewStart("week", now)?.getDate()).toBe(15);
    expect(getOverviewStart("month", now)?.getDate()).toBe(1);
    expect(getOverviewStart("all", now)).toBeUndefined();
  });
});
