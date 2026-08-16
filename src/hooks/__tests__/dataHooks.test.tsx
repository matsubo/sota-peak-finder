import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useActivations } from "../useActivations";
import { useActivatorHistory } from "../useActivatorHistory";
import { useOnlineStatus } from "../useOnlineStatus";
import { useSotaData } from "../useSotaData";
import { useWeatherForecast } from "../useWeatherForecast";

const fetchSummitActivations = vi.fn();
const fetchActivatorHistory = vi.fn();
const initSotaDatabase = vi.fn();
const fetchWeatherForecast = vi.fn();

vi.mock("../../utils/api", () => ({
  fetchSummitActivations: (...a: unknown[]) => fetchSummitActivations(...a),
  fetchActivatorHistory: (...a: unknown[]) => fetchActivatorHistory(...a),
  initSotaDatabase: (...a: unknown[]) => initSotaDatabase(...a),
}));

vi.mock("../../utils/weather", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../utils/weather")>()),
  fetchWeatherForecast: (...a: unknown[]) => fetchWeatherForecast(...a),
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("useOnlineStatus", () => {
  it("starts from the browser's current state", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(navigator.onLine);
  });

  it("follows offline and online events", () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);
  });

  it("detaches its listeners on unmount", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    renderHook(() => useOnlineStatus()).unmount();

    expect(remove).toHaveBeenCalledWith("online", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("offline", expect.any(Function));
  });
});

describe("useActivations", () => {
  it("does nothing without a summit reference", () => {
    const { result } = renderHook(() => useActivations(undefined));

    expect(result.current.loading).toBe(false);
    expect(fetchSummitActivations).not.toHaveBeenCalled();
  });

  it("loads activations and records when they were fetched", async () => {
    fetchSummitActivations.mockResolvedValue([{ activationDate: "2026-01-01" }]);
    const { result } = renderHook(() => useActivations("JA/SO-001"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activations).toHaveLength(1);
    expect(result.current.fetchedAt).toBeInstanceOf(Date);
    expect(result.current.error).toBeNull();
  });

  it("requests at most ten activations", async () => {
    fetchSummitActivations.mockResolvedValue([]);
    renderHook(() => useActivations("JA/SO-001"));

    await waitFor(() => expect(fetchSummitActivations).toHaveBeenCalledWith("JA/SO-001", 10));
  });

  it("exposes the failure message when the request fails", async () => {
    fetchSummitActivations.mockRejectedValue(new Error("service unavailable"));
    const { result } = renderHook(() => useActivations("JA/SO-001"));

    await waitFor(() => expect(result.current.error).toBe("service unavailable"));
    expect(result.current.loading).toBe(false);
  });

  it("refetches when the summit changes", async () => {
    fetchSummitActivations.mockResolvedValue([]);
    const { rerender } = renderHook(({ summitRef }) => useActivations(summitRef), {
      initialProps: { summitRef: "JA/SO-001" },
    });

    await waitFor(() => expect(fetchSummitActivations).toHaveBeenCalledTimes(1));
    rerender({ summitRef: "W7W/KG-001" });
    await waitFor(() => expect(fetchSummitActivations).toHaveBeenCalledTimes(2));
  });
});

describe("useActivatorHistory", () => {
  it("loads an activator's log", async () => {
    fetchActivatorHistory.mockResolvedValue([{ summitCode: "JA/SO-001" }]);
    const { result } = renderHook(() => useActivatorHistory("42"));

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("reports a failure rather than throwing", async () => {
    fetchActivatorHistory.mockRejectedValue(new Error("no such activator"));
    const { result } = renderHook(() => useActivatorHistory("42"));

    await waitFor(() => expect(result.current.error).toBeTruthy());
  });
});

describe("useWeatherForecast", () => {
  it("loads a forecast for the given summit", async () => {
    fetchWeatherForecast.mockResolvedValue({
      days: [{ date: "2026-01-01" }],
      elevation: 3776,
      fetchedAt: new Date().toISOString(),
    });

    const { result } = renderHook(() => useWeatherForecast(35.36, 138.72, 3776));
    await waitFor(() => expect(result.current.weather).not.toBeNull());
    expect(result.current.weather?.days).toHaveLength(1);
  });

  it("surfaces a failure", async () => {
    fetchWeatherForecast.mockRejectedValue(new Error("rate limited"));
    const { result } = renderHook(() => useWeatherForecast(0, 0, 0));

    await waitFor(() => expect(result.current.error).toBeTruthy());
  });
});

describe("useSotaData", () => {
  it("reports readiness once the database initialises", async () => {
    initSotaDatabase.mockResolvedValue(true);
    const { result } = renderHook(() => useSotaData());

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.error).toBeNull();
    expect(result.current.region).toBe("Worldwide");
  });

  it("reports an error when initialisation reports failure", async () => {
    initSotaDatabase.mockResolvedValue(false);
    const { result } = renderHook(() => useSotaData());

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.isReady).toBe(false);
  });

  it("reports an error when initialisation rejects", async () => {
    initSotaDatabase.mockRejectedValue(new Error("wasm missing"));
    const { result } = renderHook(() => useSotaData());

    await waitFor(() => expect(result.current.error?.message).toBe("wasm missing"));
  });
});
