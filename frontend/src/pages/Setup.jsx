import { useState } from 'react';
import { Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../lib/hooks';
import { fieldErrors } from '../lib/forms';
import { AuthLayout } from '../components/auth/AuthLayout';
import { PasswordStrength } from '../components/auth/PasswordStrength';
import { Button } from '../components/ui/Button';
import { PasswordField, TextField } from '../components/ui/Field';
import { ErrorNotice } from '../components/ui/misc';

export default function Setup() {
  useDocumentTitle('Welcome');
  const { setup } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setErrors({ confirm: 'Passwords do not match' });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await setup(form.username.trim(), form.email.trim(), form.password);
    } catch (err) {
      setErrors(fieldErrors(err));
      if (!err.fields) setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome to Famli"
      subtitle="Create the administrator account to get started"
      footer="You can invite family members as editors or viewers later."
    >
      <form onSubmit={submit} className="space-y-4">
        <ErrorNotice error={error} />
        <TextField
          label="Username"
          icon={User}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={form.username}
          onChange={set('username')}
          error={errors.username}
          required
          autoFocus
        />
        <TextField
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          required
        />
        <div>
          <PasswordField
            label="Password"
            icon={Lock}
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            hint={!form.password ? 'At least 8 characters — a short phrase works well' : undefined}
            minLength={8}
            required
          />
          <PasswordStrength password={form.password} />
        </div>
        <PasswordField
          label="Confirm password"
          icon={Lock}
          autoComplete="new-password"
          value={form.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
          required
        />
        <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
          Create admin account
        </Button>
      </form>
    </AuthLayout>
  );
}
