import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bufferedDbResponse,
  createSqliteMock,
  type ExecCall,
  streamingDbResponse,
} from "../../test/sqliteMock";

/**
 * SotaDatabase is a module-level singleton that caches its init promise, so
 * each test re-imports the module to get a clean instance rather than adding a
 * reset seam to production code.
 */
async function loadDatabase(
  options: Parameters<typeof createSqliteMock>[0] = {},
  response: Response = streamingDbResponse(),
) {
  const mock = createSqliteMock(options);

  vi.doMock("@sqlite.org/sqlite-wasm", () => ({
    default: vi.fn(async () => mock.sqlite3),
  }));

  vi.stubGlobal(
    "fetch",
    vi.fn(async () => response),
  );

  const { sotaDatabase } = await import("../sotaDatabase");
  return { sotaDatabase, ...mock };
}

const SUMMIT = {
  id: 1,
  ref: "JA/SO-001",
  name: "Fuji",
  lat: 35.3606,
  lon: 138.7274,
  altitude: 3776,
  points: 10,
  activations: 42,
  bonus: 3,
  association: "Japan",
  region: "SO",
};

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.doUnmock("@sqlite.org/sqlite-wasm");
  vi.restoreAllMocks();
});

describe("initialisation", () => {
  it("loads the database into memory via deserialize", async () => {
    const { sotaDatabase, sqlite3 } = await loadDatabase();
    await sotaDatabase.init();

    expect(sqlite3.capi.sqlite3_deserialize).toHaveBeenCalled();
    expect(sqlite3.wasm.allocFromTypedArray).toHaveBeenCalled();
  });

  it("requests the database with its cache-busting fingerprint", async () => {
    const { sotaDatabase } = await loadDatabase();
    await sotaDatabase.init();

    expect(vi.mocked(fetch).mock.calls[0][0]).toContain("data/sota.db?v=");
  });

  it("reports download progress while streaming", async () => {
    const { sotaDatabase } = await loadDatabase();
    const seen: Array<[number, number]> = [];
    sotaDatabase.onProgress((loaded, total) => seen.push([loaded, total]));

    await sotaDatabase.init();
    expect(seen.length).toBeGreaterThan(0);
    expect(seen[seen.length - 1][0]).toBe(32);
  });

  it("stops notifying a listener once it unsubscribes", async () => {
    const { sotaDatabase } = await loadDatabase();
    const listener = vi.fn();
    const unsubscribe = sotaDatabase.onProgress(listener);
    unsubscribe();

    await sotaDatabase.init();
    expect(listener).not.toHaveBeenCalled();
  });

  it("falls back to a buffered read when no content length is advertised", async () => {
    const { sotaDatabase, sqlite3 } = await loadDatabase({}, bufferedDbResponse());
    await sotaDatabase.init();
    expect(sqlite3.capi.sqlite3_deserialize).toHaveBeenCalled();
  });

  it("initialises only once across concurrent callers", async () => {
    const { sotaDatabase, sqlite3 } = await loadDatabase();
    await Promise.all([sotaDatabase.init(), sotaDatabase.init(), sotaDatabase.init()]);
    expect(sqlite3.oo1.DB).toHaveBeenCalledTimes(1);
  });

  it("throws and allows a retry when the download fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = { ok: false, statusText: "Not Found" } as Response;
    const { sotaDatabase } = await loadDatabase({}, failing);

    await expect(sotaDatabase.init()).rejects.toThrow(/Not Found/);
  });

  it("throws when deserialize reports a non-zero result code", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { sotaDatabase } = await loadDatabase({ deserializeRc: 7 });

    await expect(sotaDatabase.init()).rejects.toThrow(/deserialize failed with code 7/);
  });
});

