import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGeolocation } from "../useGeolocation";

const getElevation = vi.fn();
const reverseGeocode = vi.fn();
const findNearbySotaSummits = vi.fn();
const findJccJcgByCity = vi.fn();
const findLocationInfo = vi.fn();

vi.mock("../../utils/api", () => ({
  getElevation: (...a: unknown[]) => getElevation(...a),
  reverseGeocode: (...a: unknown[]) => reverseGeocode(...a),
  findNearbySotaSummits: (...a: unknown[]) => findNearbySotaSummits(...a),
  findJccJcgByCity: (...a: unknown[]) => findJccJcgByCity(...a),
  findLocationInfo: (...a: unknown[]) => findLocationInfo(...a),
  initSotaDatabase: vi.fn(async () => true),
}));

/** Installs a geolocation API that resolves to the given coordinates. */
function stubGeolocation(coords: Partial<GeolocationCoordinates> | null, fail = false) {
  const geolocation = {
    getCurrentPosition: vi.fn((success: PositionCallback, error?: PositionErrorCallback) => {
      if (fail) {
        error?.({ code: 1, message: "denied" } as GeolocationPositionError);
        return;
      }
      success({
        coords: { latitude: 35.6762, longitude: 139.6503, accuracy: 10, altitude: null, ...coords },
        timestamp: Date.now(),
      } as GeolocationPosition);
    }),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  };

  Object.defineProperty(navigator, "geolocation", {
    value: geolocation,
    configurable: true,
    writable: true,
  });
  return geolocation;
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  window.dataLayer = [];
  getElevation.mockResolvedValue(40);
  reverseGeocode.mockResolvedValue({ prefecture: "Tokyo", city: "Chiyoda", fullAddress: "x" });
  findNearbySotaSummits.mockResolvedValue([]);
  findJccJcgByCity.mockReturnValue({ jcc: "1001", jcg: "" });
  findLocationInfo.mockReturnValue({ prefecture: "Tokyo", city: "Chiyoda", jcc: "1001", jcg: "" });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("useGeolocation", () => {
  it("starts in a ready state with no location", () => {
    stubGeolocation({});
    const { result } = renderHook(() => useGeolocation(null));

    expect(result.current.status).toBe("status.ready");
    expect(result.current.location).toBeNull();
  });

  it("converts a fix into coordinates and a grid locator", async () => {
    stubGeolocation({});
    const { result } = renderHook(() => useGeolocation(null));

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(result.current.location).not.toBeNull());
    expect(result.current.location?.latRaw).toBeCloseTo(35.6762, 4);
    expect(result.current.location?.gridLocator).toMatch(/^[A-Z]{2}\d{2}[a-z]{2}$/);
  });

  it("replaces the GPS altitude with the more accurate API elevation when online", async () => {
    stubGeolocation({ altitude: 123.6 });
    getElevation.mockResolvedValue(40);
    const { result } = renderHook(() => useGeolocation(null));

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(result.current.location?.elevation).toMatch(/40/));
  });

  it("falls back to a message when the API has no elevation for the point", async () => {
    stubGeolocation({});
    getElevation.mockResolvedValue(null);
    const { result } = renderHook(() => useGeolocation(null));

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(result.current.location?.elevation).toMatch(/unavailable/));
  });

  it("looks up nearby summits for the fix", async () => {
    stubGeolocation({});
    const { result } = renderHook(() => useGeolocation(null));

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(findNearbySotaSummits).toHaveBeenCalled());
  });

  it("reports when the browser has no geolocation support", async () => {
    Object.defineProperty(navigator, "geolocation", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const { result } = renderHook(() => useGeolocation(null));
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.status).toBe("status.notSupported");
    expect(result.current.error).toBe("status.notSupported");
  });

  it("reports a denied permission rather than throwing", async () => {
    stubGeolocation(null, true);
    const { result } = renderHook(() => useGeolocation(null));

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(result.current.error).toBeTruthy());
  });

  it("continues when the elevation lookup fails", async () => {
    stubGeolocation({});
    getElevation.mockRejectedValue(new Error("gsi down"));

    const { result } = renderHook(() => useGeolocation(null));
    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(result.current.location).not.toBeNull());
  });

  it("continues when reverse geocoding fails", async () => {
    stubGeolocation({});
    reverseGeocode.mockRejectedValue(new Error("nominatim down"));

    const { result } = renderHook(() => useGeolocation(null));
    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(result.current.location).not.toBeNull());
  });

  it("continues when the summit lookup fails", async () => {
    stubGeolocation({});
    findNearbySotaSummits.mockRejectedValue(new Error("db missing"));

    const { result } = renderHook(() => useGeolocation(null));
    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(result.current.location).not.toBeNull());
  });
});
