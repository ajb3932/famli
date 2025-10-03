import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import HouseholdList from './HouseholdList';
import HouseholdDetail from './HouseholdDetail';
import PeopleList from './PeopleList';
import UserManagement from './UserManagement';

function Dashboard() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { locale, availableLocales, changeLocale } = useLocale();
  const [activeView, setActiveView] = useState('households');
  const [selectedHousehold, setSelectedHousehold] = useState(null);

  const handleSelectHousehold = (household) => {
    setSelectedHousehold(household);
    setActiveView('detail');
  };

  const handleBackToList = () => {
    setSelectedHousehold(null);
    setActiveView('households');
  };

  const isAdmin = user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <img src="/images/famli-logo.png" alt="Famli" className="h-10 w-auto" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {user?.username} ({user?.role})
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {availableLocales.length > 0 && (
                <select
                  value={locale}
                  onChange={(e) => changeLocale(e.target.value)}
                  className="px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                >
                  {availableLocales.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? '☀️' : '🌙'}
              </button>

              <button
                onClick={logout}
                className="btn-secondary"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveView('households')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === 'households' || activeView === 'detail'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Households
            </button>

            <button
              onClick={() => setActiveView('people')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === 'people'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              People
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveView('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeView === 'users'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Users
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'households' && (
          <HouseholdList onSelectHousehold={handleSelectHousehold} canEdit={canEdit} />
        )}

        {activeView === 'people' && (
          <PeopleList onSelectHousehold={handleSelectHousehold} />
        )}

        {activeView === 'detail' && selectedHousehold && (
          <HouseholdDetail
            household={selectedHousehold}
            onBack={handleBackToList}
            canEdit={canEdit}
          />
        )}

        {activeView === 'users' && isAdmin && (
          <UserManagement />
        )}
      </main>
    </div>
  );
}

export default Dashboard;
