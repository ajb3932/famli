import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ChevronRight, Mail, Phone, SearchX, Users } from 'lucide-react';
import { query } from '../lib/api';
import { useApi, useDebounced, useDocumentTitle } from '../lib/hooks';
import { fullName } from '../lib/format';
import { Segmented } from '../components/ui/Field';
import { Avatar, EmptyState, ErrorNotice, PageHeader, Pagination, SearchInput, stagger } from '../components/ui/misc';

const SORTS = [
  { value: 'first_name', label: 'First name' },
  { value: 'last_name', label: 'Last name' },
];

export default function People() {
  useDocumentTitle('People');
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const sortBy = params.get('sort') === 'last_name' ? 'last_name' : 'first_name';
  const page = Number(params.get('page')) || 1;
  const q = useDebounced(search.trim());

  const { data, error, loading, reload } = useApi(`/people${query({ search: q, sortBy, page, limit: 100 })}`);
  const people = data?.people ?? [];
  const total = data?.pagination.total ?? 0;

  const setParam = (updates, options) => {
    const next = { q: q || undefined, sort: sortBy === 'last_name' ? 'last_name' : undefined, ...updates };
    setParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v)), options);
  };

  // Group into A–Z sections by the active sort key.
  const groups = useMemo(() => {
    const map = new Map();
    for (const person of people) {
      const key = (person[sortBy] || person.first_name || '#').trim().charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(key) ? key : '#';
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter).push(person);
    }
    return [...map.entries()];
  }, [people, sortBy]);

  let index = 0;

  return (
    <>
      <PageHeader
        title="People"
        subtitle={data ? `${total} ${total === 1 ? 'person' : 'people'} across all households` : ' '}
      />

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setParam({ q: v.trim() || undefined, page: undefined }, { replace: true });
          }}
          placeholder="Search people, emails or households…"
          className="flex-1 sm:max-w-xl"
        />
        <Segmented
          label="Sort by"
          options={SORTS}
          value={sortBy}
          onChange={(v) => setParam({ sort: v === 'last_name' ? v : undefined, page: undefined }, { replace: true })}
          className="self-start sm:self-auto"
        />
      </div>

      <ErrorNotice error={error} onRetry={reload} />

      {loading && !data ? (
        <div className="glass space-y-1 rounded-3xl p-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 p-2">
              <div className="skeleton size-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : people.length === 0 && data ? (
        <EmptyState
          icon={q ? <SearchX /> : <Users />}
          title={q ? 'No matches' : 'No people yet'}
          description={q ? `Nobody matches “${q}”.` : 'People appear here once you add members to a household.'}
        />
      ) : (
        <div className={`space-y-6 transition-opacity duration-300 ${loading ? 'opacity-60' : ''}`}>
          {groups.map(([letter, list]) => (
            <section key={letter} aria-label={letter}>
              <h2 className="sticky top-[calc(env(safe-area-inset-top)+5.5rem)] z-10 mb-2 ml-3 inline-grid size-8 place-items-center rounded-lg bg-white/80 text-sm font-bold text-brand-600 shadow-sm ring-1 ring-slate-900/5 backdrop-blur dark:bg-slate-800/80 dark:text-brand-300 dark:ring-white/10">
                {letter}
              </h2>
              <ul className="glass divide-y divide-slate-900/5 overflow-hidden rounded-3xl dark:divide-white/5">
                {list.map((person) => (
                  <li key={person.id} style={stagger(index++, 25, 20)} className="animate-fade-up">
                    <div
                      role="link"
                      tabIndex={0}
                      onClick={() => navigate(`/households/${person.household_id}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/households/${person.household_id}`)}
                      className="group flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-white/50 dark:hover:bg-white/4"
                    >
                      <Avatar first={person.first_name} last={person.last_name} color={person.color_theme} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                          {sortBy === 'last_name' && person.last_name
                            ? `${person.last_name}, ${person.first_name}`
                            : fullName(person)}
                        </p>
                        <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                          {person.household_name}
                          {person.role && <span className="text-slate-400 dark:text-slate-500"> · {person.role}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {person.email && (
                          <a
                            href={`mailto:${person.email}`}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Email ${person.first_name}`}
                            className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-300"
                          >
                            <Mail className="size-4.5" />
                          </a>
                        )}
                        {person.phone && (
                          <a
                            href={`tel:${person.phone.replace(/[^\d+]/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Call ${person.first_name}`}
                            className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-300"
                          >
                            <Phone className="size-4.5" />
                          </a>
                        )}
                        <ChevronRight className="ml-1 size-5 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Pagination
        pagination={data?.pagination}
        onPage={(p) => {
          setParam({ page: String(p) });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </>
  );
}
