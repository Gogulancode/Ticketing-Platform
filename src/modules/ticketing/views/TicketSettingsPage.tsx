import React from 'react';
import AdvancedSettingsTabs from '../../../components/ticketing/settings/AdvancedSettingsTabs';

const TicketSettingsPage: React.FC = () => {
  return (
    <div className="text-sm leading-snug space-y-sm max-w-full overflow-hidden">
      <div className="px-4 lg:px-6 xl:px-8">
        <AdvancedSettingsTabs />
      </div>
    </div>
  );
};

export default TicketSettingsPage;
