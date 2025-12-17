import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronDown, ChevronUp, FileText, Save, X } from 'lucide-react';
import { Ticket } from '../../../services/ticketsApi';

interface CustomFieldsSectionProps {
  ticket: Ticket;
  expanded: boolean;
  onToggle: () => void;
}

const CustomFieldsSection: React.FC<CustomFieldsSectionProps> = ({
  ticket,
  expanded,
  onToggle
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const hasCustomFields = ticket.customFields && Object.keys(ticket.customFields).length > 0;

  const handleEditField = (fieldKey: string, currentValue: unknown) => {
    setEditingField(fieldKey);
    setEditValue(String(currentValue || ''));
  };

  const handleSaveField = async (fieldKey: string) => {
    try {
      // API call to update custom field
      const response = await fetch(`/api/tickets/${ticket.id}/custom-fields`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          field: fieldKey, 
          value: editValue 
        })
      });
      
      if (!response.ok) throw new Error('Failed to update field');
      
      toast.success('Custom field updated successfully');
      setEditingField(null);
      setEditValue('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update field';
      toast.error(`Failed to update field: ${message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const formatFieldName = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  if (!hasCustomFields) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggle}
      >
        <h2 className="text-lg font-semibold text-gray-900">
          <FileText className="h-5 w-5 inline mr-2" />
          Custom Fields
        </h2>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </div>
      
      {expanded && (
        <div className="border-t p-4">
          <div className="space-y-4">
            {Object.entries(ticket.customFields || {}).map(([key, value]) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formatFieldName(key)}
                    </label>
                    
                    {editingField === key ? (
                      <div className="space-y-2">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          rows={3}
                        />
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleSaveField(key)}
                            className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="inline-flex items-center px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleEditField(key, value)}
                      >
                        {value ? String(value) : (
                          <span className="text-gray-500 italic">Click to add value</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-red-50 rounded-md">
            <p className="text-xs text-gray-700">
              💡 Tip: Click on any field value to edit it. Custom fields help track additional information specific to your workflow.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomFieldsSection;