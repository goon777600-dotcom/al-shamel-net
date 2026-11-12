import { describe, expect, it } from "vitest";
import { normalizeArabicName, getYemenStartOfDay } from "./db";

describe("normalizeArabicName", () => {
  it("normalizes identical names with different spacing or diacritics", () => {
    const original = "خالد خضر حسين الحميري";
    const withExtraSpaces = "  خالد   خضر  حسين   الحميري  ";
    const withTashkeel = "خَالِد خَضِر حُسَيْن الحُمَيْرِي";
    const withTatweel = "خـالد خـضر حسـين الحمـيري";

    expect(normalizeArabicName(original)).toBe(normalizeArabicName(withExtraSpaces));
    expect(normalizeArabicName(original)).toBe(normalizeArabicName(withTashkeel));
    expect(normalizeArabicName(original)).toBe(normalizeArabicName(withTatweel));
  });

  it("normalizes Alef and Yaa variations", () => {
    // Alif Maqsura vs Yaa
    expect(normalizeArabicName("الحميرى")).toBe(normalizeArabicName("الحميري"));
    // Alef with Hamza vs plain Alef
    expect(normalizeArabicName("أحمد إبراهيم")).toBe(normalizeArabicName("احمد ابراهيم"));
    // Taa Marbuta vs Haa
    expect(normalizeArabicName("شبكة")).toBe(normalizeArabicName("شبكه"));
  });

  it("distinguishes genuinely different names", () => {
    expect(normalizeArabicName("خالد خضر حسين الحميري")).not.toBe(
      normalizeArabicName("محمد خضر حسين الحميري")
    );
  });
});

describe("getYemenStartOfDay", () => {
  it("correctly identifies midnight in Yemen time (UTC+3)", () => {
    // Yemen is UTC+3.
    // At 2026-11-12 17:00:00 UTC (20:00 Yemen time), start of day in Yemen is 2026-11-11 21:00:00 UTC.
    const dateAt8PmYemen = new Date(Date.UTC(2026, 10, 12, 17, 0, 0));
    const startOfDay = getYemenStartOfDay(dateAt8PmYemen);

    expect(startOfDay.toISOString()).toBe("2026-11-11T21:00:00.000Z");

    // At 2026-11-12 01:00:00 UTC (04:00 Yemen time on Nov 12), start of day is still 2026-11-11 21:00:00 UTC.
    const dateAt4AmYemen = new Date(Date.UTC(2026, 10, 12, 1, 0, 0));
    expect(getYemenStartOfDay(dateAt4AmYemen).toISOString()).toBe("2026-11-11T21:00:00.000Z");

    // At 2026-11-12 21:30:00 UTC (00:30 Yemen time on Nov 13), start of day moves to 2026-11-12 21:00:00 UTC.
    const dateAfterMidnightYemen = new Date(Date.UTC(2026, 10, 12, 21, 30, 0));
    expect(getYemenStartOfDay(dateAfterMidnightYemen).toISOString()).toBe("2026-11-12T21:00:00.000Z");
  });
});
