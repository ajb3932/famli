import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, onUnauthorized } from '../lib/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null, setupRequired: false, error: null });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const data = await api.get('/auth/status');
      setState({ status: 'ready', user: data.user, setupRequired: data.setupRequired, error: null });
    } catch (error) {
      setState((s) => ({ ...s, status: 'error', error }));
    }
  }, []);

  useEffect(() => {
    refresh();
    onUnauthorized(() => setState((s) => ({ ...s, user: null })));
    return () => onUnauthorized(null);
  }, [refresh]);

  const login = useCallback(async (username, password) => {
    const { user } = await api.post('/auth/login', { username, password });
    setState({ status: 'ready', user, setupRequired: false, error: null });
  }, []);

  const setup = useCallback(async (username, email, password) => {
    const { user } = await api.post('/auth/setup', { username, email, password });
    setState({ status: 'ready', user, setupRequired: false, error: null });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setState((s) => ({ ...s, user: null }));
    }
  }, []);

  const changePassword = useCallback(
    (currentPassword, newPassword) => api.post('/auth/password', { currentPassword, newPassword }),
    []
  );

  const updatePreferences = useCallback(async (updates) => {
    const { preferences } = await api.put('/users/me/preferences', updates);
    setState((s) => (s.user ? { ...s, user: { ...s.user, preferences } } : s));
  }, []);

  const value = useMemo(() => {
    const role = state.user?.role;
    return {
      ...state,
      isAdmin: role === 'admin',
      canEdit: role === 'admin' || role === 'editor',
      refresh,
      login,
      setup,
      logout,
      changePassword,
      updatePreferences,
    };
  }, [state, refresh, login, setup, logout, changePassword, updatePreferences]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
