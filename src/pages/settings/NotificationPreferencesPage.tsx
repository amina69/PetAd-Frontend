import React from 'react';
import { useApiQuery } from '../../hooks/useApiQuery';

const SkeletonLoader = () => (
  <div className="animate-pulse h-12 bg-gray-200 rounded-md mb-2 w-full" />
);

const eventGroups = [
  { name: 'Adoption events', keys: ['pet_listed', 'application_received'] },
  { name: 'Escrow events', keys: ['payment_held', 'payment_released'], isSdk: true },
  { name: 'Dispute events', keys: ['dispute_opened', 'evidence_required'] },
  { name: 'Approval events', keys: ['admin_verified'] },
];

export default function NotificationPreferencesPage() {
  // Task: useApiQuery: GET /notifications/preferences
  const { data: preferences, isLoading } = useApiQuery<any>('/notifications/preferences');

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Notification Preferences</h1>
        <SkeletonLoader />
        <SkeletonLoader />
        <SkeletonLoader />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notification Preferences</h1>
      
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 text-left font-semibold text-gray-700">Event Type</th>
              <th className="p-4 text-center font-semibold text-gray-700">Email</th>
              <th className="p-4 text-center font-semibold text-gray-700">In-app</th>
            </tr>
          </thead>
          <tbody>
            {eventGroups.map((group) => (
              <React.Fragment key={group.name}>
                <tr className="bg-gray-100/50">
                  <td colSpan={3} className="p-3 font-bold text-gray-800 border-y">
                    {group.name} 
                    {group.isSdk && (
                      <span className="ml-2 text-[10px] uppercase bg-blue-500 text-white px-2 py-0.5 rounded-full">
                        SDK event
                      </span>
                    )}
                  </td>
                </tr>
                {group.keys.map((key) => (
                  <tr key={key} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4 capitalize text-gray-600">{key.replace(/_/g, ' ')}</td>
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-blue-600 cursor-pointer" 
                        defaultChecked={preferences?.[key]?.email} 
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-blue-600 cursor-pointer" 
                        defaultChecked={preferences?.[key]?.in_app} 
                      />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}