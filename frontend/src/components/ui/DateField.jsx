import { useEffect, useMemo, useState } from 'react';
import { Field } from './Field';

// Splits a YYYY-MM-DD string into its parts ('' when missing).
function split(value) {
  const [y = '', m = '', d = ''] = (value || '').split('-');
  return { year: y, month: m ? String(Number(m)) : '', day: d ? String(Number(d)) : '' };
}

/**
 * Day / month / year picker ordered for the active locale (e.g. 31 December
 * 2000 for en-GB, December 31 2000 for en-US). Native date inputs follow the
 * browser's language instead, which is why this exists.
 */
export function DateField({ label, value, onChange, locale, error, hint, className }) {
  const [parts, setParts] = useState(() => split(value));

  // Re-sync when the form is reset or a different member is loaded.
  useEffect(() => {
    setParts(split(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const order = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' })
        .formatToParts(new Date(2000, 11, 31))
        .map((p) => p.type)
        .filter((t) => t === 'day' || t === 'month' || t === 'year'),
    [locale]
  );

  const months = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' });
    return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(Date.UTC(2000, i, 1))));
  }, [locale]);

  const update = (key, v) => {
    const next = { ...parts, [key]: v };
    setParts(next);
    if (!next.day && !next.month && !next.year) {
      onChange('');
    } else {
      // Incomplete dates are passed through as-is so the server reports them.
      const pad = (n) => (n ? String(n).padStart(2, '0') : '');
      onChange(`${next.year}-${pad(next.month)}-${pad(next.day)}`);
    }
  };

  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(p) => {
        const controls = {
          day: (
            <select
              key="day"
              aria-label="Day"
              value={parts.day}
              onChange={(e) => update('day', e.target.value)}
              className={`${p.className} appearance-none px-3 text-center`}
            >
              <option value="">Day</option>
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {i + 1}
                </option>
              ))}
            </select>
          ),
          month: (
            <select
              key="month"
              aria-label="Month"
              value={parts.month}
              onChange={(e) => update('month', e.target.value)}
              className={`${p.className} appearance-none px-3`}
            >
              <option value="">Month</option>
              {months.map((name, i) => (
                <option key={name} value={String(i + 1)}>
                  {name}
                </option>
              ))}
            </select>
          ),
          year: (
            <input
              key="year"
              aria-label="Year"
              type="text"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              placeholder="Year"
              value={parts.year}
              onChange={(e) => update('year', e.target.value.replace(/\D/g, ''))}
              className={`${p.className} px-3 text-center`}
            />
          ),
        };
        const cols = { day: '5rem', month: 'minmax(0,1fr)', year: '5.5rem' };
        return (
          <div
            id={p.id}
            role="group"
            aria-describedby={p['aria-describedby']}
            aria-invalid={p['aria-invalid']}
            className="grid gap-2"
            style={{ gridTemplateColumns: order.map((t) => cols[t]).join(' ') }}
          >
            {order.map((t) => controls[t])}
          </div>
        );
      }}
    </Field>
  );
}
