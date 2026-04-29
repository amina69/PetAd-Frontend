import { DisputeResolutionSection } from "../components/dispute/DisputeResolutionSection";
import type { DisputeResolution, DisputeStatus } from "../types/dispute";
import { useState } from "react";

export default function DisputeUIPreview() {
  const [status, setStatus] = useState<DisputeStatus>("resolved");

  const splitResolution: DisputeResolution = {
    type: "SPLIT",
    adminNote: "Both parties agreed to a 50/50 split of the adoption fee due to a late health disclosure that didn't void the adoption but required immediate vet care.",
    resolvedBy: "Senior Admin Sarah",
    resolvedAt: new Date().toISOString(),
    resolutionTxHash: "GD77YI5L5...3B4J7", // Using Stellar format for realism
    splitData: [
      { recipient: "Shelter", amount: "125.00", percentage: 50 },
      { recipient: "Adopter", amount: "125.00", percentage: 50 },
    ],
  };

  const refundResolution: DisputeResolution = {
    type: "REFUND",
    adminNote: "Full refund issued to the adopter. The pet had a pre-existing condition not disclosed by the shelter.",
    resolvedBy: "Admin Mike",
    resolvedAt: new Date(Date.now() - 86400000).toISOString(),
    resolutionTxHash: "GBC45678...XYZ",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 space-y-12">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Dispute Resolution UI <span className="text-blue-600">Preview</span>
        </h1>
        <p className="text-lg text-gray-600">
          Visual testing for the resolution outcomes, supporting Refund, Release, and Split states.
        </p>
        
        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Toggle Status:</span>
          <button 
            onClick={() => setStatus(status === 'resolved' ? 'open' : 'resolved')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              status === 'resolved' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {status === 'resolved' ? 'Status: RESOLVED' : 'Status: OPEN'}
          </button>
          <span className="text-xs text-gray-400 italic">(Component should hide when status is OPEN)</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-12">
        {/* Split Outcome */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-blue-500 rounded-full" />
            <h2 className="text-xl font-bold text-gray-800">Scenario A: Split Outcome</h2>
          </div>
          <DisputeResolutionSection status={status} resolution={splitResolution} />
        </section>

        {/* Refund Outcome */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-orange-500 rounded-full" />
            <h2 className="text-xl font-bold text-gray-800">Scenario B: Full Refund</h2>
          </div>
          <DisputeResolutionSection status={status} resolution={refundResolution} />
        </section>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm space-y-2">
            <h3 className="font-bold text-gray-900">Dynamic Badges</h3>
            <p className="text-sm text-gray-500">Colors change automatically based on resolution type (Refund/Split/Release).</p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm space-y-2">
            <h3 className="font-bold text-gray-900">Stellar Integration</h3>
            <p className="text-sm text-gray-500">Transaction hashes link directly to the explorer using the configured network.</p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm space-y-2">
            <h3 className="font-bold text-gray-900">SLA Conscious</h3>
            <p className="text-sm text-gray-500">Component only reveals itself once a definitive resolution is reached.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
