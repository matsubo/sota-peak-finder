/**
 * Format a date string as "Jan 1, 2026" using the given locale
 */
export function formatDateShort(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}
