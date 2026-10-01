import { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../lib/hooks';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Button } from '../components/ui/Button';
import { PasswordField, TextField } from '../components/ui/Field';
import { ErrorNotice } from '../components/ui/misc';

export default function Login() {
  useDocumentTitle('Sign in');
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setError(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(form.username.trim(), form.password);
    } catch (err) {
      setError(err);
      setShaking(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your family address book" footer="Famli · Household contacts">
      <form
        onSubmit={submit}
        onAnimationEnd={(e) => e.target === e.currentTarget && setShaking(false)}
        className={`space-y-4 ${shaking ? 'animate-shake' : ''}`}
      >
        <ErrorNotice error={error} />
        <TextField
          label="Username"
          icon={User}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={form.username}
          onChange={set('username')}
          required
          autoFocus
        />
        <PasswordField
          label="Password"
          icon={Lock}
          autoComplete="current-password"
          value={form.password}
          onChange={set('password')}
          required
        />
        <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
