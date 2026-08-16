import { describe, expect, it } from "vitest";
import { formatDateShort } from "../date";

describe("formatDateShort", () => {
  it("formats an ISO date in English", () => {
    expect(formatDateShort("2026-01-15T00:00:00Z", "en-US")).toMatch(/Jan/);
  });

  it("formats the same instant differently per locale", () => {
    const iso = "2026-03-09T12:00:00Z";
    expect(formatDateShort(iso, "ja-JP")).not.toBe(formatDateShort(iso, "en-US"));
  });

  it("includes the year", () => {
    expect(formatDateShort("2026-07-04T00:00:00Z", "en-US")).toMatch(/2026/);
  });

  it("accepts a date-only string", () => {
    expect(formatDateShort("2026-12-25", "en-US")).toMatch(/Dec/);
  });
});
