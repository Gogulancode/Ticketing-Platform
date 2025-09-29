import React from 'react';

interface RecentUploadsProps {
  onRefresh?: () => void;
}

const RecentUploads: React.FC<RecentUploadsProps> = ({ onRefresh }) => {
  return (
    <div className="text-sm leading-snug space-y-sm">
      <div className="bg-gray-50 rounded p-sm">
        <h3 className="text-base font-semibold leading-snug mb-xs">Recent Uploads</h3>
        <p className="text-gray-600">No recent uploads to display.</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-sm px-sm py-xs bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Refresh
          </button>
        )}
      </div>
    </div>
  );
};

export default RecentUploads;
