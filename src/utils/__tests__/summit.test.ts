import { describe, expect, it } from "vitest";
import { summitPath, summitRefToSlug } from "../summit";

describe("summitRefToSlug", () => {
  it("lowercases and replaces the separator", () => {
    expect(summitRefToSlug("JA/NS-001")).toBe("ja-ns-001");
  });

  it("handles associations containing digits", () => {
    expect(summitRefToSlug("W7W/KG-001")).toBe("w7w-kg-001");
  });

  it("replaces every separator, not just the first", () => {
    expect(summitRefToSlug("A/B/C-1")).toBe("a-b-c-1");
  });

  it("leaves an already-slugged reference unchanged", () => {
    expect(summitRefToSlug("ja-ns-001")).toBe("ja-ns-001");
  });
});

describe("summitPath", () => {
  it("builds a route from a reference", () => {
    expect(summitPath("JA/SO-001")).toBe("/summit/ja-so-001");
  });

  it("is consistent with the slug helper", () => {
    const ref = "VK3/VE-001";
    expect(summitPath(ref)).toBe(`/summit/${summitRefToSlug(ref)}`);
  });
});
