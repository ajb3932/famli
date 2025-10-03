import { useState, useEffect } from 'react';
import { api } from '../services/api';
import HouseholdForm from './HouseholdForm';
import MemberForm from './MemberForm';

function HouseholdDetail({ household: initialHousehold, onBack, canEdit }) {
  const [household, setHousehold] = useState(initialHousehold);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const fetchHouseholdDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/households/${household.id}`);
      setHousehold(data);
      setMembers(data.members || []);
    } catch (err) {
      setError(err.message || 'Failed to load household details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseholdDetails();
  }, []);

  const handleHouseholdUpdated = () => {
    setEditMode(false);
    fetchHouseholdDetails();
  };

  const handleMemberSaved = () => {
    setShowMemberForm(false);
    setEditingMember(null);
    fetchHouseholdDetails();
  };

  const handleDeleteMember = async (memberId) => {
    if (!confirm('Are you sure you want to delete this member?')) {
      return;
    }

    try {
      await api.delete(`/households/${household.id}/members/${memberId}`);
      fetchHouseholdDetails();
    } catch (err) {
      alert(err.message || 'Failed to delete member');
    }
  };

  if (editMode) {
    return (
      <div>
        <button
          onClick={() => setEditMode(false)}
          className="mb-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Cancel
        </button>
        <HouseholdForm
          household={household}
          onSuccess={handleHouseholdUpdated}
          onCancel={() => setEditMode(false)}
        />
      </div>
    );
  }

  if (showMemberForm || editingMember) {
    return (
      <div>
        <button
          onClick={() => {
            setShowMemberForm(false);
            setEditingMember(null);
          }}
          className="mb-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Cancel
        </button>
        <MemberForm
          householdId={household.id}
          member={editingMember}
          onSuccess={handleMemberSaved}
          onCancel={() => {
            setShowMemberForm(false);
            setEditingMember(null);
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-blue-600 dark:text-blue-400 hover:underline"
      >
        ← Back to households
      </button>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Household Info */}
      <div className="card mb-6" style={{ borderLeftWidth: '4px', borderLeftColor: household.color_theme }}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-3xl font-bold">{household.name}</h2>
          {canEdit && (
            <button
              onClick={() => setEditMode(true)}
              className="btn-secondary"
            >
              Edit
            </button>
          )}
        </div>

        {(household.address_line1 || household.city) && (
          <div className="mb-4 text-gray-700 dark:text-gray-300">
            {household.address_line1 && <p>{household.address_line1}</p>}
            {household.address_line2 && <p>{household.address_line2}</p>}
            {(household.city || household.state || household.postal_code) && (
              <p>
                {household.city && household.city}
                {household.state && `, ${household.state}`}
                {household.postal_code && ` ${household.postal_code}`}
              </p>
            )}
            {household.country && <p>{household.country}</p>}
          </div>
        )}

        {household.notes && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">{household.notes}</p>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Household Members</h3>
          {canEdit && (
            <button
              onClick={() => setShowMemberForm(true)}
              className="btn-primary"
            >
              + Add Member
            </button>
          )}
        </div>

        {members.length === 0 ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            <p>No members added yet</p>
            {canEdit && (
              <button
                onClick={() => setShowMemberForm(true)}
                className="mt-4 btn-primary"
              >
                Add first member
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">
                      {member.first_name} {member.last_name}
                    </h4>
                    {member.role && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{member.role}</p>
                    )}
                    {member.birthday && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        🎂 {new Date(member.birthday).toLocaleDateString()}
                      </p>
                    )}
                    {member.email && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        ✉️ {member.email}
                      </p>
                    )}
                    {member.phone && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        📞 {member.phone}
                      </p>
                    )}
                    {member.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 italic">
                        {member.notes}
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => setEditingMember(member)}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="text-red-600 dark:text-red-400 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HouseholdDetail;
