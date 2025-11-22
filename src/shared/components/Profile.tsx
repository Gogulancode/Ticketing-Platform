import React, { useState, useEffect } from 'react';
import { User, Mail, Briefcase, Shield, Edit2, Save, X } from 'lucide-react';
import { LoadingSpinner } from '../../components';

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5015/api';

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem('token');
        console.log('🔍 Fetching user profile with token:', token?.substring(0, 20) + '...');
        
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error:', errorText);
          throw new Error('Failed to fetch user');
        }

        const userData = await response.json();
        console.log('✅ User data received:', userData);
        
        setUser(userData);
        setForm({
          email: userData.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          department: userData.department || '',
          role: userData.role || '',
          password: ''
        });
      } catch (err: any) {
        console.error('❌ Profile fetch error:', err);
        setError('Failed to load profile: ' + err.message);
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
      const token = localStorage.getItem('token');
      const payload: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        department: form.department,
      };
      if (form.password) payload.password = form.password;

      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to update profile');

      setSuccess('Profile updated successfully.');
      setEditMode(false);
      setUser((prev: any) => ({ ...prev, ...payload }));
    } catch (err: any) {
      setError('Failed to update profile.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner size="lg" message="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white rounded-full p-3">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
                  <p className="text-blue-100 text-sm">Manage your account information</p>
                </div>
              </div>
              {!editMode && (
                <button
                  onClick={() => { setEditMode(true); setError(''); setSuccess(''); }}
                  className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="px-8 pt-6">
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start">
                <Save className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-green-800 font-medium">{success}</p>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start">
                <X className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="px-8 pb-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input 
                type="text" 
                value={form.email} 
                name="email" 
                disabled 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  name="firstName"
                  disabled={!editMode}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${editMode ? 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent' : 'bg-gray-100'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  name="lastName"
                  disabled={!editMode}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${editMode ? 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent' : 'bg-gray-100'}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input
                type="text"
                value={form.department}
                name="department"
                disabled={!editMode}
                onChange={handleChange}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${editMode ? 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent' : 'bg-gray-100'}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <input 
                type="text" 
                value={form.role} 
                name="role" 
                disabled 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              />
            </div>

            {editMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={form.password}
                  name="password"
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Leave blank to keep current password"
                />
                <p className="text-sm text-gray-500 mt-1">Only fill this if you want to change your password</p>
              </div>
            )}

            {editMode && (
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => { setEditMode(false); setForm({ ...form, ...user, password: '' }); setError(''); setSuccess(''); }}
                  className="inline-flex items-center px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
