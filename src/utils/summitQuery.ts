/**
 * Pure query-building helpers for the summit database.
 *
 * Kept separate from sotaDatabase.ts so the interesting logic -- which filters
 * become SQL, how the spatial pre-filter is sized -- can be tested without
 * booting SQLite WASM in a browser.
 */

type SummitSortColumn = "name" | "altitude" | "points" | "activations" | "ref";
type SummitSortOrder = "asc" | "desc";

export interface SummitSearchFilters {
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
  sortBy?: SummitSortColumn;
  sortOrder?: SummitSortOrder;
}

export interface SummitSearchQuery {
  whereClause: string;
  bindings: (string | number)[];
  orderByClause: string;
}

const SORT_COLUMNS: readonly SummitSortColumn[] = [
  "name",
  "altitude",
  "points",
  "activations",
  "ref",
];
const SORT_ORDERS: readonly SummitSortOrder[] = ["asc", "desc"];

const DEFAULT_SORT_COLUMN: SummitSortColumn = "name";
const DEFAULT_SORT_ORDER: SummitSortOrder = "asc";

/**
 * ORDER BY cannot use bound parameters, so these two values are interpolated
 * into the statement. Every caller currently validates them, but this is the
 * last point before they reach SQL, so the allowlist belongs here as well.
 */
function safeSortColumn(value: string | undefined): SummitSortColumn {
  return SORT_COLUMNS.includes(value as SummitSortColumn)
    ? (value as SummitSortColumn)
    : DEFAULT_SORT_COLUMN;
}

function safeSortOrder(value: string | undefined): SummitSortOrder {
  return SORT_ORDERS.includes(value as SummitSortOrder)
    ? (value as SummitSortOrder)
    : DEFAULT_SORT_ORDER;
}

export function buildSummitSearchQuery(filters: SummitSearchFilters): SummitSearchQuery {
  const clauses: string[] = [];
  const bindings: (string | number)[] = [];

  const addClause = (clause: string, ...values: (string | number)[]) => {
    clauses.push(clause);
    bindings.push(...values);
  };

  if (filters.country) {
    // Associations are stored either as the bare country or as "Country - Region".
    addClause("(association = ? OR association LIKE ?)", filters.country, `${filters.country} - %`);
  }
  if (filters.association) addClause("association = ?", filters.association);
  if (filters.region) addClause("region = ?", filters.region);

  // Explicit undefined checks: zero is a meaningful bound, especially
  // `maxActivations: 0` for finding unactivated summits.
  if (filters.minAltitude !== undefined) addClause("altitude >= ?", filters.minAltitude);
  if (filters.maxAltitude !== undefined) addClause("altitude <= ?", filters.maxAltitude);
  if (filters.minPoints !== undefined) addClause("points >= ?", filters.minPoints);
  if (filters.maxPoints !== undefined) addClause("points <= ?", filters.maxPoints);
  if (filters.minActivations !== undefined) addClause("activations >= ?", filters.minActivations);
  if (filters.maxActivations !== undefined) addClause("activations <= ?", filters.maxActivations);

  const searchText = filters.searchText?.trim();
  if (searchText) {
    const pattern = `%${searchText}%`;
    addClause("(ref LIKE ? OR name LIKE ?)", pattern, pattern);
  }

  return {
    whereClause: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    bindings,
    orderByClause: `ORDER BY ${safeSortColumn(filters.sortBy)} ${safeSortOrder(
      filters.sortOrder,
    ).toUpperCase()}`,
  };
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

const KM_PER_DEGREE_LATITUDE = 111;

/**
 * Bounding box used to pre-filter candidates via the R*Tree index before exact
 * distances are computed. Longitude degrees shrink towards the poles, so the
 * span is widened by 1/cos(latitude) to keep the box covering the full radius.
 */
export function boundingBox(lat: number, lon: number, radiusKm: number): BoundingBox {
  const latDelta = radiusKm / KM_PER_DEGREE_LATITUDE;
  const lonDelta = radiusKm / (KM_PER_DEGREE_LATITUDE * Math.cos((lat * Math.PI) / 180));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLon: lon - lonDelta,
    maxLon: lon + lonDelta,
  };
}
