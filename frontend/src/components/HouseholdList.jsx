import { useState, useEffect } from 'react';
import { api } from '../services/api';
import HouseholdForm from './HouseholdForm';

function HouseholdList({ onSelectHousehold, canEdit }) {
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  const fetchHouseholds = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/households?page=${pagination.page}&limit=${pagination.limit}&search=${search}`);
      setHouseholds(data.households);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load households');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseholds();
  }, [pagination.page, search]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleHouseholdCreated = () => {
    setShowForm(false);
    fetchHouseholds();
  };

  if (showForm) {
    return (
      <div>
        <button
          onClick={() => setShowForm(false)}
          className="mb-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to list
        </button>
        <HouseholdForm onSuccess={handleHouseholdCreated} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Households</h2>
        {canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            + Add Household
          </button>
        )}
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search households..."
          value={search}
          onChange={handleSearch}
          className="input-field max-w-md"
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading households...</p>
        </div>
      ) : households.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No households found</p>
          {canEdit && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Add your first household
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="card">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {households.map((household) => (
                <div
                  key={household.id}
                  onClick={() => onSelectHousehold(household)}
                  className="py-4 px-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-4"
                >
                  <div
                    className="w-1 h-12 rounded"
                    style={{ backgroundColor: household.color_theme }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{household.name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      {household.city && household.state && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {household.city}, {household.state}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {household.member_count || 0} {household.member_count === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HouseholdList;
