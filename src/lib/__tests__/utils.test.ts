import { describe, expect, it } from "vitest";
import { cn } from "../utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("lets a later Tailwind class win over an earlier conflicting one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("keeps non-conflicting Tailwind classes", () => {
    expect(cn("p-2", "text-red-500")).toBe("p-2 text-red-500");
  });

  it("accepts arrays and conditional objects", () => {
    expect(cn(["a", "b"], { c: true, d: false })).toBe("a b c");
  });

  it("returns an empty string when given nothing", () => {
    expect(cn()).toBe("");
  });
});
