import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

const AdminRequestStatus: React.FC = () => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <ClockIcon className="w-5 h-5 text-yellow-600" />
        </div>
        <div>
          <h3 className="font-semibold text-yellow-800">Admin Request Pending</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Your request to become an administrator has been submitted and is waiting for review.
            You will be notified once a decision is made. Until then, you have player-level access.
          </p>
          <p className="text-xs text-yellow-600 mt-2">
            You can still register for tournaments and view matches while your request is being processed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRequestStatus;