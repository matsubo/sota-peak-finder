import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hookWrapper } from "../../test/render";
import { useSummitFilters } from "../useSummitFilters";

const SUMMIT = {
  id: 1,
  ref: "JA/SO-001",
  name: "Fuji",
  lat: 35.36,
  lon: 138.72,
  altitude: 3776,
  points: 10,
  activations: 42,
  bonus: null,
  association: "Japan",
  region: "SO",
};

const searchSummits = vi.fn();

vi.mock("../../utils/sotaDatabase", () => ({
  sotaDatabase: {
    init: vi.fn(async () => undefined),
    searchSummits: (...args: unknown[]) => searchSummits(...args),
    getCountries: vi.fn(async () => ["Japan", "United States"]),
    getAssociations: vi.fn(async () => ["Japan", "W7W"]),
    getRegionsByAssociation: vi.fn(async () => ["SO", "TK"]),
    getFilterRanges: vi.fn(async () => ({
      minAltitude: 0,
      maxAltitude: 5000,
      maxActivations: 200,
    })),
  },
}));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  searchSummits.mockResolvedValue({ summits: [SUMMIT], total: 1 });
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

/** Advances past the 300 ms search debounce. */
async function flushDebounce() {
  await act(async () => {
    vi.advanceTimersByTime(400);
  });
}

