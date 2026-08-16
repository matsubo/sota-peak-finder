import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookmarkProvider, useBookmarks } from "../BookmarkContext";

const STORAGE_KEY = "sota-bookmarks";
const wrapper = ({ children }: { children: ReactNode }) => (
  <BookmarkProvider>{children}</BookmarkProvider>
);

function lastEvent() {
  return window.dataLayer[window.dataLayer.length - 1];
}

function stored() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
}

beforeEach(() => {
  window.dataLayer = [];
});

describe("useBookmarks", () => {
  it("throws when used outside its provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useBookmarks())).toThrow(/BookmarkProvider/);
  });

  it("starts empty", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper });
    expect(result.current.bookmarkCount).toBe(0);
    expect(result.current.getStatus("JA/SO-001")).toBeNull();
  });

  it("cycles none -> want to go -> activated -> none", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper });

    act(() => result.current.cycleBookmark("JA/SO-001"));
    expect(result.current.getStatus("JA/SO-001")).toBe("want_to_go");

    act(() => result.current.cycleBookmark("JA/SO-001"));
    expect(result.current.getStatus("JA/SO-001")).toBe("activated");

    act(() => result.current.cycleBookmark("JA/SO-001"));
    expect(result.current.getStatus("JA/SO-001")).toBeNull();
    expect(result.current.bookmarkCount).toBe(0);
  });

  it("preserves the original save time across a status change", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper });

    act(() => result.current.cycleBookmark("JA/SO-001"));
    const savedAt = stored()["JA/SO-001"].savedAt;

    act(() => result.current.cycleBookmark("JA/SO-001"));
    expect(stored()["JA/SO-001"].savedAt).toBe(savedAt);
  });

  it("persists to local storage and reloads from it", () => {
    const first = renderHook(() => useBookmarks(), { wrapper });
    act(() => first.result.current.cycleBookmark("JA/SO-001"));
    expect(stored()["JA/SO-001"].status).toBe("want_to_go");

    const second = renderHook(() => useBookmarks(), { wrapper });
    expect(second.result.current.getStatus("JA/SO-001")).toBe("want_to_go");
  });

  it("tracks several summits independently", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper });

    act(() => result.current.cycleBookmark("JA/SO-001"));
    act(() => result.current.cycleBookmark("W7W/KG-001"));
    act(() => result.current.cycleBookmark("W7W/KG-001"));

    expect(result.current.getStatus("JA/SO-001")).toBe("want_to_go");
    expect(result.current.getStatus("W7W/KG-001")).toBe("activated");
    expect(result.current.bookmarkCount).toBe(2);
  });

  it("removes a bookmark outright", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper });

    act(() => result.current.cycleBookmark("JA/SO-001"));
    act(() => result.current.removeBookmark("JA/SO-001"));

    expect(result.current.getStatus("JA/SO-001")).toBeNull();
    expect(stored()).toEqual({});
  });

  it("ignores removal of something that was never bookmarked", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper });
    act(() => result.current.removeBookmark("XX/YY-999"));
    expect(result.current.bookmarkCount).toBe(0);
  });

  it("reports cycles and removals to analytics", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper });

    act(() => result.current.cycleBookmark("JA/SO-001"));
    expect(lastEvent()).toMatchObject({
      event: "bookmark_cycle",
      from_status: "none",
      to_status: "want_to_go",
    });

    act(() => result.current.removeBookmark("JA/SO-001"));
    expect(lastEvent()).toMatchObject({
      event: "bookmark_remove",
      previous_status: "want_to_go",
    });
  });

  describe("stored data validation", () => {
    it.each([
      ["malformed JSON", "not json at all"],
      ["a non-object", '"a string"'],
      ["an unknown status", '{"JA/SO-001":{"status":"maybe","savedAt":"2026-01-01"}}'],
      ["a missing timestamp", '{"JA/SO-001":{"status":"activated"}}'],
      ["a non-object entry", '{"JA/SO-001":42}'],
    ])("discards %s rather than surfacing it", (_label, raw) => {
      localStorage.setItem(STORAGE_KEY, raw);
      const { result } = renderHook(() => useBookmarks(), { wrapper });
      expect(result.current.bookmarkCount).toBe(0);
    });

    it("accepts a well-formed store", () => {
      localStorage.setItem(
        STORAGE_KEY,
        '{"JA/SO-001":{"status":"activated","savedAt":"2026-01-01T00:00:00Z"}}',
      );
      const { result } = renderHook(() => useBookmarks(), { wrapper });
      expect(result.current.getStatus("JA/SO-001")).toBe("activated");
    });
  });

  it("keeps working when local storage rejects writes", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const { result } = renderHook(() => useBookmarks(), { wrapper });
    act(() => result.current.cycleBookmark("JA/SO-001"));

    expect(result.current.getStatus("JA/SO-001")).toBe("want_to_go");
    setItem.mockRestore();
  });
});
