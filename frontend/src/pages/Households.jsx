import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router';
import { House, Plus, SearchX } from 'lucide-react';
import { query } from '../lib/api';
import { useApi, useDebounced, useDocumentTitle } from '../lib/hooks';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorNotice, PageHeader, Pagination, SearchInput } from '../components/ui/misc';
import { HouseholdCard, HouseholdCardSkeleton } from '../components/households/HouseholdCard';
import { HouseholdFormModal } from '../components/households/HouseholdFormModal';
import { BirthdayStrip } from '../components/households/BirthdayStrip';

export default function Households() {
  useDocumentTitle('Households');
  const { canEdit } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [creating, setCreating] = useState(false);
  const page = Number(params.get('page')) || 1;
  const q = useDebounced(search.trim());

  const { data, error, loading, reload } = useApi(`/households${query({ search: q, page, limit: 24 })}`);
  const households = data?.households ?? [];
  const total = data?.pagination.total ?? 0;

  const updateSearch = (value) => {
    setSearch(value);
    setParams(value.trim() ? { q: value.trim() } : {}, { replace: true });
  };

  const goToPage = (p) => {
    setParams({ ...(q && { q }), page: String(p) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <PageHeader
        title="Households"
        subtitle={data ? `${total} ${total === 1 ? 'household' : 'households'}${q ? ` matching “${q}”` : ''}` : ' '}
        actions={
          canEdit && (
            <Button onClick={() => setCreating(true)} className="max-sm:hidden">
              <Plus /> New household
            </Button>
          )
        }
      />

      <SearchInput
        value={search}
        onChange={updateSearch}
        placeholder="Search households, towns or people…"
        className="mb-8 max-w-xl"
      />

      {!q && page === 1 && <BirthdayStrip />}

      <ErrorNotice error={error} onRetry={reload} />

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <HouseholdCardSkeleton key={i} />
          ))}
        </div>
      ) : households.length === 0 && data ? (
        q ? (
          <EmptyState
            icon={<SearchX />}
            title="No matches"
            description={`Nothing found for “${q}”. Try a different name or postcode.`}
          />
        ) : (
          <EmptyState
            icon={<House />}
            title="No households yet"
            description="Add your first household to start building your family address book."
            action={
              canEdit && (
                <Button onClick={() => setCreating(true)}>
                  <Plus /> Add a household
                </Button>
              )
            }
          />
        )
      ) : (
        <div
          className={`grid gap-4 transition-opacity duration-300 sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`}
        >
          {households.map((h, i) => (
            <HouseholdCard key={h.id} household={h} index={i} />
          ))}
        </div>
      )}

      <Pagination pagination={data?.pagination} onPage={goToPage} />

      {canEdit && (
        <>
          {/* Floating action button on phones (portalled: the page wrapper's
              entrance transform would otherwise anchor position:fixed to it) */}
          {createPortal(
            <button
              onClick={() => setCreating(true)}
              aria-label="New household"
              className="fixed right-5 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-30 grid size-14 animate-scale-in place-items-center rounded-2xl bg-linear-to-br from-brand-400 to-brand-600 text-white shadow-xl shadow-brand-600/35 transition active:scale-90 sm:hidden"
            >
              <Plus className="size-6" />
            </button>,
            document.body
          )}
          <HouseholdFormModal
            open={creating}
            onClose={() => setCreating(false)}
            onSaved={(h) => navigate(`/households/${h.id}`, { state: { household: h } })}
          />
        </>
      )}
    </>
  );
}
