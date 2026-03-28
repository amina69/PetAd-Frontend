import { useState } from "react";
import { AdoptionCompletionModal } from "../components/modals";
import type { AdoptionCompletionData } from "../components/modals";

export function AdoptionCompletionDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfirm = (data: AdoptionCompletionData) => {
    console.log("Adoption completion confirmed:", data);
    // Here you would typically send this data to your backend
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Adoption Completion Modal Demo
        </h1>
        <p className="text-gray-600 mb-8">
          Click the button below to test the modal
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-[#E84D2A] text-white font-semibold rounded-xl hover:bg-[#d4431f] transition-colors"
        >
          Open Adoption Completion Modal
        </button>
      </div>

      <AdoptionCompletionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        petName="Max"
      />
    </div>
  );
}
