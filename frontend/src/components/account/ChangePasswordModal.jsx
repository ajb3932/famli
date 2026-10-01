import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { PasswordField } from '../ui/Field';
import { ErrorNotice } from '../ui/misc';
import { PasswordStrength } from '../auth/PasswordStrength';
import { fieldErrors } from '../../lib/forms';

const EMPTY = { currentPassword: '', newPassword: '', confirm: '' };

export function ChangePasswordModal({ open, onClose }) {
  const { changePassword } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  const close = () => {
    setForm(EMPTY);
    setErrors({});
    setError(null);
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      setErrors({ confirm: 'Passwords do not match' });
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      toast.success('Password updated — other devices have been signed out');
      close();
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
      onClose={close}
      size="sm"
      title="Change password"
      description="You'll stay signed in here. Other devices will be signed out."
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="change-password-form" loading={saving}>
            Update password
          </Button>
        </>
      }
    >
      <form id="change-password-form" onSubmit={submit} className="space-y-4">
        <ErrorNotice error={error} />
        <PasswordField
          label="Current password"
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={set('currentPassword')}
          error={errors.currentPassword}
          required
        />
        <div>
          <PasswordField
            label="New password"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={set('newPassword')}
            error={errors.newPassword}
            required
            minLength={8}
          />
          <PasswordStrength password={form.newPassword} />
        </div>
        <PasswordField
          label="Confirm new password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
          required
        />
      </form>
    </Modal>
  );
}