describe("findNearby", () => {
  it("queries the R*Tree index with a bounding box and sorts by distance", async () => {
    const far = { ...SUMMIT, id: 2, ref: "JA/SO-002", lat: 36.5, lon: 139.5 };
    const { sotaDatabase, execCalls } = await loadDatabase({
      responders: [{ match: /summits_idx/, rows: [far, SUMMIT] }],
    });

    const results = await sotaDatabase.findNearby(35.3606, 138.7274, 200, 10);

    expect(results.map((s) => s.ref)).toEqual(["JA/SO-001", "JA/SO-002"]);
    expect(results[0].distance).toBeCloseTo(0, 3);
    expect(results[1].distance).toBeGreaterThan(results[0].distance);

    const spatial = execCalls.find((c: ExecCall) => /summits_idx/.test(c.sql));
    expect(spatial?.bind).toHaveLength(4);
  });

  it("limits the number of results", async () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ ...SUMMIT, id: i, lat: 35 + i * 0.01 }));
    const { sotaDatabase } = await loadDatabase({
      responders: [{ match: /summits_idx/, rows }],
    });

    expect(await sotaDatabase.findNearby(35, 138.7, 500, 3)).toHaveLength(3);
  });

  it("returns nothing when the box contains no summits", async () => {
    const { sotaDatabase } = await loadDatabase();
    expect(await sotaDatabase.findNearby(0, 0)).toEqual([]);
  });
});

describe("findByRef", () => {
  it("returns the matching summit", async () => {
    const { sotaDatabase } = await loadDatabase({
      responders: [{ match: /WHERE ref = \?/, rows: [SUMMIT] }],
    });

    expect((await sotaDatabase.findByRef("JA/SO-001"))?.name).toBe("Fuji");
  });

  it("binds the reference rather than interpolating it", async () => {
    const { sotaDatabase, execCalls } = await loadDatabase({
      responders: [{ match: /WHERE ref = \?/, rows: [SUMMIT] }],
    });
    await sotaDatabase.findByRef("JA/SO-001");

    expect(execCalls.find((c) => /WHERE ref/.test(c.sql))?.bind).toEqual(["JA/SO-001"]);
  });

  it("returns null for an unknown reference", async () => {
    const { sotaDatabase } = await loadDatabase();
    expect(await sotaDatabase.findByRef("XX/YY-999")).toBeNull();
  });
});

describe("searchSummits", () => {
  it("applies filters as bound parameters and reports the total", async () => {
    const { sotaDatabase, execCalls } = await loadDatabase({
      responders: [
        { match: /COUNT\(\*\) as total/, rows: [{ total: 3 }] },
        { match: /FROM summits\s+WHERE/, rows: [SUMMIT] },
      ],
    });

    const { total } = await sotaDatabase.searchSummits({ association: "Japan", minAltitude: 1000 });

    expect(total).toBe(3);
    const counted = execCalls.find((c) => /COUNT/.test(c.sql));
    expect(counted?.bind).toEqual(["Japan", 1000]);
  });

  it("paginates using offset and limit", async () => {
    const { sotaDatabase, execCalls } = await loadDatabase({
      responders: [{ match: /COUNT/, rows: [{ total: 100 }] }],
    });

    await sotaDatabase.searchSummits({ offset: 40, limit: 20 });
    const paged = execCalls.find((c) => /LIMIT/.test(c.sql));
    expect(paged?.sql).toMatch(/LIMIT|OFFSET/);
  });

  it("refuses an injected sort column, falling back to the default order", async () => {
    const { sotaDatabase, execCalls } = await loadDatabase({
      responders: [{ match: /COUNT/, rows: [{ total: 0 }] }],
    });

    await sotaDatabase.searchSummits({ sortBy: "name; DROP TABLE summits" as never });
    expect(execCalls.some((c) => /DROP TABLE/.test(c.sql))).toBe(false);
  });
});

