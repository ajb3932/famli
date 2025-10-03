import { useState, useEffect } from 'react';
import { api } from '../services/api';

function PeopleList({ onSelectHousehold }) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('first_name');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

  const fetchPeople = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/people?page=${pagination.page}&limit=${pagination.limit}&search=${search}&sortBy=${sortBy}`);
      setPeople(data.people);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load people');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, [pagination.page, search, sortBy]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setPagination({ ...pagination, page: 1 });
  };

  const handlePersonClick = (person) => {
    // Create a household object from the person data and call onSelectHousehold
    const household = {
      id: person.household_id,
      name: person.household_name,
      color_theme: person.color_theme,
      city: person.city,
      state: person.state
    };
    onSelectHousehold(household);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">People</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
          <button
            onClick={() => handleSortChange('first_name')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'first_name'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            First Name
          </button>
          <button
            onClick={() => handleSortChange('last_name')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'last_name'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Last Name
          </button>
        </div>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search people or households..."
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
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading people...</p>
        </div>
      ) : people.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No people found</p>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {people.map((person) => (
                <div
                  key={person.id}
                  onClick={() => handlePersonClick(person)}
                  className="py-4 px-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-4"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                    style={{ backgroundColor: person.color_theme }}
                  >
                    {person.first_name?.charAt(0)}{person.last_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">
                      {person.first_name} {person.last_name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {person.household_name}
                      </p>
                      {person.role && (
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          {person.role}
                        </p>
                      )}
                    </div>
                    {person.email && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        {person.email}
                      </p>
                    )}
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

export default PeopleList;
