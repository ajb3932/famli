import { useEffect, useState } from 'react';
import { Eye, Pencil, ShieldCheck, SquarePen, Trash2, UserPlus } from 'lucide-react';
import { api } from '../lib/api';
import { useApi, useDocumentTitle } from '../lib/hooks';
import { fieldErrors } from '../lib/forms';
import { formatDate, parseSqliteDate } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { useLocale } from '../context/LocaleContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { PasswordField, TextField } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { Avatar, Badge, ErrorNotice, PageHeader, stagger } from '../components/ui/misc';
import { PasswordStrength } from '../components/auth/PasswordStrength';

const ROLES = [
  { value: 'viewer', label: 'Viewer', icon: Eye, tone: 'slate', description: 'Can look up households and people' },
  { value: 'editor', label: 'Editor', icon: SquarePen, tone: 'sage', description: 'Can add and edit households and members' },
  { value: 'admin', label: 'Admin', icon: ShieldCheck, tone: 'brand', description: 'Full access, including users and activity' },
];
const ROLE = Object.fromEntries(ROLES.map((r) => [r.value, r]));

export default function UsersPage() {
  useDocumentTitle('Users');
  const { user: me, refresh } = useAuth();
  const { locale } = useLocale();
  const confirm = useConfirm();
  const toast = useToast();
  const { data: users, error, loading, reload } = useApi('/users');
  const [modal, setModal] = useState({ open: false, user: null });

  const remove = async (user) => {
    const ok = await confirm({
      title: `Delete ${user.username}?`,
      message: 'They will be signed out immediately and lose access to Famli.',
      confirmLabel: 'Delete user',
    });
    if (!ok) return;
    try {
      await api.delete(`/users/${user.id}`);
      toast.success(`${user.username} deleted`);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Who can access Famli, and what they can do"
        actions={
          <Button onClick={() => setModal({ open: true, user: null })}>
            <UserPlus /> Add user
          </Button>
        }
      />

      <ErrorNotice error={error} onRetry={reload} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && !users
          ? [0, 1, 2].map((i) => <div key={i} className="glass skeleton h-40 rounded-3xl" />)
          : users?.map((u, i) => {
              const role = ROLE[u.role] ?? ROLE.viewer;
              const isMe = u.id === me.id;
              return (
                <article key={u.id} style={stagger(i)} className="glass group animate-fade-up rounded-3xl p-5">
                  <div className="flex items-start gap-4">
                    <Avatar label={u.username.slice(0, 2).toUpperCase()} color="#5b8a9a" size="lg" />
                    <div className="min-w-0 flex-1 pt-0.5">
                      <h3 className="flex items-center gap-2 truncate font-semibold text-slate-900 dark:text-white">
                        <span className="truncate">{u.username}</span>
                        {isMe && <Badge tone="amber">You</Badge>}
                      </h3>
                      <p className="truncate text-sm text-slate-500 dark:text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Badge tone={role.tone}>
                      <role.icon className="size-3.5" /> {role.label}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      Joined {formatDate(parseSqliteDate(u.created_at), locale)}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2 border-t border-slate-900/5 pt-4 dark:border-white/6">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => setModal({ open: true, user: u })}>
                      <Pencil /> Edit
                    </Button>
                    {!isMe && (
                      <Button size="sm" variant="danger-ghost" onClick={() => remove(u)} aria-label={`Delete ${u.username}`}>
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
      </div>

      <UserModal
        open={modal.open}
        user={modal.user}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onSaved={() => {
          reload();
          // Editing yourself (e.g. your own role) should update the current session too.
          if (modal.user?.id === me.id) refresh();
        }}
      />
    </>
  );
}

const EMPTY = { username: '', email: '', password: '', role: 'viewer' };

function UserModal({ open, user, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(user ? { username: user.username, email: user.email, password: '', role: user.role } : EMPTY);
      setErrors({});
      setError(null);
    }
  }, [open, user]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = { ...form };
      if (user && !body.password) delete body.password;
      if (user) await api.put(`/users/${user.id}`, body);
      else await api.post('/users', body);
      toast.success(user ? 'User updated' : `${form.username} can now sign in`);
      onSaved();
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      if (!err.fields) setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? `Edit ${user.username}` : 'Add user'}
      description={user ? undefined : 'Share the username and password with them directly.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" loading={saving}>
            {user ? 'Save changes' : 'Create user'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} className="space-y-4">
        <ErrorNotice error={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Username"
            value={form.username}
            onChange={set('username')}
            error={errors.username}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            autoComplete="off"
            required
          />
        </div>
        <div>
          <PasswordField
            label={user ? 'New password' : 'Password'}
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            hint={user ? 'Leave blank to keep their current password. Setting one signs them out everywhere.' : undefined}
            autoComplete="new-password"
            required={!user}
            minLength={8}
          />
          <PasswordStrength password={form.password} />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Role</legend>
          <div className="grid gap-2">
            {ROLES.map((r) => {
              const selected = form.role === r.value;
              return (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl p-3 ring-1 transition-all duration-200 ${
                    selected
                      ? 'bg-brand-500/8 ring-2 ring-brand-500/60 dark:bg-brand-400/10'
                      : 'ring-slate-900/8 hover:bg-white/60 dark:ring-white/10 dark:hover:bg-white/5'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={selected}
                    onChange={set('role')}
                    className="sr-only"
                  />
                  <span
                    className={`grid size-9 place-items-center rounded-xl transition-colors ${selected ? 'bg-brand-500 text-white' : 'bg-slate-500/10 text-slate-500'}`}
                  >
                    <r.icon className="size-4.5" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-slate-900 dark:text-white">{r.label}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{r.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {errors.role && <p className="mt-1.5 text-xs text-coral-600">{errors.role}</p>}
        </fieldset>
      </form>
    </Modal>
  );
}
