/**
 * SQLite WASM Database Wrapper for SOTA Summit Data
 *
 * Provides efficient worldwide summit lookup using SQLite's R*Tree spatial index.
 * Database is cached in OPFS (Origin Private File System) for offline access.
 */

import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import type { Sqlite3Static, Database } from '@sqlite.org/sqlite-wasm';

export interface SotaSummit {
  id: number;
  ref: string;
  name: string;
  lat: number;
  lon: number;
  altitude: number;
  points: number;
  activations: number;
  bonus: number | null;
  association: string;
  region: string;
}

export interface SotaSummitWithDistance extends SotaSummit {
  distance: number;
}

class SotaDatabase {
  private sqlite3: Sqlite3Static | null = null;
  private db: Database | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize SQLite WASM and load database
   * Automatically caches in OPFS for offline access
   */
  async init(): Promise<void> {
    // Return existing initialization promise if already started
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    try {
      console.log('🏔️  Initializing SOTA Database...');

      // Initialize SQLite WASM
      const basePath = import.meta.env.BASE_URL || '/';
      // @ts-expect-error - sqlite3InitModule type definition is incorrect, it does accept config
      this.sqlite3 = await sqlite3InitModule({
        print: console.log,
        printErr: console.error,
        locateFile: (file: string) => `${basePath}wasm/${file}`,
      });

      console.log('✅ SQLite WASM initialized (version:', this.sqlite3.version.libVersion, ')');

      // Download database from network (Service Worker will cache it)
      console.log('📥 Downloading SOTA database...');
      const response = await fetch(`${basePath}data/sota.db`);
      if (!response.ok) {
        throw new Error(`Failed to fetch database: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const dbData = new Uint8Array(arrayBuffer);
      console.log(`✅ Downloaded database (${(dbData.length / 1024 / 1024).toFixed(2)} MB)`);

      // Load database into memory using sqlite3_deserialize
      this.db = new this.sqlite3.oo1.DB(':memory:');
      const ptrSource = this.sqlite3.wasm.allocFromTypedArray(dbData);
      const flags = this.sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE
        | this.sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE;
      const rc = this.sqlite3.capi.sqlite3_deserialize(
        (this.db as unknown as Record<string, unknown>).pointer as number, 'main', ptrSource,
        dbData.byteLength, dbData.byteLength, flags
      );
      if (rc !== 0) {
        throw new Error(`sqlite3_deserialize failed with code ${rc}`);
      }

      // Verify database integrity
      const count = this.db.selectValue('SELECT COUNT(*) FROM summits');
      console.log(`✅ Database ready with ${count?.toLocaleString()} summits`);

    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Find summits near a location using R*Tree spatial index
   *
   * @param lat Latitude
   * @param lon Longitude
   * @param radiusKm Search radius in kilometers (default: 50)
   * @param limit Maximum number of results (default: 10)
   * @returns Array of summits sorted by distance
   */
  async findNearby(
    lat: number,
    lon: number,
    radiusKm: number = 50,
    limit: number = 10
  ): Promise<SotaSummitWithDistance[]> {
    if (!this.db) {
      await this.init();
    }

    // Calculate bounding box
    // 1 degree latitude ≈ 111 km
    // 1 degree longitude ≈ 111 km * cos(latitude)
    const latDelta = radiusKm / 111;
    const lonDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLon = lon - lonDelta;
    const maxLon = lon + lonDelta;

    // Query using R*Tree spatial index (bounding box only)
    // Distance calculation done in JavaScript since SQLite lacks trig functions
    const query = `
      SELECT
        s.id, s.ref, s.name, s.lat, s.lon, s.altitude,
        s.points, s.activations, s.bonus, s.association, s.region
      FROM summits s
      JOIN summits_idx i ON s.id = i.id
      WHERE i.minLat <= ? AND i.maxLat >= ?
        AND i.minLon <= ? AND i.maxLon >= ?
    `;

    const candidates: SotaSummit[] = [];

    this.db!.exec({
      sql: query,
      bind: [maxLat, minLat, maxLon, minLon],
      rowMode: 'object',
      callback: (row) => {
        candidates.push(row as unknown as SotaSummit);
      },
    });

    // Calculate Haversine distance in JavaScript
    const toRad = (deg: number) => deg * Math.PI / 180;
    const results: SotaSummitWithDistance[] = candidates.map(summit => {
      const dLat = toRad(summit.lat - lat);
      const dLon = toRad(summit.lon - lon);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat)) * Math.cos(toRad(summit.lat)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = 6371 * c; // km

      return { ...summit, distance };
    });

    // Sort by distance and return top N
    results.sort((a, b) => a.distance - b.distance);
    return results.slice(0, limit);
  }

  /**
   * Find a specific summit by reference
   *
   * @param ref Summit reference (e.g., "JA/NS-001")
   * @returns Summit or null if not found
   */
  async findByRef(ref: string): Promise<SotaSummit | null> {
    if (!this.db) {
      await this.init();
    }

    const query = `
      SELECT id, ref, name, lat, lon, altitude, points, activations, bonus, association, region
      FROM summits
      WHERE ref = ?
    `;

    let result: SotaSummit | null = null;

    this.db!.exec({
      sql: query,
      bind: [ref],
      rowMode: 'object',
      callback: (row) => {
        result = row as unknown as SotaSummit;
      },
    });

    return result;
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalSummits: number;
    associations: Array<{ association: string; count: number }>;
  }> {
    if (!this.db) {
      await this.init();
    }

    const totalSummits = this.db!.selectValue('SELECT COUNT(*) FROM summits') as number;

    const associations: Array<{ association: string; count: number }> = [];
    this.db!.exec({
      sql: `
        SELECT association, COUNT(*) as count
        FROM summits
        GROUP BY association
        ORDER BY count DESC
        LIMIT 20
      `,
      rowMode: 'object',
      callback: (row) => {
        associations.push(row as { association: string; count: number });
      },
    });

    return { totalSummits, associations };
  }

  /**
   * Get database metadata (build date, version, etc.)
   */
  async getMetadata(): Promise<{
    buildDate: string | null;
    version: string | null;
    source: string | null;
  }> {
    if (!this.db) {
      await this.init();
    }

    const metadata = {
      buildDate: null as string | null,
      version: null as string | null,
      source: null as string | null,
    };

    try {
      this.db!.exec({
        sql: 'SELECT key, value FROM metadata',
        rowMode: 'object',
        callback: (row) => {
          const { key, value } = row as { key: string; value: string };
          if (key === 'build_date') metadata.buildDate = value;
          if (key === 'sota_version') metadata.version = value;
          if (key === 'source') metadata.source = value;
        },
      });
    } catch {
      console.warn('⚠️  Metadata table not found (older database version)');
    }

    return metadata;
  }

  /**
   * Clear OPFS cache (useful for updates)
   */
  async clearCache(): Promise<void> {
    try {
      if ('storage' in navigator && 'getDirectory' in navigator.storage) {
        const opfsRoot = await navigator.storage.getDirectory();
        await opfsRoot.removeEntry('sota.db');
        console.log('✅ Cleared OPFS cache');
      }
    } catch (error) {
      console.warn('⚠️  Failed to clear OPFS cache:', error);
    }
  }

  /**
   * Get distinct associations for filter dropdown
   * Returns sorted list of association names
   */
  async getAssociations(): Promise<string[]> {
    if (!this.db) {
      await this.init();
    }

    const associations: string[] = [];
    this.db!.exec({
      sql: `
        SELECT DISTINCT association
        FROM summits
        WHERE association IS NOT NULL AND association != ''
        ORDER BY association
      `,
      rowMode: 'object',
      callback: (row) => {
        associations.push((row as { association: string }).association);
      },
    });

    return associations;
  }

  /**
   * Get distinct countries for filter dropdown
   * Returns sorted list of country names extracted from associations
   */
  async getCountries(): Promise<string[]> {
    if (!this.db) {
      await this.init();
    }

    const associations: string[] = [];
    this.db!.exec({
      sql: `
        SELECT DISTINCT association
        FROM summits
        WHERE association IS NOT NULL AND association != ''
        ORDER BY association
      `,
      rowMode: 'object',
      callback: (row) => {
        associations.push((row as { association: string }).association);
      },
    });

    // Extract unique countries from associations
    const countrySet = new Set<string>();
    associations.forEach(association => {
      const country = association.split(' - ')[0].trim();
      countrySet.add(country);
    });

    return Array.from(countrySet).sort();
  }

  /**
   * Get regions for a specific association
   */
  async getRegionsByAssociation(association: string): Promise<string[]> {
    if (!this.db) {
      await this.init();
    }

    const regions: string[] = [];
    this.db!.exec({
      sql: `
        SELECT DISTINCT region
        FROM summits
        WHERE association = ? AND region IS NOT NULL AND region != ''
        ORDER BY region
      `,
      bind: [association],
      rowMode: 'object',
      callback: (row) => {
        regions.push((row as { region: string }).region);
      },
    });

    return regions;
  }

  /**
   * Get min/max values for filter sliders
   */
  async getFilterRanges(): Promise<{
    minAltitude: number;
    maxAltitude: number;
    maxActivations: number;
  }> {
    if (!this.db) {
      await this.init();
    }

    const ranges = this.db!.exec({
      sql: `
        SELECT
          MIN(altitude) as minAltitude,
          MAX(altitude) as maxAltitude,
          MAX(activations) as maxActivations
        FROM summits
      `,
      rowMode: 'object',
      returnValue: 'resultRows',
    });

    return ranges[0] as {
      minAltitude: number;
      maxAltitude: number;
      maxActivations: number;
    };
  }

  /**
   * Advanced filtered search with pagination
   */
  async searchSummits(filters: {
    association?: string;
    region?: string;
    country?: string;
    minAltitude?: number;
    maxAltitude?: number;
    minPoints?: number;
    maxPoints?: number;
    minActivations?: number;
    maxActivations?: number;
    searchText?: string;
    sortBy?: 'name' | 'altitude' | 'points' | 'activations' | 'ref';
    sortOrder?: 'asc' | 'desc';
    offset?: number;
    limit?: number;
  }): Promise<{ summits: SotaSummit[]; total: number }> {
    if (!this.db) {
      await this.init();
    }

    const {
      association,
      region,
      country,
      minAltitude,
      maxAltitude,
      minPoints,
      maxPoints,
      minActivations,
      maxActivations,
      searchText,
      sortBy = 'name',
      sortOrder = 'asc',
      offset = 0,
      limit = 20,
    } = filters;

    // Build WHERE clause dynamically
    const whereClauses: string[] = [];
    const bindings: (string | number)[] = [];

    if (country) {
      // Filter by country: association must start with country name
      whereClauses.push('(association = ? OR association LIKE ?)');
      bindings.push(country, `${country} - %`);
    }

    if (association) {
      whereClauses.push('association = ?');
      bindings.push(association);
    }

    if (region) {
      whereClauses.push('region = ?');
      bindings.push(region);
    }

    if (minAltitude !== undefined) {
      whereClauses.push('altitude >= ?');
      bindings.push(minAltitude);
    }

    if (maxAltitude !== undefined) {
      whereClauses.push('altitude <= ?');
      bindings.push(maxAltitude);
    }

    if (minPoints !== undefined) {
      whereClauses.push('points >= ?');
      bindings.push(minPoints);
    }

    if (maxPoints !== undefined) {
      whereClauses.push('points <= ?');
      bindings.push(maxPoints);
    }

    if (minActivations !== undefined) {
      whereClauses.push('activations >= ?');
      bindings.push(minActivations);
    }

    if (maxActivations !== undefined) {
      whereClauses.push('activations <= ?');
      bindings.push(maxActivations);
    }

    if (searchText && searchText.trim()) {
      whereClauses.push('(ref LIKE ? OR name LIKE ?)');
      const searchPattern = `%${searchText.trim()}%`;
      bindings.push(searchPattern, searchPattern);
    }

    const whereClause = whereClauses.length > 0
      ? `WHERE ${whereClauses.join(' AND ')}`
      : '';

    // Build ORDER BY clause
    const orderByClause = `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

    // Count total results
    const countQuery = `SELECT COUNT(*) as total FROM summits ${whereClause}`;
    const countResult = this.db!.exec({
      sql: countQuery,
      bind: bindings,
      rowMode: 'object',
      returnValue: 'resultRows',
    });
    const total = (countResult[0] as { total: number }).total;

    // Get paginated results
    const query = `
      SELECT
        id, ref, name, lat, lon, altitude, points, activations,
        bonus, association, region
      FROM summits
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    const summits: SotaSummit[] = [];
    this.db!.exec({
      sql: query,
      bind: [...bindings, limit, offset],
      rowMode: 'object',
      callback: (row) => {
        summits.push(row as unknown as SotaSummit);
      },
    });

    return { summits, total };
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<{
    highestSummit: SotaSummit | null;
    lowestSummit: SotaSummit | null;
    mostValuable: SotaSummit[];
    mostActivated: SotaSummit[];
    unactivatedCount: number;
    unactivatedSummits: SotaSummit[];
    countryStats: Array<{ country: string; count: number }>;
    pointsDistribution: Array<{ points: number; count: number }>;
  }> {
    if (!this.db) {
      await this.init();
    }

    // Highest altitude summit
    let highestSummit: SotaSummit | null = null;
    this.db!.exec({
      sql: `
        SELECT id, ref, name, lat, lon, altitude, points, activations, bonus, association, region
        FROM summits
        ORDER BY altitude DESC
        LIMIT 1
      `,
      rowMode: 'object',
      callback: (row) => {
        highestSummit = row as unknown as SotaSummit;
      },
    });

    // Lowest altitude summit
    let lowestSummit: SotaSummit | null = null;
    this.db!.exec({
      sql: `
        SELECT id, ref, name, lat, lon, altitude, points, activations, bonus, association, region
        FROM summits
        ORDER BY altitude ASC
        LIMIT 1
      `,
      rowMode: 'object',
      callback: (row) => {
        lowestSummit = row as unknown as SotaSummit;
      },
    });

    // Most valuable summits (by points)
    const mostValuable: SotaSummit[] = [];
    this.db!.exec({
      sql: `
        SELECT id, ref, name, lat, lon, altitude, points, activations, bonus, association, region
        FROM summits
        ORDER BY points DESC, altitude DESC
        LIMIT 5
      `,
      rowMode: 'object',
      callback: (row) => {
        mostValuable.push(row as unknown as SotaSummit);
      },
    });

    // Most activated summits
    const mostActivated: SotaSummit[] = [];
    this.db!.exec({
      sql: `
        SELECT id, ref, name, lat, lon, altitude, points, activations, bonus, association, region
        FROM summits
        ORDER BY activations DESC
        LIMIT 5
      `,
      rowMode: 'object',
      callback: (row) => {
        mostActivated.push(row as unknown as SotaSummit);
      },
    });

    // Count of unactivated summits
    const unactivatedCount = this.db!.selectValue(
      'SELECT COUNT(*) FROM summits WHERE activations = 0'
    ) as number;

    // Sample of unactivated summits (random 5)
    const unactivatedSummits: SotaSummit[] = [];
    this.db!.exec({
      sql: `
        SELECT id, ref, name, lat, lon, altitude, points, activations, bonus, association, region
        FROM summits
        WHERE activations = 0
        ORDER BY points DESC, altitude DESC
        LIMIT 5
      `,
      rowMode: 'object',
      callback: (row) => {
        unactivatedSummits.push(row as unknown as SotaSummit);
      },
    });

    // Get all associations with counts, then group by country
    const associationsWithCounts: Array<{ association: string; count: number }> = [];
    this.db!.exec({
      sql: `
        SELECT association, COUNT(*) as count
        FROM summits
        GROUP BY association
        ORDER BY count DESC
      `,
      rowMode: 'object',
      callback: (row) => {
        associationsWithCounts.push(row as { association: string; count: number });
      },
    });

    // Group by country (extract country from association name)
    const countryMap = new Map<string, number>();
    associationsWithCounts.forEach(({ association, count }) => {
      // Extract country name (part before " - " if present)
      const country = association.split(' - ')[0].trim();
      countryMap.set(country, (countryMap.get(country) || 0) + count);
    });

    // Convert to array and sort by count
    const countryStats = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Points distribution
    const pointsDistribution: Array<{ points: number; count: number }> = [];
    this.db!.exec({
      sql: `
        SELECT points, COUNT(*) as count
        FROM summits
        GROUP BY points
        ORDER BY points ASC
      `,
      rowMode: 'object',
      callback: (row) => {
        pointsDistribution.push(row as { points: number; count: number });
      },
    });

    return {
      highestSummit,
      lowestSummit,
      mostValuable,
      mostActivated,
      unactivatedCount,
      unactivatedSummits,
      countryStats,
      pointsDistribution,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.sqlite3 = null;
    this.initPromise = null;
  }
}

// Singleton instance
export const sotaDatabase = new SotaDatabase();
