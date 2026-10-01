import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { api } from '../../lib/api';
import { fieldErrors } from '../../lib/forms';
import { DEFAULT_COLOR, HOUSEHOLD_COLORS, householdInitials } from '../../lib/format';
import { useLocale } from '../../context/LocaleContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TextAreaField, TextField } from '../ui/Field';
import { Avatar, ErrorNotice } from '../ui/misc';

const FIELDS = ['name', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country', 'notes'];

function toForm(household) {
  const form = Object.fromEntries(FIELDS.map((f) => [f, household?.[f] ?? '']));
  form.color_theme = household?.color_theme || DEFAULT_COLOR;
  return form;
}

export function HouseholdFormModal({ open, onClose, household, onSaved }) {
  const { addressLabel } = useLocale();
  const toast = useToast();
  const [form, setForm] = useState(() => toForm(household));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(toForm(household));
      setErrors({});
      setError(null);
    }
  }, [open, household]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const saved = household
        ? await api.put(`/households/${household.id}`, form)
        : await api.post('/households', form);
      toast.success(household ? 'Household updated' : `${saved.name} added`);
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      if (!err.fields) setError(err);
    } finally {
      setSaving(false);
    }
  };

  const field = (name, props = {}) => (
    <TextField
      label={props.label ?? addressLabel(name)}
      value={form[name]}
      onChange={set(name)}
      error={errors[name]}
      {...props}
    />
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={household ? 'Edit household' : 'New household'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="household-form" loading={saving}>
            {household ? 'Save changes' : 'Create household'}
          </Button>
        </>
      }
    >
      <form id="household-form" onSubmit={submit} className="space-y-5">
        <ErrorNotice error={error} />

        <div className="flex items-end gap-4">
          <Avatar
            label={householdInitials(form.name || '?')}
            color={form.color_theme}
            size="lg"
            className="mb-0.5 transition-all duration-300"
          />
          {field('name', {
            label: 'Household name',
            placeholder: 'The Smith Family',
            required: true,
            maxLength: 120,
            className: 'flex-1',
          })}
        </div>

        <fieldset className="space-y-4">
          <legend className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">Address</legend>
          {field('address_line1', { label: addressLabel('line1'), autoComplete: 'address-line1' })}
          {field('address_line2', { label: addressLabel('line2'), autoComplete: 'address-line2' })}
          <div className="grid gap-4 sm:grid-cols-2">
            {field('city', { label: addressLabel('city'), autoComplete: 'address-level2' })}
            {field('state', { label: addressLabel('state'), autoComplete: 'address-level1' })}
            {field('postal_code', { label: addressLabel('postalCode'), autoComplete: 'postal-code' })}
            {field('country', { label: addressLabel('country'), autoComplete: 'country-name' })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">Colour</legend>
          <div className="grid grid-cols-6 gap-3 sm:grid-cols-12">
            {HOUSEHOLD_COLORS.map((c) => {
              const selected = form.color_theme === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  aria-label={c.name}
                  aria-pressed={selected}
                  title={c.name}
                  onClick={() => setForm((f) => ({ ...f, color_theme: c.value }))}
                  className={`grid aspect-square place-items-center rounded-full shadow-sm transition-all duration-200 hover:scale-110 ${
                    selected ? 'scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''
                  }`}
                  style={{ backgroundColor: c.value, '--tw-ring-color': c.value }}
                >
                  {selected && <Check className="size-4 animate-scale-in text-white" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </fieldset>

        <TextAreaField
          label="Notes"
          value={form.notes}
          onChange={set('notes')}
          error={errors.notes}
          placeholder="Gate code, best time to visit, card list notes…"
          maxLength={2000}
        />
      </form>
    </Modal>
  );
}
