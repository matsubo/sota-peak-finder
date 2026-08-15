import { describe, expect, it } from "vitest";
import { boundingBox, buildSummitSearchQuery } from "../summitQuery";

describe("buildSummitSearchQuery", () => {
  it("produces no WHERE clause when nothing is filtered", () => {
    const { whereClause, bindings } = buildSummitSearchQuery({});
    expect(whereClause).toBe("");
    expect(bindings).toEqual([]);
  });

  it("matches a country by exact association or prefix", () => {
    const { whereClause, bindings } = buildSummitSearchQuery({ country: "Japan" });
    expect(whereClause).toBe("WHERE (association = ? OR association LIKE ?)");
    expect(bindings).toEqual(["Japan", "Japan - %"]);
  });

  it("joins multiple filters with AND, preserving binding order", () => {
    const { whereClause, bindings } = buildSummitSearchQuery({
      association: "JA",
      minAltitude: 1000,
      maxPoints: 8,
    });
    expect(whereClause).toBe("WHERE association = ? AND altitude >= ? AND points <= ?");
    expect(bindings).toEqual(["JA", 1000, 8]);
  });

  it("keeps zero-valued numeric bounds instead of discarding them", () => {
    // A plain falsy check would drop these and silently widen the search.
    const { whereClause, bindings } = buildSummitSearchQuery({
      minActivations: 0,
      maxActivations: 0,
    });
    expect(whereClause).toBe("WHERE activations >= ? AND activations <= ?");
    expect(bindings).toEqual([0, 0]);
  });

  it("searches ref and name with a trimmed, wrapped pattern", () => {
    const { whereClause, bindings } = buildSummitSearchQuery({ searchText: "  fuji  " });
    expect(whereClause).toBe("WHERE (ref LIKE ? OR name LIKE ?)");
    expect(bindings).toEqual(["%fuji%", "%fuji%"]);
  });

  it("ignores whitespace-only search text", () => {
    const { whereClause, bindings } = buildSummitSearchQuery({ searchText: "   " });
    expect(whereClause).toBe("");
    expect(bindings).toEqual([]);
  });

  it("defaults to ordering by name ascending", () => {
    expect(buildSummitSearchQuery({}).orderByClause).toBe("ORDER BY name ASC");
  });

  it("honours a valid sort column and direction", () => {
    expect(buildSummitSearchQuery({ sortBy: "altitude", sortOrder: "desc" }).orderByClause).toBe(
      "ORDER BY altitude DESC",
    );
  });

  describe("ORDER BY hardening", () => {
    // sortBy and sortOrder are interpolated into SQL rather than bound, so the
    // allowlist has to live here and not only in the calling hook.
    it("falls back to the default column when given an unknown one", () => {
      const { orderByClause } = buildSummitSearchQuery({
        sortBy: "rowid" as never,
      });
      expect(orderByClause).toBe("ORDER BY name ASC");
    });

    it("refuses an injected sort column", () => {
      const { orderByClause } = buildSummitSearchQuery({
        sortBy: "name; DROP TABLE summits; --" as never,
      });
      expect(orderByClause).toBe("ORDER BY name ASC");
    });

    it("refuses an injected sort direction", () => {
      const { orderByClause } = buildSummitSearchQuery({
        sortOrder: "asc; DELETE FROM summits" as never,
      });
      expect(orderByClause).toBe("ORDER BY name ASC");
    });
  });
});

describe("boundingBox", () => {
  it("expands latitude by roughly the requested radius", () => {
    const { minLat, maxLat } = boundingBox(35, 139, 111);
    expect(maxLat - 35).toBeCloseTo(1, 2);
    expect(35 - minLat).toBeCloseTo(1, 2);
  });

  it("widens longitude with latitude, since meridians converge", () => {
    const equator = boundingBox(0, 0, 100);
    const highLatitude = boundingBox(60, 0, 100);
    expect(highLatitude.maxLon).toBeGreaterThan(equator.maxLon);
  });

  it("stays centred on the requested point", () => {
    const box = boundingBox(-33.87, 151.21, 50);
    expect((box.minLat + box.maxLat) / 2).toBeCloseTo(-33.87, 6);
    expect((box.minLon + box.maxLon) / 2).toBeCloseTo(151.21, 6);
  });

  it("scales with the radius", () => {
    const small = boundingBox(35, 139, 10);
    const large = boundingBox(35, 139, 100);
    expect(large.maxLat - 35).toBeGreaterThan(small.maxLat - 35);
  });
});
