import { describe, expect, it } from "vitest";
import { wmoCodeToCondition } from "../weather";

describe("wmoCodeToCondition", () => {
  it.each([
    [0, "clear"],
    [1, "partlyCloudy"],
    [2, "partlyCloudy"],
    [3, "cloudy"],
    [45, "fog"],
    [48, "fog"],
    [51, "drizzle"],
    [57, "drizzle"],
    [61, "rain"],
    [67, "rain"],
    [71, "snow"],
    [77, "snow"],
    [80, "showers"],
    [82, "showers"],
    [95, "thunderstorm"],
    [99, "thunderstorm"],
  ])("maps WMO code %i to %s", (code, expected) => {
    expect(wmoCodeToCondition(code)).toBe(expected);
  });

  it.each([44, 49, 58, 60, 68, 70, 78, 79, 83, 94, 100])(
    "falls back to cloudy for unmapped code %i",
    (code) => {
      expect(wmoCodeToCondition(code)).toBe("cloudy");
    },
  );
});
