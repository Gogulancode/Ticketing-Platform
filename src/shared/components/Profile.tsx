import React, { useState, useEffect } from 'react';
import { getCurrentUser, updateProfile } from '../services/api/auth';

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        setForm({
          email: userData.email || '',
          firstName: userData.firstName || userData.first_name || '',
          lastName: userData.lastName || userData.last_name || '',
          department: userData.department || '',
          role: userData.role || '',
          password: ''
        });
      } catch (err: any) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    try {
      const payload: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        department: form.department,
      };
      if (form.password) payload.password = form.password;
      await updateProfile(payload);
      setSuccess('Profile updated successfully.');
      setEditMode(false);
      setUser((prev: any) => ({ ...prev, ...payload }));
    } catch (err: any) {
      setError('Failed to update profile.');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!user) return null;

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8 mt-8">
      <h2 className="text-2xl font-bold mb-4">Profile Settings</h2>
      {success && <div className="mb-4 text-green-600">{success}</div>}
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="text" value={form.email} name="email" disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              value={form.firstName}
              name="firstName"
              disabled={!editMode}
              onChange={handleChange}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              value={form.lastName}
              name="lastName"
              disabled={!editMode}
              onChange={handleChange}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <input
            type="text"
            value={form.department}
            name="department"
            disabled={!editMode}
            onChange={handleChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <input type="text" value={form.role} name="role" disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" />
        </div>
        {editMode && (
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              value={form.password}
              name="password"
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Leave blank to keep current password"
            />
          </div>
        )}
        <div className="flex justify-end space-x-3 mt-4">
          {editMode ? (
            <>
              <button
                onClick={() => { setEditMode(false); setForm({ ...form, ...user, password: '' }); setError(''); setSuccess(''); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => { setEditMode(true); setError(''); setSuccess(''); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
