import { useParams } from 'react-router-dom';
import { useDisputeDetail } from '../../hooks/useDisputeDetail';
import { DisputeInfoSection } from '../../components/dispute/DisputeInfoSection';
import { SkeletonLoader } from '../../components/loaders/SkeletonLoader';

export function DisputeDetailPage() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const { data, isLoading } = useDisputeDetail(disputeId || '');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dispute Details</h1>
        
        {isLoading ? (
          <div className="bg-white shadow rounded-lg p-6">
            <SkeletonLoader />
          </div>
        ) : data ? (
          <DisputeInfoSection dispute={data} />
        ) : (
          <div className="bg-red-50 text-red-600 p-4 rounded-md">
            Dispute not found.
          </div>
        )}
      </div>
    </div>
  );
}

export default DisputeDetailPage;
