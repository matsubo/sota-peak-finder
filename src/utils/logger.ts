/**
 * Development-only logging.
 *
 * Progress chatter (database init, WASM version, download size) is useful while
 * developing and pure noise in a user's console, where it also competes with the
 * genuine errors the E2E console gate watches for. Errors keep using
 * console.error directly so they stay visible in production.
 */
export const logger = {
  debug(...args: unknown[]): void {
    if (import.meta.env.DEV) console.log(...args);
  },
  warn(...args: unknown[]): void {
    if (import.meta.env.DEV) console.warn(...args);
  },
};
