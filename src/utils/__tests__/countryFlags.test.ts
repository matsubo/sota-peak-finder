import { describe, expect, it } from "vitest";
import { getAssociationFlag, getCountryCode, getCountryName, getFlagEmoji } from "../countryFlags";

describe("getCountryName", () => {
  it("returns a bare association unchanged", () => {
    expect(getCountryName("Japan")).toBe("Japan");
  });

  it("takes the country half of a 'Country - Region' association", () => {
    expect(getCountryName("United States - Washington")).toBe("United States");
  });

  it("returns an empty string for an empty association", () => {
    expect(getCountryName("")).toBe("");
  });
});

describe("getCountryCode", () => {
  it("resolves a known bare country", () => {
    expect(getCountryCode("Japan")).toBe("JP");
  });

  it("resolves a country from a regional association", () => {
    expect(getCountryCode("Japan - Tokyo")).toBe("JP");
  });

  it("returns null for an unknown country", () => {
    expect(getCountryCode("Atlantis")).toBeNull();
  });

  it("returns null for an empty association", () => {
    expect(getCountryCode("")).toBeNull();
  });
});

describe("getFlagEmoji", () => {
  it("maps a country code to regional indicator symbols", () => {
    expect(getFlagEmoji("JP")).toBe("🇯🇵");
  });

  it("is case insensitive", () => {
    expect(getFlagEmoji("jp")).toBe(getFlagEmoji("JP"));
  });

  it("falls back to a mountain for null", () => {
    expect(getFlagEmoji(null)).toBe("🏔️");
  });

  it("falls back to a mountain for a malformed code", () => {
    expect(getFlagEmoji("JPN")).toBe("🏔️");
  });
});

describe("getAssociationFlag", () => {
  it("resolves an association straight through to its flag", () => {
    expect(getAssociationFlag("Japan - Tokyo")).toBe("🇯🇵");
  });

  it("falls back for an unrecognised association", () => {
    expect(getAssociationFlag("Atlantis")).toBe("🏔️");
  });
});
