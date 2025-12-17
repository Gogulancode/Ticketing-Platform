import React, { useState } from 'react';
import { Clock, Plus, Edit2, Trash2, DollarSign, Calendar, X } from 'lucide-react';
import {
  useTicketTimeSummary,
  useCreateTimeEntry,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
  TicketTimeEntryDto,
  CreateTicketTimeEntryDto,
  UpdateTicketTimeEntryDto
} from '../../services/ticketEnhancementsApi';

interface TimeTrackerPanelProps {
  ticketId: number;
  readOnly?: boolean;
}

export function TimeTrackerPanel({ ticketId, readOnly = false }: TimeTrackerPanelProps) {
  const { data: summary, isLoading } = useTicketTimeSummary(ticketId);
  const createMutation = useCreateTimeEntry();
  const updateMutation = useUpdateTimeEntry();
  const deleteMutation = useDeleteTimeEntry();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TicketTimeEntryDto | null>(null);

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Time Tracking
        </h3>
        {!readOnly && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Log Time
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-semibold text-gray-900">
            {formatMinutes(summary?.totalMinutes || 0)}
          </p>
          <p className="text-xs text-gray-500">Total Time</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-green-600">
            {formatMinutes(summary?.billableMinutes || 0)}
          </p>
          <p className="text-xs text-gray-500">Billable</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-gray-600">
            {formatCurrency(summary?.totalCost || 0)}
          </p>
          <p className="text-xs text-gray-500">Total Cost</p>
        </div>
      </div>

      {/* Time Entries */}
      <div className="p-4">
        {summary?.entries && summary.entries.length > 0 ? (
          <div className="space-y-3">
            {summary.entries.map((entry) => (
              <TimeEntryItem
                key={entry.id}
                entry={entry}
                onEdit={() => setEditingEntry(entry)}
                onDelete={() => deleteMutation.mutateAsync(entry.id)}
                readOnly={readOnly}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No time entries recorded
          </p>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddForm || editingEntry) && (
        <TimeEntryModal
          ticketId={ticketId}
          entry={editingEntry}
          onClose={() => {
            setShowAddForm(false);
            setEditingEntry(null);
          }}
          onSave={async (data) => {
            if (editingEntry) {
              await updateMutation.mutateAsync({
                id: editingEntry.id,
                data: {
                  description: data.description,
                  minutes: data.minutes,
                  isBillable: data.isBillable,
                  hourlyRate: data.hourlyRate,
                  workDate: data.workDate,
                },
              });
            } else {
              await createMutation.mutateAsync(data);
            }
            setShowAddForm(false);
            setEditingEntry(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

interface TimeEntryItemProps {
  entry: TicketTimeEntryDto;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}

function TimeEntryItem({ entry, onEdit, onDelete, readOnly }: TimeEntryItemProps) {
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">{formatMinutes(entry.minutes)}</span>
          {entry.isBillable && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
              <DollarSign className="h-3 w-3" />
              Billable
            </span>
          )}
        </div>
        {entry.description && (
          <p className="text-sm text-gray-600">{entry.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span>{entry.userName}</span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(entry.workDate).toLocaleDateString()}
          </span>
        </div>
      </div>
      {!readOnly && (
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-gray-500 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-gray-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

interface TimeEntryModalProps {
  ticketId: number;
  entry?: TicketTimeEntryDto | null;
  onClose: () => void;
  onSave: (data: CreateTicketTimeEntryDto) => Promise<void>;
  isLoading: boolean;
}

function TimeEntryModal({ ticketId, entry, onClose, onSave, isLoading }: TimeEntryModalProps) {
  const [hours, setHours] = useState(entry ? Math.floor(entry.minutes / 60) : 0);
  const [minutes, setMinutes] = useState(entry ? entry.minutes % 60 : 30);
  const [description, setDescription] = useState(entry?.description || '');
  const [isBillable, setIsBillable] = useState(entry?.isBillable || false);
  const [hourlyRate, setHourlyRate] = useState(entry?.hourlyRate?.toString() || '');
  const [workDate, setWorkDate] = useState(
    entry?.workDate
      ? new Date(entry.workDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes <= 0) return;

    await onSave({
      ticketId,
      description: description || undefined,
      minutes: totalMinutes,
      isBillable,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      workDate,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {entry ? 'Edit Time Entry' : 'Log Time'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Time Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Spent</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={hours}
                    onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                  <span className="absolute right-3 top-2 text-sm text-gray-500">hours</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                  <span className="absolute right-3 top-2 text-sm text-gray-500">mins</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What did you work on?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Work Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Date</label>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Billable Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Billable Time</label>
            <button
              type="button"
              onClick={() => setIsBillable(!isBillable)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                isBillable ? 'bg-green-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isBillable ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Hourly Rate (shown if billable) */}
          {isBillable && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (hours === 0 && minutes === 0)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : entry ? 'Update' : 'Log Time'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TimeTrackerPanel;
