import { useState } from "react";
import { EscrowFundedBanner } from "../components/escrow/EscrowFundedBanner";

export default function EscrowBannerPreview() {
  const [adoptionId, setAdoptionId] = useState("AD-777");
  const [showBanner, setShowBanner] = useState(true);

  const reset = () => {
    sessionStorage.clear();
    setShowBanner(false);
    setTimeout(() => setShowBanner(true), 50);
  };

  const nextAdoption = () => {
    const nextId = `AD-${Math.floor(Math.random() * 1000)}`;
    setAdoptionId(nextId);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Escrow Funded Banner Preview</h1>
          <p className="text-gray-600 mt-2">Testing slide-in animation, dismissal, and cross-adoption persistence.</p>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear Storage & Reset
          </button>
          <button 
            onClick={nextAdoption}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Next Adoption ID ({adoptionId})
          </button>
        </div>

        <div className="border-t pt-8">
          {showBanner && (
            <EscrowFundedBanner
              adoptionId={adoptionId}
              petName="Milo the Golden"
              amount={250.00}
              currency="USDC"
              txHash="0xabcdef1234567890abcdef1234567890"
            />
          )}
          
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Page Content</h2>
            <p className="text-gray-600">
              This represents the main content of the Settlement Summary page. 
              The banner should slide in above this content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
