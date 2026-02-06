/**
 * Geohash encoding utilities for spatial indexing
 * Based on standard geohash algorithm (base32)
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/**
 * Encode latitude/longitude to geohash
 * @param lat Latitude (-90 to 90)
 * @param lon Longitude (-180 to 180)
 * @param precision Number of characters (1-12)
 * @returns Geohash string
 */
export function encodeGeohash(lat: number, lon: number, precision: number = 5): string {
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';

  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      // Longitude
      const lonMid = (lonMin + lonMax) / 2;
      if (lon >= lonMid) {
        idx = (idx << 1) + 1;
        lonMin = lonMid;
      } else {
        idx = idx << 1;
        lonMax = lonMid;
      }
    } else {
      // Latitude
      const latMid = (latMin + latMax) / 2;
      if (lat >= latMid) {
        idx = (idx << 1) + 1;
        latMin = latMid;
      } else {
        idx = idx << 1;
        latMax = latMid;
      }
    }

    evenBit = !evenBit;

    if (++bit === 5) {
      geohash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}

/**
 * Decode geohash to latitude/longitude bounds
 * @param geohash Geohash string
 * @returns Bounding box [minLat, minLon, maxLat, maxLon]
 */
export function decodeGeohash(geohash: string): [number, number, number, number] {
  let evenBit = true;
  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;

  for (const char of geohash) {
    const idx = BASE32.indexOf(char);
    if (idx === -1) continue;

    for (let mask = 16; mask > 0; mask >>= 1) {
      if (evenBit) {
        // Longitude
        const lonMid = (lonMin + lonMax) / 2;
        if (idx & mask) {
          lonMin = lonMid;
        } else {
          lonMax = lonMid;
        }
      } else {
        // Latitude
        const latMid = (latMin + latMax) / 2;
        if (idx & mask) {
          latMin = latMid;
        } else {
          latMax = latMid;
        }
      }
      evenBit = !evenBit;
    }
  }

  return [latMin, lonMin, latMax, lonMax];
}

/**
 * Get center point of a geohash
 * @param geohash Geohash string
 * @returns [latitude, longitude]
 */
export function getGeohashCenter(geohash: string): [number, number] {
  const [latMin, lonMin, latMax, lonMax] = decodeGeohash(geohash);
  return [(latMin + latMax) / 2, (lonMin + lonMax) / 2];
}

/**
 * Get 8 adjacent geohash cells (neighbors)
 * @param geohash Geohash string
 * @returns Array of 8 neighboring geohashes
 */
export function getAdjacentGeohashes(geohash: string): string[] {
  const neighbors: { [key: string]: { [key: string]: string } } = {
    right: { even: 'bc01fg45238967deuvhjyznpkmstqrwx', odd: 'p0r21436x8zb9dcf5h7kjnmqesgutwvy' },
    left: { even: '238967debc01fg45kmstqrwxuvhjyznp', odd: '14365h7k9dcfesgujnmqp0r2twvyx8zb' },
    top: { even: 'p0r21436x8zb9dcf5h7kjnmqesgutwvy', odd: 'bc01fg45238967deuvhjyznpkmstqrwx' },
    bottom: { even: '14365h7k9dcfesgujnmqp0r2twvyx8zb', odd: '238967debc01fg45kmstqrwxuvhjyznp' }
  };

  const borders: { [key: string]: { [key: string]: string } } = {
    right: { even: 'bcfguvyz', odd: 'prxz' },
    left: { even: '0145hjnp', odd: '028b' },
    top: { even: 'prxz', odd: 'bcfguvyz' },
    bottom: { even: '028b', odd: '0145hjnp' }
  };

  function getNeighbor(hash: string, direction: string): string {
    if (!hash) return '';
    const lastChar = hash[hash.length - 1];
    let parent = hash.slice(0, -1);
    const type = hash.length % 2 === 0 ? 'even' : 'odd';

    if (borders[direction][type].indexOf(lastChar) !== -1 && parent) {
      parent = getNeighbor(parent, direction);
    }

    const base = neighbors[direction][type];
    return parent + base[BASE32.indexOf(lastChar)];
  }

  return [
    getNeighbor(geohash, 'top'),
    getNeighbor(getNeighbor(geohash, 'top'), 'right'),
    getNeighbor(geohash, 'right'),
    getNeighbor(getNeighbor(geohash, 'bottom'), 'right'),
    getNeighbor(geohash, 'bottom'),
    getNeighbor(getNeighbor(geohash, 'bottom'), 'left'),
    getNeighbor(geohash, 'left'),
    getNeighbor(getNeighbor(geohash, 'top'), 'left')
  ];
}

/**
 * Encode to geohash-4 for regional partitioning
 */
export function encodeGeohash4(lat: number, lon: number): string {
  return encodeGeohash(lat, lon, 4);
}

/**
 * Encode to geohash-5 for sub-grid indexing
 */
export function encodeGeohash5(lat: number, lon: number): string {
  return encodeGeohash(lat, lon, 5);
}

/**
 * Get 8 adjacent geohash-4 cells
 */
export function getAdjacentGeohash4(geohash: string): string[] {
  return getAdjacentGeohashes(geohash);
}
