import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFirstRun, setIsFirstRun] = useState(false);

  useEffect(() => {
    // Check for stored tokens on mount
    const accessToken = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (accessToken && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error('Failed to parse user data:', err);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const checkFirstRun = async () => {
    try {
      const response = await fetch('/api/auth/first-run');
      const data = await response.json();
      setIsFirstRun(data.isFirstRun);
    } catch (err) {
      console.error('Failed to check first run:', err);
    }
  };

  const login = async (username, password) => {
    const data = await api.post('/auth/login', { username, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const setup = async (username, email, password) => {
    const data = await api.post('/auth/setup', { username, email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    setIsFirstRun(false);
    return data;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updatePreferences = async (preferences) => {
    await api.put('/users/me/preferences', { preferences });
    const updatedUser = { ...user, preferences };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    isFirstRun,
    login,
    logout,
    setup,
    checkFirstRun,
    updatePreferences
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
