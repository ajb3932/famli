import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Cake,
  Copy,
  Mail,
  MapPin,
  Navigation,
  Pencil,
  Phone,
  StickyNote,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { api } from '../lib/api';
import { useApi, useDocumentTitle } from '../lib/hooks';
import {
  addressLines,
  addressText,
  ageOf,
  formatBirthday,
  fullName,
  preferredName,
  householdInitials,
  mapsUrl,
  safeColor,
} from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { useLocale } from '../context/LocaleContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Avatar, EmptyState, ErrorNotice, stagger } from '../components/ui/misc';
import { HouseholdFormModal } from '../components/households/HouseholdFormModal';
import { MemberFormModal } from '../components/households/MemberFormModal';

export default function HouseholdDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { canEdit, isAdmin } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const { data, error, loading, reload } = useApi(`/households/${encodeURIComponent(id)}`);
  const [editing, setEditing] = useState(false);
  const [memberModal, setMemberModal] = useState({ open: false, member: null });

  // Show what we already know from the list instantly while the full record loads.
  const preview = state?.household?.id === Number(id) ? state.household : null;
  const household = data ?? preview;
  useDocumentTitle(household?.name ?? 'Household');

  if (error && !data) {
    return (
      <>
        <BackLink />
        {error.status === 404 ? (
          <EmptyState
            icon={<MapPin />}
            title="Household not found"
            description="It may have been deleted."
            action={<Button onClick={() => navigate('/')}>Back to households</Button>}
          />
        ) : (
          <ErrorNotice error={error} onRetry={reload} />
        )}
      </>
    );
  }

  if (!household) return <DetailSkeleton />;

  const color = safeColor(household.color_theme);
  const lines = addressLines(household);
  const members = data?.members;

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(addressText(household));
      toast.success('Address copied');
    } catch {
      toast.error('Could not access the clipboard');
    }
  };

  const deleteHousehold = async () => {
    const ok = await confirm({
      title: `Delete ${household.name}?`,
      message: `This permanently removes the household and all ${members?.length ?? 0} of its members.`,
      confirmLabel: 'Delete household',
    });
    if (!ok) return;
    try {
      await api.delete(`/households/${household.id}`);
      toast.success(`${household.name} deleted`);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deleteMember = async (member) => {
    const ok = await confirm({
      title: `Remove ${member.first_name}?`,
      message: `${fullName(member)} will be removed from ${household.name}.`,
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    try {
      await api.delete(`/households/${household.id}/members/${member.id}`);
      toast.success(`${preferredName(member)} removed`);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <BackLink />

      {/* Hero */}
      <section className="glass relative mb-6 overflow-hidden rounded-[28px]">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-32 opacity-90 dark:opacity-70"
          style={{
            background: `radial-gradient(120% 140% at 0% 0%, ${color}66, transparent 60%), radial-gradient(90% 120% at 100% 0%, ${color}33, transparent 60%)`,
          }}
        />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-wrap items-start gap-5">
            <Avatar
              label={householdInitials(household.name)}
              color={color}
              size="xl"
              className="rounded-3xl! shadow-lg"
            />
            <div className="min-w-0 flex-1 pt-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                {household.name}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm whitespace-nowrap text-slate-500 dark:text-slate-400">
                <Users className="size-4" />
                {members ? `${members.length} ${members.length === 1 ? 'member' : 'members'}` : '…'}
              </p>
            </div>
            {canEdit && (
              // Full-width row under the name on phones so the name gets the space.
              <div className="flex w-full gap-2 sm:w-auto">
                <Button variant="secondary" onClick={() => setEditing(true)} disabled={!data} className="flex-1 sm:flex-none">
                  <Pencil /> Edit
                </Button>
                {isAdmin && (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={deleteHousehold}
                    disabled={!data}
                    aria-label="Delete household"
                    className="text-coral-600! dark:text-coral-400!"
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white/50 p-4 ring-1 ring-slate-900/5 dark:bg-white/4 dark:ring-white/6">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                <MapPin className="size-3.5" /> Address
              </div>
              {lines.length ? (
                <>
                  <address className="leading-relaxed text-slate-700 not-italic dark:text-slate-200">
                    {lines.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </address>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={copyAddress}>
                      <Copy /> Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(mapsUrl(household), '_blank', 'noopener,noreferrer')}
                    >
                      <Navigation /> Map
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400 italic">No address saved</p>
              )}
            </div>

            <div className="rounded-2xl bg-white/50 p-4 ring-1 ring-slate-900/5 dark:bg-white/4 dark:ring-white/6">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                <StickyNote className="size-3.5" /> Notes
              </div>
              {household.notes ? (
                <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-200">
                  {household.notes}
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic">No notes</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Members */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Members</h2>
        {canEdit && data && (
          <Button size="sm" onClick={() => setMemberModal({ open: true, member: null })}>
            <UserPlus /> Add member
          </Button>
        )}
      </div>

      {loading && !members ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="glass skeleton h-36 rounded-3xl" />
          ))}
        </div>
      ) : members?.length === 0 ? (
        <EmptyState
          icon={<UserPlus />}
          title="No members yet"
          description="Add the people who live here — birthdays, emails and phone numbers too."
          action={
            canEdit && (
              <Button onClick={() => setMemberModal({ open: true, member: null })}>
                <UserPlus /> Add first member
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {members?.map((m, i) => (
            <MemberCard
              key={m.id}
              member={m}
              color={color}
              index={i}
              canEdit={canEdit}
              onEdit={() => setMemberModal({ open: true, member: m })}
              onDelete={() => deleteMember(m)}
            />
          ))}
        </div>
      )}

      {canEdit && data && (
        <>
          <HouseholdFormModal open={editing} onClose={() => setEditing(false)} household={data} onSaved={reload} />
          <MemberFormModal
            open={memberModal.open}
            member={memberModal.member}
            household={data}
            onClose={() => setMemberModal((s) => ({ ...s, open: false }))}
            onSaved={reload}
          />
        </>
      )}
    </>
  );
}

function MemberCard({ member, color, index, canEdit, onEdit, onDelete }) {
  const { locale } = useLocale();
  const age = ageOf(member.birthday);
  const contact =
    'flex min-w-0 items-center gap-2.5 rounded-xl px-2 py-1.5 -mx-2 text-sm text-slate-600 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/6 dark:hover:text-white';

  return (
    <article style={stagger(index)} className="glass group animate-fade-up rounded-3xl p-5">
      <div className="flex items-start gap-4">
        <Avatar first={member.first_name} last={member.last_name} color={color} size="lg" />
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            {fullName(member)}
          </h3>
          {member.nickname && (
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
              Goes by <span className="font-medium text-slate-700 dark:text-slate-200">{member.nickname}</span>
            </p>
          )}
        </div>
        {canEdit && (
          <div className="flex gap-0.5 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
            <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Edit ${member.first_name}`}>
              <Pencil />
            </Button>
            <Button variant="danger-ghost" size="icon-sm" onClick={onDelete} aria-label={`Remove ${member.first_name}`}>
              <Trash2 />
            </Button>
          </div>
        )}
      </div>

      {(member.birthday || member.email || member.phone) && (
        <div className="mt-4 space-y-0.5">
          {member.birthday && (
            <div className={`${contact} pointer-events-none`}>
              <Cake className="size-4 shrink-0 text-coral-500" />
              <span className="truncate">
                {formatBirthday(member.birthday, locale)}
                {age !== null && <span className="text-slate-400"> · {age}</span>}
              </span>
            </div>
          )}
          {member.email && (
            <a href={`mailto:${member.email}`} className={contact}>
              <Mail className="size-4 shrink-0 text-brand-500" />
              <span className="truncate">{member.email}</span>
            </a>
          )}
          {member.phone && (
            <a href={`tel:${member.phone.replace(/[^\d+]/g, '')}`} className={contact}>
              <Phone className="size-4 shrink-0 text-emerald-500" />
              <span className="truncate">{member.phone}</span>
            </a>
          )}
        </div>
      )}

      {member.notes && (
        <p className="mt-3 rounded-xl bg-slate-900/3 px-3 py-2 text-sm whitespace-pre-line text-slate-500 dark:bg-white/4 dark:text-slate-400">
          {member.notes}
        </p>
      )}
    </article>
  );
}

function BackLink() {
  return (
    <Link
      to="/"
      className="group mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
    >
      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> Households
    </Link>
  );
}

function DetailSkeleton() {
  return (
    <>
      <BackLink />
      <div className="glass mb-6 rounded-[28px] p-8">
        <div className="flex gap-5">
          <div className="skeleton size-20 rounded-3xl" />
          <div className="flex-1 space-y-3 pt-2">
            <div className="skeleton h-8 w-1/2 rounded-lg" />
            <div className="skeleton h-4 w-24 rounded-lg" />
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      </div>
    </>
  );
}
