/**
 * Convert a SOTA reference (e.g. "JA/NS-001") to a URL slug (e.g. "ja-ns-001")
 */
export function summitRefToSlug(ref: string): string {
  return ref.toLowerCase().replace(/\//g, "-");
}

/**
 * Build a summit page path from a SOTA reference
 */
export function summitPath(ref: string): string {
  return `/summit/${summitRefToSlug(ref)}`;
}
