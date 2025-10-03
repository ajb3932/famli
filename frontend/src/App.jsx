import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LocaleProvider } from './context/LocaleContext';
import FirstRunSetup from './components/FirstRunSetup';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function AppContent() {
  const { user, loading, checkFirstRun, isFirstRun } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      await checkFirstRun();
      setChecking(false);
    };
    init();
  }, []);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isFirstRun) {
    return <FirstRunSetup />;
  }

  if (!user) {
    return <Login />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}

export default App;
