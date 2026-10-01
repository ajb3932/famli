import { Route, Routes } from 'react-router';
import { CloudOff } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { Button } from './components/ui/Button';
import { Spinner } from './components/ui/misc';
import Setup from './pages/Setup';
import Login from './pages/Login';
import Households from './pages/Households';
import HouseholdDetail from './pages/HouseholdDetail';
import People from './pages/People';
import Users from './pages/Users';
import Activity from './pages/Activity';
import NotFound from './pages/NotFound';

function AdminOnly({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <NotFound />;
}

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="flex animate-fade-in flex-col items-center gap-5">
        <img src="/images/famli-logo.png" alt="" className="size-20 animate-float" />
        <Spinner className="size-6 text-brand-500" />
      </div>
    </div>
  );
}

function ConnectionError({ error, onRetry }) {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="glass-strong flex max-w-sm animate-scale-in flex-col items-center rounded-[28px] p-8 text-center">
        <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-amber-500/14 text-amber-600">
          <CloudOff className="size-7" />
        </div>
        <h1 className="text-xl font-semibold">Can't reach Famli</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error?.message}</p>
        <Button className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}

export default function App() {
  const { status, user, setupRequired, error, refresh } = useAuth();

  if (status === 'loading' && !user) return <Splash />;
  if (status === 'error') return <ConnectionError error={error} onRetry={refresh} />;
  if (setupRequired) return <Setup />;
  if (!user) return <Login />;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Households />} />
        <Route path="households/:id" element={<HouseholdDetail />} />
        <Route path="people" element={<People />} />
        <Route
          path="users"
          element={
            <AdminOnly>
              <Users />
            </AdminOnly>
          }
        />
        <Route
          path="activity"
          element={
            <AdminOnly>
              <Activity />
            </AdminOnly>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
