import { Link } from 'react-router';
import { Cake, PartyPopper } from 'lucide-react';
import { useApi } from '../../lib/hooks';
import { daysLabel, formatBirthday, preferredName } from '../../lib/format';
import { useLocale } from '../../context/LocaleContext';
import { Avatar, stagger } from '../ui/misc';

export function BirthdayStrip() {
  const { locale } = useLocale();
  const { data } = useApi('/people/birthdays?days=30');
  const people = data?.people ?? [];
  if (!people.length) return null;

  return (
    <section className="mb-8 animate-fade-up" aria-labelledby="birthdays-heading">
      <h2
        id="birthdays-heading"
        className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
      >
        <Cake className="size-4 text-coral-500" /> Upcoming birthdays
      </h2>
      <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        {people.map((p, i) => {
          const today = p.days_until === 0;
          return (
            <Link
              key={p.id}
              to={`/households/${p.household_id}`}
              style={stagger(i, 60)}
              className={`glass flex shrink-0 animate-fade-up snap-start items-center gap-3 rounded-2xl py-2.5 pr-4 pl-2.5 transition hover:-translate-y-0.5 ${
                today ? 'ring-2 ring-coral-400/60' : ''
              }`}
            >
              <Avatar first={p.first_name} last={p.last_name} color={p.color_theme} size="sm" />
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {preferredName(p)} {p.last_name}
                </p>
                <p
                  className={`flex items-center gap-1 text-xs ${today ? 'font-semibold text-coral-600 dark:text-coral-400' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  {today && <PartyPopper className="size-3.5" />}
                  {daysLabel(p.days_until)} · {formatBirthday(p.birthday, locale, { withYear: false })}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