describe("aggregate queries", () => {
  it("reports total summits and association breakdown", async () => {
    const { sotaDatabase } = await loadDatabase({
      responders: [
        { match: /COUNT\(\*\) FROM summits/, rows: [7] },
        { match: /GROUP BY association/, rows: [{ association: "Japan", count: 7 }] },
      ],
    });

    const stats = await sotaDatabase.getStats();
    expect(stats.totalSummits).toBe(7);
    expect(stats.associations[0]).toEqual({ association: "Japan", count: 7 });
  });

  it("maps metadata rows onto named fields", async () => {
    const { sotaDatabase } = await loadDatabase({
      responders: [
        {
          match: /FROM metadata/,
          rows: [
            { key: "build_date", value: "2026-08-15" },
            { key: "sota_version", value: "1.2" },
            { key: "source", value: "sota.org.uk" },
            { key: "unrelated", value: "ignored" },
          ],
        },
      ],
    });

    expect(await sotaDatabase.getMetadata()).toEqual({
      buildDate: "2026-08-15",
      version: "1.2",
      source: "sota.org.uk",
    });
  });

  it("returns empty metadata when the table is missing", async () => {
    const { sotaDatabase, db } = await loadDatabase();
    db.exec.mockImplementationOnce(() => {
      throw new Error("no such table: metadata");
    });

    expect(await sotaDatabase.getMetadata()).toEqual({
      buildDate: null,
      version: null,
      source: null,
    });
  });

  it("lists distinct associations, countries and regions", async () => {
    const { sotaDatabase } = await loadDatabase({
      responders: [
        { match: /DISTINCT association/, rows: [{ association: "Japan" }] },
        { match: /region/, rows: [{ region: "SO" }] },
      ],
    });

    expect(await sotaDatabase.getAssociations()).toEqual(["Japan"]);
    expect(await sotaDatabase.getRegionsByAssociation("Japan")).toEqual(["SO"]);
  });

  it("reports filter ranges, defaulting when the table is empty", async () => {
    const withRows = await loadDatabase({
      responders: [
        {
          match: /MIN\(altitude\)/,
          rows: [{ minAltitude: 10, maxAltitude: 3776, maxActivations: 99 }],
        },
      ],
    });
    expect(await withRows.sotaDatabase.getFilterRanges()).toEqual({
      minAltitude: 10,
      maxAltitude: 3776,
      maxActivations: 99,
    });

    vi.resetModules();
    const empty = await loadDatabase();
    expect(await empty.sotaDatabase.getFilterRanges()).toEqual({
      minAltitude: 0,
      maxAltitude: 0,
      maxActivations: 0,
    });
  });

  it("assembles the dashboard statistics", async () => {
    const { sotaDatabase } = await loadDatabase({
      responders: [
        { match: /ORDER BY altitude DESC/, rows: [SUMMIT] },
        { match: /ORDER BY altitude ASC/, rows: [{ ...SUMMIT, altitude: 12 }] },
        { match: /ORDER BY points DESC/, rows: [SUMMIT] },
        { match: /ORDER BY activations DESC/, rows: [SUMMIT] },
        { match: /activations = 0/, rows: [5] },
        { match: /GROUP BY points/, rows: [{ points: 10, count: 4 }] },
        {
          match: /GROUP BY association/,
          rows: [
            { association: "Japan - Tokyo", count: 7 },
            { association: "Japan - Osaka", count: 3 },
          ],
        },
      ],
    });

    const stats = await sotaDatabase.getDashboardStats();
    expect(stats.highestSummit?.altitude).toBe(3776);
    expect(stats.unactivatedCount).toBe(5);
    // Regional associations collapse into a single country total.
    expect(stats.countryStats).toContainEqual({ country: "Japan", count: 10 });
  });
});

describe("clearCache", () => {
  it("removes the cached database from OPFS when available", async () => {
    const removeEntry = vi.fn();
    vi.stubGlobal("navigator", {
      ...navigator,
      storage: { getDirectory: vi.fn(async () => ({ removeEntry })) },
    });

    const { sotaDatabase } = await loadDatabase();
    await sotaDatabase.clearCache();
    expect(removeEntry).toHaveBeenCalledWith("sota.db");
  });

  it("survives a storage API that rejects", async () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      storage: {
        getDirectory: vi.fn(async () => {
          throw new Error("denied");
        }),
      },
    });

    const { sotaDatabase } = await loadDatabase();
    await expect(sotaDatabase.clearCache()).resolves.toBeUndefined();
  });
});
