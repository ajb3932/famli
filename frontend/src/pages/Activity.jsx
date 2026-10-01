import { useSearchParams } from 'react-router';
import { History, KeyRound, LogIn, Pencil, Plus, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';
import { useApi, useDocumentTitle } from '../lib/hooks';
import { formatDateTime, parseSqliteDate, relativeTime } from '../lib/format';
import { useLocale } from '../context/LocaleContext';
import { EmptyState, ErrorNotice, PageHeader, Pagination, stagger } from '../components/ui/misc';

const ACTIONS = {
  CREATE: { icon: Plus, tone: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300', verb: 'added' },
  UPDATE: { icon: Pencil, tone: 'bg-brand-500/12 text-brand-600 dark:text-brand-300', verb: 'updated' },
  DELETE: { icon: Trash2, tone: 'bg-coral-500/12 text-coral-600 dark:text-coral-300', verb: 'deleted' },
  LOGIN: { icon: LogIn, tone: 'bg-slate-500/12 text-slate-600 dark:text-slate-300', verb: 'signed in' },
  LOGIN_FAILED: { icon: ShieldAlert, tone: 'bg-amber-500/14 text-amber-700 dark:text-amber-300', verb: 'failed sign-in' },
  PASSWORD_CHANGE: { icon: KeyRound, tone: 'bg-brand-500/12 text-brand-600 dark:text-brand-300', verb: 'changed their password' },
  SETUP: { icon: Sparkles, tone: 'bg-butter-300/50 text-amber-700 dark:text-amber-300', verb: 'set up Famli' },
};

const ENTITY = { household: 'household', household_member: 'member', user: 'user' };

function describe(log) {
  const d = log.details ?? {};
  const who = log.username ?? (log.action === 'LOGIN_FAILED' ? 'Someone' : 'A deleted user');
  const action = ACTIONS[log.action];
  switch (log.action) {
    case 'LOGIN':
    case 'PASSWORD_CHANGE':
    case 'SETUP':
      return { who, text: action.verb };
    case 'LOGIN_FAILED':
      return { who, text: `failed to sign in${d.username ? ` as “${d.username}”` : ''}` };
    default: {
      const name =
        d.name ?? d.username ?? ([d.first_name, d.last_name].filter(Boolean).join(' ') || `#${log.entity_id}`);
      return { who, text: `${action?.verb ?? log.action.toLowerCase()} ${ENTITY[log.entity_type] ?? log.entity_type}`, target: name };
    }
  }
}

export default function Activity() {
  useDocumentTitle('Activity');
  const { locale } = useLocale();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const { data, error, loading, reload } = useApi(`/users/audit/log?page=${page}&limit=50`);
  const logs = data?.logs ?? [];

  return (
    <>
      <PageHeader title="Activity" subtitle="A record of changes and sign-ins" />
      <ErrorNotice error={error} onRetry={reload} />

      {loading && !data ? (
        <div className="glass skeleton h-96 rounded-3xl" />
      ) : logs.length === 0 ? (
        <EmptyState icon={<History />} title="Nothing yet" description="Changes will show up here as they happen." />
      ) : (
        <ol className={`glass relative rounded-3xl p-3 transition-opacity sm:p-5 ${loading ? 'opacity-60' : ''}`}>
          {logs.map((log, i) => {
            const action = ACTIONS[log.action] ?? ACTIONS.UPDATE;
            const { who, text, target } = describe(log);
            const date = parseSqliteDate(log.created_at);
            return (
              <li key={log.id} style={stagger(i, 20, 25)} className="relative flex animate-fade-up gap-4 py-2.5 pl-1">
                {i < logs.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute top-12 bottom-0 left-[1.3rem] w-px bg-slate-900/8 dark:bg-white/8"
                  />
                )}
                <span className={`relative grid size-9 shrink-0 place-items-center rounded-xl ${action.tone}`}>
                  <action.icon className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1 pt-1.5">
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    <span className="font-semibold text-slate-900 dark:text-white">{who}</span> {text}
                    {target && <span className="font-medium text-slate-900 dark:text-white"> {target}</span>}
                  </p>
                  <time
                    dateTime={date?.toISOString()}
                    title={formatDateTime(date, locale)}
                    className="text-xs text-slate-400"
                  >
                    {relativeTime(date, locale)}
                  </time>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <Pagination
        pagination={data?.pagination}
        onPage={(p) => {
          setParams({ page: String(p) });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </>
  );
}