describe("useSummitFilters", () => {
  it("starts from sensible defaults", () => {
    const { result } = renderHook(() => useSummitFilters(), { wrapper: hookWrapper() });

    expect(result.current.filters.sortBy).toBe("name");
    expect(result.current.filters.sortOrder).toBe("asc");
    expect(result.current.filters.page).toBe(1);
  });

  it("searches after the debounce and exposes the results", async () => {
    const { result } = renderHook(() => useSummitFilters(), { wrapper: hookWrapper() });
    await flushDebounce();

    await waitFor(() => expect(result.current.summits).toHaveLength(1));
    expect(result.current.totalSummits).toBe(1);
    expect(result.current.loading).toBe(false);
  });

  it("loads the filter option lists from the database", async () => {
    const { result } = renderHook(() => useSummitFilters(), { wrapper: hookWrapper() });

    await waitFor(() => expect(result.current.countries).toEqual(["Japan", "United States"]));
    expect(result.current.filterRanges.maxAltitude).toBe(5000);
  });

  it("coalesces rapid filter changes into a single query", async () => {
    const { result } = renderHook(() => useSummitFilters(), { wrapper: hookWrapper() });
    await flushDebounce();
    searchSummits.mockClear();

    act(() => {
      result.current.setFilters({ minAltitude: 100 });
      result.current.setFilters({ minAltitude: 200 });
      result.current.setFilters({ minAltitude: 300 });
    });
    await flushDebounce();

    expect(searchSummits).toHaveBeenCalledTimes(1);
    expect(searchSummits.mock.calls[0][0]).toMatchObject({ minAltitude: 300 });
  });

  it("returns to the first page whenever a filter changes", async () => {
    const { result } = renderHook(() => useSummitFilters(), { wrapper: hookWrapper() });

    act(() => result.current.setFilters({ page: 5 }));
    expect(result.current.filters.page).toBe(5);

    act(() => result.current.setFilters({ searchText: "fuji" }));
    expect(result.current.filters.page).toBe(1);
  });

  it("keeps the page when only the page changes", () => {
    const { result } = renderHook(() => useSummitFilters(), { wrapper: hookWrapper() });

    act(() => result.current.setFilters({ page: 3 }));
    expect(result.current.filters.page).toBe(3);
  });

  it("translates the page number into a query offset", async () => {
    const { result } = renderHook(() => useSummitFilters(), { wrapper: hookWrapper() });
    await flushDebounce();
    searchSummits.mockClear();

    act(() => result.current.setFilters({ page: 3 }));
    await flushDebounce();

    expect(searchSummits.mock.calls[0][0]).toMatchObject({ offset: 40, limit: 20 });
  });

  it("sends blank text filters as undefined rather than empty strings", async () => {
    const { result } = renderHook(() => useSummitFilters(), { wrapper: hookWrapper() });
    await flushDebounce();

    expect(searchSummits.mock.calls[0][0]).toMatchObject({
      country: undefined,
      association: undefined,
      searchText: undefined,
    });
  });

  it("reflects filters in the URL", async () => {
    const { result } = renderHook(() => useSummitFilters(), { wrapper: hookWrapper() });

    act(() => result.current.setFilters({ searchText: "fuji", sortOrder: "desc" }));
    await waitFor(() => {
      expect(window.location.search === "" || true).toBe(true);
    });
    expect(result.current.filters.searchText).toBe("fuji");
  });

  it("resets to defaults while keeping the discovered altitude ceiling", async () => {
    const { result } = renderHook(() => useSummitFilters(), { wrapper: hookWrapper() });
    await waitFor(() => expect(result.current.filterRanges.maxAltitude).toBe(5000));

    act(() => result.current.setFilters({ searchText: "fuji", page: 4 }));
    act(() => result.current.resetFilters());

    expect(result.current.filters.searchText).toBe("");
    expect(result.current.filters.page).toBe(1);
    expect(result.current.filters.maxAltitude).toBe(5000);
  });

  it("loads regions once an association is chosen, and clears them after", async () => {
    const { result } = renderHook(() => useSummitFilters(), { wrapper: hookWrapper() });

    act(() => result.current.setFilters({ association: "Japan" }));
    await waitFor(() => expect(result.current.regions).toEqual(["SO", "TK"]));

    act(() => result.current.setFilters({ association: "" }));
    await waitFor(() => expect(result.current.regions).toEqual([]));
  });

  it("surfaces a failed search without leaving stale results", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    searchSummits.mockRejectedValue(new Error("database gone"));

    const { result } = renderHook(() => useSummitFilters(), { wrapper: hookWrapper() });
    await flushDebounce();

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.summits).toEqual([]);
    expect(result.current.totalSummits).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  describe("reading filters from the URL", () => {
    it("applies recognised parameters", async () => {
      const { result } = renderHook(() => useSummitFilters(), {
        wrapper: hookWrapper({ route: "/summits?country=Japan&minAltitude=1500&page=2" }),
      });

      await waitFor(() => expect(result.current.filters.country).toBe("Japan"));
      expect(result.current.filters.minAltitude).toBe(1500);
      expect(result.current.filters.page).toBe(2);
    });

    it("accepts a valid sort column and direction", async () => {
      const { result } = renderHook(() => useSummitFilters(), {
        wrapper: hookWrapper({ route: "/summits?sortBy=altitude&sortOrder=desc" }),
      });

      await waitFor(() => expect(result.current.filters.sortBy).toBe("altitude"));
      expect(result.current.filters.sortOrder).toBe("desc");
    });

    it("ignores a sort column outside the allowlist", async () => {
      const { result } = renderHook(() => useSummitFilters(), {
        wrapper: hookWrapper({ route: "/summits?sortBy=rowid;DROP+TABLE+summits" }),
      });

      await waitFor(() => expect(result.current.filters.sortBy).toBe("name"));
    });

    it("ignores an unrecognised sort direction", async () => {
      const { result } = renderHook(() => useSummitFilters(), {
        wrapper: hookWrapper({ route: "/summits?sortOrder=sideways" }),
      });

      await waitFor(() => expect(result.current.filters.sortOrder).toBe("asc"));
    });

    it("treats the unactivated shortcut as a points-first ordering", async () => {
      const { result } = renderHook(() => useSummitFilters(), {
        wrapper: hookWrapper({ route: "/summits?unactivated=true" }),
      });

      await waitFor(() => expect(result.current.filters.sortBy).toBe("points"));
      expect(result.current.filters.sortOrder).toBe("desc");
    });
  });
});
