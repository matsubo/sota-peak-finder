import { describe, expect, it } from "vitest";
import {
  decodeGeohash,
  encodeGeohash,
  encodeGeohash4,
  encodeGeohash5,
  getAdjacentGeohashes,
  getGeohashCenter,
} from "../geohash";

describe("encodeGeohash", () => {
  it("encodes Tokyo to correct geohash", () => {
    const hash = encodeGeohash(35.6762, 139.6503, 5);
    expect(hash).toBe("xn76c");
  });

  it("encodes with different precisions", () => {
    const hash3 = encodeGeohash(35.6762, 139.6503, 3);
    const hash7 = encodeGeohash(35.6762, 139.6503, 7);
    expect(hash3).toHaveLength(3);
    expect(hash7).toHaveLength(7);
    expect(hash7.startsWith(hash3)).toBe(true);
  });

  it("encodes negative coordinates", () => {
    const hash = encodeGeohash(-33.8688, 151.2093, 5);
    expect(hash).toHaveLength(5);
    expect(hash).toBe("r3gx2");
  });

  it("defaults to precision 5", () => {
    const hash = encodeGeohash(35.6762, 139.6503);
    expect(hash).toHaveLength(5);
  });
});

describe("decodeGeohash", () => {
  it("decodes to bounding box containing original point", () => {
    const hash = encodeGeohash(35.6762, 139.6503, 5);
    const [latMin, lonMin, latMax, lonMax] = decodeGeohash(hash);
    expect(35.6762).toBeGreaterThanOrEqual(latMin);
    expect(35.6762).toBeLessThanOrEqual(latMax);
    expect(139.6503).toBeGreaterThanOrEqual(lonMin);
    expect(139.6503).toBeLessThanOrEqual(lonMax);
  });

  it("higher precision gives tighter bounds", () => {
    const [latMin3, , latMax3] = decodeGeohash(encodeGeohash(35.6762, 139.6503, 3));
    const [latMin5, , latMax5] = decodeGeohash(encodeGeohash(35.6762, 139.6503, 5));
    expect(latMax3 - latMin3).toBeGreaterThan(latMax5 - latMin5);
  });
});

describe("getGeohashCenter", () => {
  it("returns center close to original point", () => {
    const hash = encodeGeohash(35.6762, 139.6503, 7);
    const [lat, lon] = getGeohashCenter(hash);
    expect(lat).toBeCloseTo(35.6762, 2);
    expect(lon).toBeCloseTo(139.6503, 2);
  });
});

describe("getAdjacentGeohashes", () => {
  it("returns 8 neighbors", () => {
    const hash = encodeGeohash(35.6762, 139.6503, 5);
    const neighbors = getAdjacentGeohashes(hash);
    expect(neighbors).toHaveLength(8);
  });

  it("returns unique neighbors", () => {
    const hash = encodeGeohash(35.6762, 139.6503, 5);
    const neighbors = getAdjacentGeohashes(hash);
    const unique = new Set(neighbors);
    expect(unique.size).toBe(8);
  });

  it("neighbors do not include the original", () => {
    const hash = encodeGeohash(35.6762, 139.6503, 5);
    const neighbors = getAdjacentGeohashes(hash);
    expect(neighbors).not.toContain(hash);
  });
});

describe("encodeGeohash4", () => {
  it("returns precision 4", () => {
    expect(encodeGeohash4(35.6762, 139.6503)).toHaveLength(4);
  });
});

describe("encodeGeohash5", () => {
  it("returns precision 5", () => {
    expect(encodeGeohash5(35.6762, 139.6503)).toHaveLength(5);
  });
});
