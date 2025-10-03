import { useState } from 'react';
import { api } from '../services/api';
import { useLocale } from '../context/LocaleContext';

const COLOR_OPTIONS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Indigo', value: '#6366f1' },
];

function HouseholdForm({ household, onSuccess, onCancel }) {
  const { getAddressLabel } = useLocale();
  const [formData, setFormData] = useState({
    name: household?.name || '',
    address_line1: household?.address_line1 || '',
    address_line2: household?.address_line2 || '',
    city: household?.city || '',
    state: household?.state || '',
    postal_code: household?.postal_code || '',
    country: household?.country || '',
    notes: household?.notes || '',
    color_theme: household?.color_theme || '#3b82f6'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (household) {
        await api.put(`/households/${household.id}`, formData);
      } else {
        await api.post('/households', formData);
      }
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to save household');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        {household ? 'Edit Household' : 'Add Household'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Household Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="The Smith Family"
          />
        </div>

        <div>
          <label htmlFor="address_line1" className="block text-sm font-medium mb-1">
            {getAddressLabel('line1')}
          </label>
          <input
            type="text"
            id="address_line1"
            name="address_line1"
            value={formData.address_line1}
            onChange={handleChange}
            className="input-field"
            placeholder="123 Main Street"
          />
        </div>

        <div>
          <label htmlFor="address_line2" className="block text-sm font-medium mb-1">
            {getAddressLabel('line2')}
          </label>
          <input
            type="text"
            id="address_line2"
            name="address_line2"
            value={formData.address_line2}
            onChange={handleChange}
            className="input-field"
            placeholder="Apt 4B"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-1">
              {getAddressLabel('city')}
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="input-field"
              placeholder="Springfield"
            />
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium mb-1">
              {getAddressLabel('state')}
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="input-field"
              placeholder="IL"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="postal_code" className="block text-sm font-medium mb-1">
              {getAddressLabel('postalCode')}
            </label>
            <input
              type="text"
              id="postal_code"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
              className="input-field"
              placeholder="62701"
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium mb-1">
              {getAddressLabel('country')}
            </label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="input-field"
              placeholder="USA"
            />
          </div>
        </div>

        <div>
          <label htmlFor="color_theme" className="block text-sm font-medium mb-1">
            Color Theme
          </label>
          <div className="grid grid-cols-4 gap-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setFormData({ ...formData, color_theme: color.value })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.color_theme === color.value
                    ? 'border-gray-900 dark:border-gray-100 scale-105'
                    : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                }`}
                style={{ backgroundColor: color.value }}
              >
                <span className="text-white text-xs font-medium">{color.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="input-field"
            placeholder="Any additional notes..."
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : household ? 'Update Household' : 'Create Household'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default HouseholdForm;
