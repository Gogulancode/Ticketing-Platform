import React, { useState } from 'react';
import { Eye, EyeOff, Bell, BellOff, Plus, X, User } from 'lucide-react';
import {
  useTicketWatchers,
  useAddWatcher,
  useUpdateWatcher,
  useRemoveWatcher,
  TicketWatcherDto,
  CreateTicketWatcherDto,
  UpdateTicketWatcherDto
} from '../../services/ticketEnhancementsApi';
import { useAuth } from '../../contexts/AuthContext';

interface WatchersPanelProps {
  ticketId: number;
  readOnly?: boolean;
}

export function WatchersPanel({ ticketId, readOnly = false }: WatchersPanelProps) {
  const { user } = useAuth();
  const { data: watchers, isLoading } = useTicketWatchers(ticketId);
  const addWatcherMutation = useAddWatcher();
  const updateWatcherMutation = useUpdateWatcher();
  const removeWatcherMutation = useRemoveWatcher();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWatcher, setEditingWatcher] = useState<TicketWatcherDto | null>(null);

  const currentUserWatcher = watchers?.find(w => w.userId === user?.id);
  const isWatching = !!currentUserWatcher;

  const handleToggleWatch = async () => {
    if (isWatching && currentUserWatcher) {
      await removeWatcherMutation.mutateAsync(currentUserWatcher.id);
    } else if (user) {
      await addWatcherMutation.mutateAsync({
        ticketId,
        userId: user.id,
        notifyOnComment: true,
        notifyOnStatusChange: true,
        notifyOnAssigneeChange: true,
        notifyOnPriorityChange: true,
      });
    }
  };

  const handleUpdateNotifications = async (watcher: TicketWatcherDto, updates: Partial<UpdateTicketWatcherDto>) => {
    await updateWatcherMutation.mutateAsync({
      id: watcher.id,
      data: {
        notifyOnComment: watcher.notifyOnComment,
        notifyOnStatusChange: watcher.notifyOnStatusChange,
        notifyOnAssigneeChange: watcher.notifyOnAssigneeChange,
        notifyOnPriorityChange: watcher.notifyOnPriorityChange,
        ...updates,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Watchers ({watchers?.length || 0})
        </h3>
        {!readOnly && (
          <button
            onClick={handleToggleWatch}
            disabled={addWatcherMutation.isPending || removeWatcherMutation.isPending}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              isWatching
                ? 'bg-red-100 text-gray-700 hover:bg-red-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isWatching ? (
              <>
                <EyeOff className="h-3 w-3" />
                Unwatch
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" />
                Watch
              </>
            )}
          </button>
        )}
      </div>

      <div className="p-4">
        {watchers && watchers.length > 0 ? (
          <div className="space-y-3">
            {watchers.map((watcher) => (
              <WatcherItem
                key={watcher.id}
                watcher={watcher}
                isCurrentUser={watcher.userId === user?.id}
                onUpdateNotifications={handleUpdateNotifications}
                onRemove={() => removeWatcherMutation.mutateAsync(watcher.id)}
                readOnly={readOnly}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No one is watching this ticket
          </p>
        )}
      </div>

      {/* Current user notification settings */}
      {isWatching && currentUserWatcher && !readOnly && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Your Notification Preferences</h4>
          <div className="grid grid-cols-2 gap-2">
            <NotificationToggle
              label="Comments"
              enabled={currentUserWatcher.notifyOnComment}
              onChange={() => handleUpdateNotifications(currentUserWatcher, {
                notifyOnComment: !currentUserWatcher.notifyOnComment
              })}
            />
            <NotificationToggle
              label="Status"
              enabled={currentUserWatcher.notifyOnStatusChange}
              onChange={() => handleUpdateNotifications(currentUserWatcher, {
                notifyOnStatusChange: !currentUserWatcher.notifyOnStatusChange
              })}
            />
            <NotificationToggle
              label="Assignee"
              enabled={currentUserWatcher.notifyOnAssigneeChange}
              onChange={() => handleUpdateNotifications(currentUserWatcher, {
                notifyOnAssigneeChange: !currentUserWatcher.notifyOnAssigneeChange
              })}
            />
            <NotificationToggle
              label="Priority"
              enabled={currentUserWatcher.notifyOnPriorityChange}
              onChange={() => handleUpdateNotifications(currentUserWatcher, {
                notifyOnPriorityChange: !currentUserWatcher.notifyOnPriorityChange
              })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface WatcherItemProps {
  watcher: TicketWatcherDto;
  isCurrentUser: boolean;
  onUpdateNotifications: (watcher: TicketWatcherDto, updates: Partial<UpdateTicketWatcherDto>) => void;
  onRemove: () => void;
  readOnly?: boolean;
}

function WatcherItem({ watcher, isCurrentUser, onRemove, readOnly }: WatcherItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="h-4 w-4 text-gray-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {watcher.userName || 'Unknown'}
            {isCurrentUser && <span className="text-gray-500 ml-1">(you)</span>}
          </p>
          <p className="text-xs text-gray-500">{watcher.userEmail}</p>
        </div>
      </div>
      {!readOnly && isCurrentUser && (
        <button
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-gray-500 transition-colors"
          title="Stop watching"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface NotificationToggleProps {
  label: string;
  enabled: boolean;
  onChange: () => void;
}

function NotificationToggle({ label, enabled, onChange }: NotificationToggleProps) {
  return (
    <button
      onClick={onChange}
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
        enabled
          ? 'bg-red-100 text-gray-700'
          : 'bg-gray-100 text-gray-500'
      }`}
    >
      {enabled ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
      {label}
    </button>
  );
}

export default WatchersPanel;
