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
      this.sqlite3 = await sqlite3InitModule({
        print: console.log,
        printErr: console.error,
      });

      console.log('✅ SQLite WASM initialized (version:', this.sqlite3.version.libVersion, ')');

      // Try to load from OPFS (Origin Private File System) first
      let dbData: Uint8Array | null = null;

      try {
        if ('storage' in navigator && 'getDirectory' in navigator.storage) {
          const opfsRoot = await navigator.storage.getDirectory();
          const fileHandle = await opfsRoot.getFileHandle('sota.db', { create: false });
          const file = await fileHandle.getFile();
          const arrayBuffer = await file.arrayBuffer();
          dbData = new Uint8Array(arrayBuffer);
          console.log('✅ Loaded database from OPFS cache');
        } else {
          throw new Error('OPFS not supported');
        }
      } catch {
        console.log('📥 OPFS cache miss, downloading database...');

        // Download from network
        const basePath = import.meta.env.BASE_URL || '/';
        const response = await fetch(`${basePath}data/sota.db`);
        if (!response.ok) {
          throw new Error(`Failed to fetch database: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        dbData = new Uint8Array(arrayBuffer);

        console.log(`✅ Downloaded database (${(dbData.length / 1024 / 1024).toFixed(2)} MB)`);

        // Cache in OPFS for next time
        try {
          if ('storage' in navigator && 'getDirectory' in navigator.storage) {
            const opfsRoot = await navigator.storage.getDirectory();
            const fileHandle = await opfsRoot.getFileHandle('sota.db', { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(dbData);
            await writable.close();
            console.log('✅ Cached database in OPFS');
          }
        } catch (cacheError) {
          console.warn('⚠️  Failed to cache in OPFS:', cacheError);
        }
      }

      // Create in-memory database and load data
      this.db = new this.sqlite3.oo1.DB(':memory:');

      // Load database from Uint8Array
      const ptrSource = this.sqlite3.wasm.allocFromTypedArray(dbData);
      const rc = this.sqlite3.capi.sqlite3_deserialize(
        this.db.pointer,
        'main',
        ptrSource,
        dbData.length,
        dbData.length,
        this.sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE
      );

      if (rc !== 0) {
        throw new Error(`Failed to deserialize database (error code: ${rc})`);
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

    // Query using R*Tree spatial index
    const query = `
      SELECT
        s.id, s.ref, s.name, s.lat, s.lon, s.altitude,
        s.points, s.activations, s.bonus, s.association, s.region,
        (6371 * acos(
          cos(radians(?)) * cos(radians(s.lat)) * cos(radians(s.lon) - radians(?)) +
          sin(radians(?)) * sin(radians(s.lat))
        )) AS distance
      FROM summits s
      JOIN summits_idx i ON s.id = i.id
      WHERE i.minLat <= ? AND i.maxLat >= ?
        AND i.minLon <= ? AND i.maxLon >= ?
      ORDER BY distance
      LIMIT ?
    `;

    const results: SotaSummitWithDistance[] = [];

    this.db!.exec({
      sql: query,
      bind: [lat, lon, lat, maxLat, minLat, maxLon, minLon, limit],
      rowMode: 'object',
      callback: (row) => {
        results.push(row as SotaSummitWithDistance);
      },
    });

    return results;
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
        result = row as SotaSummit;
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
