import { useRealTimeStatusPolling } from "../lib/hooks/useRealTimeStatusPolling";
import {
  getStatusMeta,
  STATUS_COLOR_CLASSES,
  type StatusDomain,
} from "../lib/statusConfig";

/**
 * Renders a status pill using the shared status config, so the demo page can
 * never drift from the colours used by the production badges.
 */
function StatusPill({
  domain,
  status,
}: {
  domain: StatusDomain;
  status: string;
}) {
  const meta = getStatusMeta(domain, status);
  const tokenClasses = STATUS_COLOR_CLASSES[meta.color];

  return (
    <span
      className={`px-2 py-1 rounded text-sm font-medium ${tokenClasses.bg} ${tokenClasses.text}`}
    >
      {meta.label}
    </span>
  );
}

export default function StatusPollingDemo() {
  // Test adoption polling
  const { data: adoptionData, statusChanged: adoptionStatusChanged, isLoading: adoptionLoading } =
    useRealTimeStatusPolling("adoption", "adoption-1", { intervalMs: 5000 });

  // Test custody polling
  const { data: custodyData, statusChanged: custodyStatusChanged, isLoading: custodyLoading } =
    useRealTimeStatusPolling("custody", "custody-1", { intervalMs: 7000 });

  const adoptionTokenClasses = STATUS_COLOR_CLASSES[
    getStatusMeta("adoption", adoptionData?.status ?? "").color
  ];
  const custodyTokenClasses = STATUS_COLOR_CLASSES[
    getStatusMeta("custody", custodyData?.status ?? "").color
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Real-time Status Polling Demo
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Adoption Status */}
          <div className={`bg-white rounded-lg shadow-md p-6 border-2 ${adoptionStatusChanged ? `${adoptionTokenClasses.border} animate-pulse` : 'border-gray-200'
            }`}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Adoption Status
            </h2>

            {adoptionLoading ? (
              <div className="text-gray-700">Loading adoption status...</div>
            ) : adoptionData ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">ID:</span>
                  <span className="text-gray-600">{adoptionData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <StatusPill domain="adoption" status={adoptionData.status} />
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Pet ID:</span>
                  <span className="text-gray-600">{adoptionData.petId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Adopter ID:</span>
                  <span className="text-gray-600">
                    {'adopterId' in adoptionData ? adoptionData.adopterId : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Updated:</span>
                  <span className="text-gray-600">
                    {new Date(adoptionData.updatedAt).toLocaleTimeString()}
                  </span>
                </div>
                {adoptionStatusChanged && (
                  <div
                    className={`mt-3 p-2 rounded text-sm ${adoptionTokenClasses.softBg} ${adoptionTokenClasses.text}`}
                  >
                    ✨ Status changed recently!
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-500">Failed to load adoption data</div>
            )}
          </div>

          {/* Custody Status */}
          <div className={`bg-white rounded-lg shadow-md p-6 border-2 ${custodyStatusChanged ? `${custodyTokenClasses.border} animate-pulse` : 'border-gray-200'
            }`}>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Custody Status
            </h2>

            {custodyLoading ? (
              <div className="text-gray-700">Loading custody status...</div>
            ) : custodyData ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">ID:</span>
                  <span className="text-gray-600">{custodyData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <StatusPill domain="custody" status={custodyData.status} />
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Pet ID:</span>
                  <span className="text-gray-600">{custodyData.petId}</span>
                </div>
                {'custodianId' in custodyData && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium">Custodian:</span>
                      <span className="text-gray-600">{custodyData.custodianId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Owner:</span>
                      <span className="text-gray-600">{custodyData.ownerId}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">Updated:</span>
                  <span className="text-gray-600">
                    {new Date(custodyData.updatedAt).toLocaleTimeString()}
                  </span>
                </div>
                {custodyStatusChanged && (
                  <div
                    className={`mt-3 p-2 rounded text-sm ${custodyTokenClasses.softBg} ${custodyTokenClasses.text}`}
                  >
                    ✨ Status changed recently!
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-500">Failed to load custody data</div>
            )}
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">How this works:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Adoption status polls every 5 seconds</li>
            <li>• Custody status polls every 7 seconds</li>
            <li>• Border pulses and shows notification when status changes</li>
            <li>• Polling stops automatically when status is COMPLETED or CANCELLED</li>
            <li>• Uses mock data via MSW (Mock Service Worker)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
