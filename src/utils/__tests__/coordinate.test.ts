import { describe, expect, it } from "vitest";
import {
  bearingToCardinal,
  calculateBearing,
  calculateGridLocator,
  convertToDMS,
  haversineDistance,
} from "../coordinate";

describe("convertToDMS", () => {
  it("converts positive latitude", () => {
    expect(convertToDMS(35.3606, true)).toBe(`35°21'38.16" N`);
  });

  it("converts negative latitude", () => {
    expect(convertToDMS(-33.8688, true)).toBe(`33°52'7.68" S`);
  });

  it("converts positive longitude", () => {
    expect(convertToDMS(138.7274, false)).toBe(`138°43'38.64" E`);
  });

  it("converts negative longitude", () => {
    expect(convertToDMS(-118.2437, false)).toBe(`118°14'37.32" W`);
  });

  it("handles zero", () => {
    expect(convertToDMS(0, true)).toBe(`0°0'0.00" N`);
  });
});

describe("calculateGridLocator", () => {
  it("calculates grid locator for Tokyo", () => {
    expect(calculateGridLocator(35.6762, 139.6503)).toBe("PM95tq");
  });

  it("calculates grid locator for London", () => {
    expect(calculateGridLocator(51.5074, -0.1278)).toBe("IO91wm");
  });

  it("calculates grid locator for New York", () => {
    expect(calculateGridLocator(40.7128, -74.006)).toBe("FN20xr");
  });
});

describe("haversineDistance", () => {
  it("calculates distance between Tokyo and Mt. Fuji", () => {
    const distance = haversineDistance(35.6762, 139.6503, 35.3606, 138.7274);
    expect(distance).toBeGreaterThan(90000);
    expect(distance).toBeLessThan(110000);
  });

  it("returns 0 for same point", () => {
    expect(haversineDistance(35.6762, 139.6503, 35.6762, 139.6503)).toBe(0);
  });

  it("calculates approximately correct for known distances", () => {
    // Tokyo to Osaka is about 400km
    const distance = haversineDistance(35.6762, 139.6503, 34.6937, 135.5023);
    expect(distance).toBeGreaterThan(380000);
    expect(distance).toBeLessThan(420000);
  });
});

describe("calculateBearing", () => {
  it("returns ~0 for due north", () => {
    const bearing = calculateBearing(35, 139, 36, 139);
    expect(bearing).toBeCloseTo(0, 0);
  });

  it("returns ~90 for due east", () => {
    const bearing = calculateBearing(35, 139, 35, 140);
    expect(bearing).toBeCloseTo(90, 0);
  });

  it("returns ~180 for due south", () => {
    const bearing = calculateBearing(36, 139, 35, 139);
    expect(bearing).toBeCloseTo(180, 0);
  });

  it("returns ~270 for due west", () => {
    const bearing = calculateBearing(35, 140, 35, 139);
    expect(bearing).toBeCloseTo(270, 0);
  });
});

describe("bearingToCardinal", () => {
  it("converts cardinal directions correctly", () => {
    expect(bearingToCardinal(0)).toBe("N");
    expect(bearingToCardinal(45)).toBe("NE");
    expect(bearingToCardinal(90)).toBe("E");
    expect(bearingToCardinal(135)).toBe("SE");
    expect(bearingToCardinal(180)).toBe("S");
    expect(bearingToCardinal(225)).toBe("SW");
    expect(bearingToCardinal(270)).toBe("W");
    expect(bearingToCardinal(315)).toBe("NW");
  });

  it("rounds to nearest cardinal", () => {
    expect(bearingToCardinal(22)).toBe("N");
    expect(bearingToCardinal(23)).toBe("NE");
    expect(bearingToCardinal(350)).toBe("N");
  });
});
