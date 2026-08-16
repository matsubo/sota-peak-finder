import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "../logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logger", () => {
  it("forwards debug output to the console in development", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.debug("initialising", 42);
    expect(spy).toHaveBeenCalledWith("initialising", 42);
  });

  it("forwards warnings to the console in development", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.warn("slow response");
    expect(spy).toHaveBeenCalledWith("slow response");
  });

  it("accepts any number of arguments", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.debug();
    logger.debug("a", "b", "c", { d: 1 });
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
