import { useEffect, useState } from 'react';
import { Mail, Phone, Smile } from 'lucide-react';
import { api } from '../../lib/api';
import { fieldErrors } from '../../lib/forms';
import { useToast } from '../../context/ToastContext';
import { useLocale } from '../../context/LocaleContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TextAreaField, TextField } from '../ui/Field';
import { DateField } from '../ui/DateField';
import { Avatar, ErrorNotice } from '../ui/misc';

const FIELDS = ['first_name', 'last_name', 'nickname', 'birthday', 'email', 'phone', 'notes'];

const toForm = (member) => Object.fromEntries(FIELDS.map((f) => [f, member?.[f] ?? '']));

export function MemberFormModal({ open, onClose, household, member, onSaved }) {
  const toast = useToast();
  const { locale } = useLocale();
  const [form, setForm] = useState(() => toForm(member));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(toForm(member));
      setErrors({});
      setError(null);
    }
  }, [open, member]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const base = `/households/${household.id}/members`;
      const saved = member ? await api.put(`${base}/${member.id}`, form) : await api.post(base, form);
      toast.success(member ? 'Member updated' : `${saved.first_name} added to ${household.name}`);
      onSaved?.(saved);
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
      title={member ? 'Edit member' : 'Add member'}
      description={household?.name}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="member-form" loading={saving}>
            {member ? 'Save changes' : 'Add member'}
          </Button>
        </>
      }
    >
      <form id="member-form" onSubmit={submit} className="space-y-4">
        <ErrorNotice error={error} />

        <div className="flex items-center gap-4">
          <Avatar first={form.first_name} last={form.last_name} color={household?.color_theme} size="lg" />
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <TextField
              label="First name"
              value={form.first_name}
              onChange={set('first_name')}
              error={errors.first_name}
              autoComplete="off"
              required
              maxLength={100}
            />
            <TextField
              label="Last name"
              value={form.last_name}
              onChange={set('last_name')}
              error={errors.last_name}
              autoComplete="off"
              maxLength={100}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Nickname"
            icon={Smile}
            value={form.nickname}
            onChange={set('nickname')}
            error={errors.nickname}
            hint="What they like to be called"
            autoComplete="off"
            maxLength={50}
          />
          <DateField
            label="Birthday"
            locale={locale}
            value={form.birthday}
            onChange={(v) => set('birthday')({ target: { value: v } })}
            error={errors.birthday}
          />
          <TextField
            label="Email"
            type="email"
            icon={Mail}
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            autoComplete="off"
          />
          <TextField
            label="Phone"
            type="tel"
            icon={Phone}
            value={form.phone}
            onChange={set('phone')}
            error={errors.phone}
            autoComplete="off"
            maxLength={40}
          />
        </div>

        <TextAreaField
          label="Notes"
          value={form.notes}
          onChange={set('notes')}
          error={errors.notes}
          placeholder="Allergies, gift ideas, anything worth remembering…"
          maxLength={2000}
        />
      </form>
    </Modal>
  );
}
