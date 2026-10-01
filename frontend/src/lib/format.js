export const HOUSEHOLD_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Green', value: '#10b981' },
  { name: 'Sage', value: '#5f8d6b' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Slate', value: '#64748b' },
];

export const DEFAULT_COLOR = HOUSEHOLD_COLORS[0].value;

/** Rows created before 2.0 weren't validated, so never trust a colour blindly. */
export function safeColor(value, fallback = '#64748b') {
  return /^#[0-9a-f]{6}$/i.test(value ?? '') ? value : fallback;
}

export function initials(first, last) {
  const a = first?.trim()?.[0] ?? '';
  const b = last?.trim()?.[0] ?? '';
  return (a + b).toUpperCase() || '?';
}

export function fullName(person) {
  return [person.first_name, person.last_name].filter(Boolean).join(' ');
}

/** The name someone likes to be called: their nickname if they have one. */
export function preferredName(person) {
  return person.nickname?.trim() || person.first_name;
}

export function householdInitials(name = '') {
  const words = name
    .replace(/^the\s+/i, '')
    .split(/\s+/)
    .filter((w) => /^[\p{L}\p{N}]/u.test(w));
  return initials(words[0], words[1]);
}

export function addressLines(h) {
  const locality = [h.city, h.state].filter(Boolean).join(', ');
  return [h.address_line1, h.address_line2, [locality, h.postal_code].filter(Boolean).join(' '), h.country].filter(
    Boolean
  );
}

export function addressText(h, { includeName = true } = {}) {
  return [includeName ? h.name : null, ...addressLines(h)].filter(Boolean).join('\n');
}

export function shortLocation(h) {
  return [h.city, h.state].filter(Boolean).join(', ') || h.postal_code || '';
}

// Birthdays are stored as YYYY-MM-DD; treat them as calendar dates (UTC) so
// they never shift a day because of the viewer's time zone.
function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatBirthday(iso, locale, { withYear = true } = {}) {
  if (!iso) return '';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    ...(withYear && { year: 'numeric' }),
    timeZone: 'UTC',
  }).format(parseDate(iso));
}

export function ageOf(iso) {
  if (!iso) return null;
  const birth = parseDate(iso);
  const now = new Date();
  let age = now.getFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getUTCMonth() ||
    (now.getMonth() === birth.getUTCMonth() && now.getDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 150 ? age : null;
}

export function daysLabel(days) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

// Audit timestamps are SQLite "YYYY-MM-DD HH:MM:SS" in UTC.
export function parseSqliteDate(value) {
  if (!value) return null;
  return new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
}

const UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

export function relativeTime(date, locale) {
  if (!date) return '';
  const seconds = (date.getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(0, 'minute');
}

export function formatDate(date, locale) {
  if (!date) return '';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export function formatDateTime(date, locale) {
  if (!date) return '';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function mapsUrl(h) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLines(h).join(', '))}`;
}
