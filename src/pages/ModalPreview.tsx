import { useState } from "react";
import { RatingModal } from "../components/ui/RatingModal";
import { adoptionService } from "../api/adoptionService";

export default function ModalPreview() {
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleSubmit = async (rating: number, feedback: string) => {
    await adoptionService.submitRating({
      rating,
      feedback,
      adoptionId: "test-adoption-1",
      petId: "test-pet-1",
    });
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleReopen = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Rating Modal Preview
        </h1>
        <p className="text-gray-600 mb-8">
          Preview the rating modal component with all functionality.
        </p>
        
        <div className="space-y-4 mb-8">
          <div className="text-left bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Features:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Interactive 5-star rating system</li>
              <li>• Feedback text area with character limit</li>
              <li>• Form validation (rating required)</li>
              <li>• Success state confirmation</li>
              <li>• Responsive design</li>
              <li>• Accessibility features</li>
            </ul>
          </div>
          
          <div className="text-left bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Test Scenarios:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Try selecting different star ratings</li>
              <li>• Test hover effects on stars</li>
              <li>• Enter feedback text (max 500 chars)</li>
              <li>• Try submitting without rating (should show error)</li>
              <li>• Submit valid rating and feedback</li>
              <li>• Test responsive design (resize window)</li>
            </ul>
          </div>
        </div>
        
        {!isModalOpen && (
          <button
            onClick={handleReopen}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reopen Modal
          </button>
        )}
      </div>

      <RatingModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        petName="Buddy"
      />
    </div>
  );
}
