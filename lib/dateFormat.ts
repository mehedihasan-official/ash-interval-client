// Date formatting helpers for the booking flow.
//
// A yyyy-mm-dd string coming from an <input type="date"> is a date-only
// value with no timezone. `new Date("2026-08-15")` parses it as UTC
// midnight, so any timezone west of UTC (e.g. the Americas) shows the
// previous calendar day when the result is rendered as a local date —
// members would pick Aug 15 in the picker and see "Aug 14" on the next
// page. These helpers parse the string as local midnight so the day the
// member picked is the day we display.

/** Parse a yyyy-mm-dd (or ISO-like) string as *local* midnight. */
export const parseIsoDateLocal = (iso: string): Date | null => {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) {
    const fallback = new Date(iso);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Format a yyyy-mm-dd string for display without timezone drift.
 * Returns "-" for anything unparseable so callers don't need a null check.
 */
export const formatIsoDate = (
  iso: string,
  options?: Intl.DateTimeFormatOptions,
): string => {
  const date = parseIsoDateLocal(iso);
  if (!date) return "-";
  return date.toLocaleDateString(undefined, options);
};
