const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Today as a YYYY-MM-DD key in the viewer's own timezone. Both apps compare
// event dates lexically against this, which is why the key is built from the
// local calendar parts rather than from an ISO timestamp (toISOString would
// shift the day for anyone west of UTC).
export function localDateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// The single definition of "this date has passed", shared so the app's Past
// events list and the dashboard's Archived Events page can never disagree.
// Anything unparseable — "Date TBD", null — is not past: an undated event has
// not happened yet as far as anyone knows.
export function isPastDateKey(value, todayKey = localDateKey()) {
  const key = String(value ?? '');
  return ISO_DATE_PATTERN.test(key) && key < todayKey;
}

export function formatDate(value, options = {}) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: (options.includeYear ?? true) ? 'numeric' : undefined,
    ...options,
  }).format(date);
}
