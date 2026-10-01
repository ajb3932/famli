import { Link } from 'react-router';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { householdInitials, safeColor, shortLocation } from '../../lib/format';
import { Avatar, stagger } from '../ui/misc';

export function HouseholdCard({ household, index }) {
  const color = safeColor(household.color_theme);
  const location = shortLocation(household);
  const extra = household.member_count - household.members_preview.length;

  return (
    <Link
      to={`/households/${household.id}`}
      state={{ household }}
      style={stagger(index)}
      className="glass group relative flex animate-fade-up flex-col overflow-hidden rounded-3xl p-5 transition-all duration-300 ease-[var(--ease-spring)] hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/10 focus-visible:-translate-y-1 dark:hover:shadow-black/40"
    >
      {/* Colour glow in the household's theme */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-55 dark:opacity-25 dark:group-hover:opacity-45"
        style={{ backgroundColor: color }}
      />

      <div className="relative flex items-start gap-4">
        <Avatar
          label={householdInitials(household.name)}
          color={color}
          size="lg"
          className="rounded-2xl! transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-105 group-hover:-rotate-3"
        />
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            {household.name}
          </h3>
          {location ? (
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-slate-500 dark:text-slate-400">
              <MapPin className="size-3.5 shrink-0" /> {location}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-slate-400 italic dark:text-slate-500">No address yet</p>
          )}
        </div>
        <ArrowUpRight className="size-5 shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-slate-600 dark:text-slate-600 dark:group-hover:text-slate-300" />
      </div>

      <div className="relative mt-5 flex items-center justify-between">
        <div className="flex -space-x-2">
          {household.members_preview.map((m, i) => (
            <Avatar key={i} first={m.first_name} last={m.last_name} color={color} size="sm" />
          ))}
          {extra > 0 && (
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 ring-2 ring-white/80 dark:bg-slate-700 dark:text-slate-200 dark:ring-white/10">
              +{extra}
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {household.member_count === 0
            ? 'No members'
            : `${household.member_count} ${household.member_count === 1 ? 'member' : 'members'}`}
        </span>
      </div>
    </Link>
  );
}

export function HouseholdCardSkeleton() {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="flex items-start gap-4">
        <div className="skeleton size-14 rounded-2xl" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="skeleton h-5 w-2/3 rounded-lg" />
          <div className="skeleton h-4 w-1/3 rounded-lg" />
        </div>
      </div>
      <div className="mt-5 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton size-9 rounded-full" />
        ))}
      </div>
    </div>
  );
}
