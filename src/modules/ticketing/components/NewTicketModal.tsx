import React, { useState } from 'react';
import { X, AlertCircle, Info, Bug, HelpCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi, CreateTicketDto, TicketCategory, TicketPriority } from '../api/ticketsApi';
import { TicketContext } from './TicketButton';

interface TicketModalFormState {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
}

interface NewTicketModalProps {
  open: boolean;
  onClose: () => void;
  context: TicketContext;
}

const NewTicketModal: React.FC<NewTicketModalProps> = ({ open, onClose, context }) => {
  const [formData, setFormData] = useState<TicketModalFormState>({
    title: '',
    description: '',
    category: TicketCategory.Other,
    priority: TicketPriority.Medium,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  const createTicketMutation = useMutation({
    mutationFn: ticketsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      onClose();
      setFormData({
        title: '',
        description: '',
        category: TicketCategory.Other,
        priority: TicketPriority.Medium,
      });
      setErrors({});
      // Show success message
      alert('Ticket created successfully!');
    },
    onError: (error: unknown) => {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: CreateTicketDto = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      links: [
        {
          objectType: context.objectType,
          objectId: context.objectId,
        },
      ],
    };

    createTicketMutation.mutate(payload);
  };

  const handleInputChange = <Field extends keyof TicketModalFormState>(field: Field, value: TicketModalFormState[Field]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getCategoryIcon = (category: TicketCategory) => {
    switch (category) {
      case TicketCategory.Access:
        return <AlertCircle className="w-4 h-4" />;
      case TicketCategory.Content:
        return <Info className="w-4 h-4" />;
      case TicketCategory.Bug:
        return <Bug className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.Urgent:
        return 'text-gray-600 bg-red-50 border-red-200';
      case TicketPriority.High:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case TicketPriority.Medium:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create Support Ticket</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Context Info */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-1">Related to:</h3>
            <p className="text-gray-700">
              {context.objectType}: {context.title || context.objectId}
            </p>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Brief summary of the issue"
            />
            {errors.title && (
              <p className="text-gray-600 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Detailed description of the issue, including steps to reproduce if applicable"
            />
            {errors.description && (
              <p className="text-gray-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(TicketCategory).filter(v => typeof v === 'number').map((category) => (
                <label
                  key={category}
                  className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.category === category
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={category}
                    checked={formData.category === category}
                    onChange={(e) => handleInputChange('category', parseInt(e.target.value))}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category as TicketCategory)}
                    <span className="font-medium">
                      {TicketCategory[category as TicketCategory]}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(TicketPriority).filter(v => typeof v === 'number').map((priority) => (
                <label
                  key={priority}
                  className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.priority === priority
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={priority}
                    checked={formData.priority === priority}
                    onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                    className="sr-only"
                  />
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${getPriorityColor(priority as TicketPriority)}`}
                  >
                    {TicketPriority[priority as TicketPriority]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTicketMutation.isPending}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
            >
              {createTicketMutation.isPending ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTicketModal;
