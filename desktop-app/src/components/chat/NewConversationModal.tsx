import { useState } from 'react';
import { X, Search, Users, Hash, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { chatApi } from '../../services/api';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

interface NewConversationModalProps {
  onClose: () => void;
  onCreated: (conversation: any) => void;
}

export default function NewConversationModal({ onClose, onCreated }: NewConversationModalProps) {
  const [type, setType] = useState<'Direct' | 'Group' | 'Channel'>('Direct');
  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await chatApi.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleUserSelection = (user: User) => {
    if (selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      if (type === 'Direct' && selectedUsers.length >= 1) {
        setSelectedUsers([user]);
      } else {
        setSelectedUsers([...selectedUsers, user]);
      }
    }
  };

  const handleCreate = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one participant');
      return;
    }

    if ((type === 'Group' || type === 'Channel') && !name.trim()) {
      toast.error('Please enter a name for the conversation');
      return;
    }

    setIsCreating(true);
    try {
      let conversation;
      if (type === 'Direct') {
        conversation = await chatApi.createDirectConversation(selectedUsers[0].id);
      } else {
        conversation = await chatApi.createConversation({
          name: name.trim(),
          type,
          participantIds: selectedUsers.map(u => u.id)
        });
      }
      onCreated(conversation);
    } catch (error) {
      toast.error('Failed to create conversation');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New Conversation</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conversation Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Direct', 'Group', 'Channel'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setType(t);
                    if (t === 'Direct') setSelectedUsers(selectedUsers.slice(0, 1));
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    type === t
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t === 'Direct' && <Users className="w-4 h-4" />}
                  {t === 'Group' && <Users className="w-4 h-4" />}
                  {t === 'Channel' && <Hash className="w-4 h-4" />}
                  <span className="text-sm font-medium">{t}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name (for Group/Channel) */}
          {(type === 'Group' || type === 'Channel') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type} Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Enter ${type.toLowerCase()} name...`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}

          {/* User Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'Direct' ? 'Select User' : 'Add Participants'}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                {searchResults.map((user) => {
                  const isSelected = selectedUsers.some(u => u.id === user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleUserSelection(user)}
                      className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-primary-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary-600" />}
                    </button>
                  );
                })}
              </div>
            )}

            {isSearching && (
              <p className="mt-2 text-sm text-gray-500">Searching...</p>
            )}
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selected ({selectedUsers.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm"
                  >
                    {user.firstName} {user.lastName}
                    <button
                      onClick={() => toggleUserSelection(user)}
                      className="ml-1 text-primary-500 hover:text-primary-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || selectedUsers.length === 0}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
