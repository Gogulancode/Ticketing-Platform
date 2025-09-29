import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../../../shared/services/api/settingsApi';

const CustomFieldsForTicket: React.FC<{ ticket: any }> = ({ ticket }) => {
  const { data: customFields = [] } = useQuery({
    queryKey: ['customFields', ticket?.categoryId, ticket?.subcategoryId],
    queryFn: async () => {
      if (!ticket?.categoryId && !ticket?.subcategoryId) return [];
      return await settingsApi.getCustomFields(ticket.categoryId, ticket.subcategoryId);
    },
    enabled: !!ticket?.categoryId || !!ticket?.subcategoryId
  });

  if (!customFields.length) return <div className="text-xs text-gray-500">No custom fields for this ticket.</div>;

  return (
    <div className="space-y-2 mt-2">
      {customFields.map((field: any) => (
        <div key={field.id} className="border-b pb-2">
          <div className="text-xs font-semibold text-gray-700">{field.label}</div>
          <div className="text-xs text-gray-900">
            {ticket.customFields?.[field.name] ?? <span className="text-gray-400">Not set</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomFieldsForTicket;