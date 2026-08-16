import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchActivatorHistory,
  fetchSummitActivations,
  getElevation,
  loadLocationData,
  reverseGeocode,
} from "../api";

/** Replaces global fetch with one returning the given payload. */
function mockFetch(payload: unknown, init: { ok?: boolean; status?: number } = {}) {
  const fn = vi.fn().mockResolvedValue({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => payload,
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

function mockFetchRejection(error: Error) {
  const fn = vi.fn().mockRejectedValue(error);
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getElevation", () => {
  it("rounds the elevation returned by the GSI API", async () => {
    mockFetch({ elevation: 3776.24 });
    expect(await getElevation(35.36, 138.72)).toBe(3776);
  });

  it("requests the coordinates it was given", async () => {
    const fetchMock = mockFetch({ elevation: 100 });
    await getElevation(35.5, 139.5);
    expect(fetchMock.mock.calls[0][0]).toContain("lat=35.5");
    expect(fetchMock.mock.calls[0][0]).toContain("lon=139.5");
  });

  it("returns null when the response carries no elevation", async () => {
    mockFetch({});
    expect(await getElevation(0, 0)).toBeNull();
  });

  it("returns null when elevation is explicitly null", async () => {
    mockFetch({ elevation: null });
    expect(await getElevation(0, 0)).toBeNull();
  });

  it("returns null rather than throwing when the request fails", async () => {
    mockFetchRejection(new Error("network down"));
    expect(await getElevation(0, 0)).toBeNull();
  });

  it("treats sea level as a real elevation", async () => {
    mockFetch({ elevation: 0 });
    expect(await getElevation(0, 0)).toBe(0);
  });
});

describe("reverseGeocode", () => {
  it("extracts prefecture and city from an address", async () => {
    mockFetch({
      address: { state: "Tokyo", city: "Chiyoda" },
      display_name: "Chiyoda, Tokyo, Japan",
    });

    expect(await reverseGeocode(35.68, 139.69)).toEqual({
      prefecture: "Tokyo",
      city: "Chiyoda",
      fullAddress: "Chiyoda, Tokyo, Japan",
    });
  });

  it("falls back through the alternative city fields", async () => {
    mockFetch({ address: { state: "Nagano", town: "Karuizawa" }, display_name: "x" });
    expect((await reverseGeocode(0, 0))?.city).toBe("Karuizawa");

    mockFetch({ address: { state: "Nagano", village: "Nozawa" }, display_name: "x" });
    expect((await reverseGeocode(0, 0))?.city).toBe("Nozawa");

    mockFetch({ address: { state: "Nagano", municipality: "Ueda" }, display_name: "x" });
    expect((await reverseGeocode(0, 0))?.city).toBe("Ueda");
  });

  it("falls back to province when there is no state", async () => {
    mockFetch({ address: { province: "Ontario", city: "Ottawa" }, display_name: "x" });
    expect((await reverseGeocode(0, 0))?.prefecture).toBe("Ontario");
  });

  it("yields empty strings when neither field is present", async () => {
    mockFetch({ address: {}, display_name: "somewhere" });
    expect(await reverseGeocode(0, 0)).toEqual({
      prefecture: "",
      city: "",
      fullAddress: "somewhere",
    });
  });

  it("returns null when the response has no address", async () => {
    mockFetch({});
    expect(await reverseGeocode(0, 0)).toBeNull();
  });

  it("returns null rather than throwing when the request fails", async () => {
    mockFetchRejection(new Error("offline"));
    expect(await reverseGeocode(0, 0)).toBeNull();
  });

  it("identifies itself with a User-Agent, as Nominatim requires", async () => {
    const fetchMock = mockFetch({ address: {}, display_name: "x" });
    await reverseGeocode(0, 0);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: { "User-Agent": expect.any(String) },
    });
  });
});

describe("loadLocationData", () => {
  it("returns the parsed payload", async () => {
    mockFetch({ prefectures: [] });
    expect(await loadLocationData()).toEqual({ prefectures: [] });
  });

  it("returns null when the request fails", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetchRejection(new Error("404"));
    expect(await loadLocationData()).toBeNull();
    expect(spy).toHaveBeenCalled();
  });
});

describe("fetchSummitActivations", () => {
  it("splits the reference into association and code", async () => {
    const fetchMock = mockFetch([]);
    await fetchSummitActivations("JA/SO-001");
    expect(fetchMock.mock.calls[0][0]).toContain("/activations/JA/SO-001");
  });

  it("splits on the first separator only", async () => {
    const fetchMock = mockFetch([]);
    await fetchSummitActivations("W7W/KG-001");
    expect(fetchMock.mock.calls[0][0]).toContain("/activations/W7W/KG-001");
  });

  it("returns an empty array for a reference with no separator", async () => {
    const fetchMock = mockFetch([]);
    expect(await fetchSummitActivations("NONSENSE")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("limits the number of activations returned", async () => {
    mockFetch(Array.from({ length: 30 }, (_, i) => ({ id: i })));
    expect(await fetchSummitActivations("JA/SO-001", 5)).toHaveLength(5);
  });

  it("defaults to ten activations", async () => {
    mockFetch(Array.from({ length: 30 }, (_, i) => ({ id: i })));
    expect(await fetchSummitActivations("JA/SO-001")).toHaveLength(10);
  });

  it("throws when the API responds with an error status", async () => {
    mockFetch(null, { ok: false, status: 503 });
    await expect(fetchSummitActivations("JA/SO-001")).rejects.toThrow("503");
  });
});

describe("fetchActivatorHistory", () => {
  it("requests the given user and limit", async () => {
    const fetchMock = mockFetch([]);
    await fetchActivatorHistory(1234, 50);
    expect(fetchMock.mock.calls[0][0]).toContain("/logs/activator/1234/50/1");
  });

  it("defaults to a limit of one thousand", async () => {
    const fetchMock = mockFetch([]);
    await fetchActivatorHistory(1234);
    expect(fetchMock.mock.calls[0][0]).toContain("/1000/1");
  });

  it("returns the full payload unsliced", async () => {
    mockFetch(Array.from({ length: 42 }, (_, i) => ({ id: i })));
    expect(await fetchActivatorHistory(1)).toHaveLength(42);
  });

  it("throws when the API responds with an error status", async () => {
    mockFetch(null, { ok: false, status: 500 });
    await expect(fetchActivatorHistory(1)).rejects.toThrow("500");
  });
});
