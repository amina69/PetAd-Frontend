import React, { useState } from 'react';

export type ResolutionType = 'REFUND' | 'RELEASE' | 'SPLIT' | null;

export interface AdminDisputeResolutionFormData {
  resolutionType: ResolutionType;
  splitRatio?: { adopter: number; shelter: number };
  adminNote: string;
}

interface AdminDisputeResolutionFormProps {
  onSubmit: (data: AdminDisputeResolutionFormData) => void;
  isSubmitting?: boolean;
}

export function AdminDisputeResolutionForm({ onSubmit, isSubmitting = false }: AdminDisputeResolutionFormProps) {
  const [resolutionType, setResolutionType] = useState<ResolutionType>(null);
  const [adopterSplit, setAdopterSplit] = useState<number>(50);
  const [adminNote, setAdminNote] = useState<string>('');

  const shelterSplit = 100 - adopterSplit;
  
  const isNoteValid = adminNote.length >= 10;
  // If resolutionType is SPLIT, it's valid if they sum to 100 (which they always do due to the sliders logic below)
  const isFormValid = resolutionType !== null && isNoteValid && !isSubmitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    onSubmit({
      resolutionType,
      ...(resolutionType === 'SPLIT' ? { splitRatio: { adopter: adopterSplit, shelter: shelterSplit } } : {}),
      adminNote,
    });
  };

  const handleAdopterSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setAdopterSplit(val);
  };

  const handleShelterSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setAdopterSplit(100 - val);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 max-w-lg w-full">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">Resolve Dispute</h2>

      <div className="mb-6 space-y-4">
        <label className="block text-sm font-semibold text-gray-700">Resolution Type</label>

        <div className="space-y-3">
          {/* REFUND */}
          <div className={`block border p-4 rounded-lg transition-colors ${resolutionType === 'REFUND' ? 'border-primary-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
            <label htmlFor="res-refund" className="flex items-center cursor-pointer">
              <input
                id="res-refund"
                type="radio"
                name="resolutionType"
                value="REFUND"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                checked={resolutionType === 'REFUND'}
                onChange={() => setResolutionType('REFUND')}
              />
              <span className="ml-3 font-medium text-gray-900">REFUND</span>
            </label>
            <p className="ml-7 mt-1 text-sm text-gray-500">Return the escrow funds back to the adopter. The shelter will not receive payment.</p>
          </div>

          {/* RELEASE */}
          <div className={`block border p-4 rounded-lg transition-colors ${resolutionType === 'RELEASE' ? 'border-primary-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
            <label htmlFor="res-release" className="flex items-center cursor-pointer">
              <input
                id="res-release"
                type="radio"
                name="resolutionType"
                value="RELEASE"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                checked={resolutionType === 'RELEASE'}
                onChange={() => setResolutionType('RELEASE')}
              />
              <span className="ml-3 font-medium text-gray-900">RELEASE</span>
            </label>
            <p className="ml-7 mt-1 text-sm text-gray-500">Release the escrow funds to the shelter. The adopter will not receive a refund.</p>
          </div>

          {/* SPLIT */}
          <div className={`block border p-4 rounded-lg transition-colors ${resolutionType === 'SPLIT' ? 'border-primary-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
            <label htmlFor="res-split" className="flex items-center cursor-pointer">
              <input
                id="res-split"
                type="radio"
                name="resolutionType"
                value="SPLIT"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                checked={resolutionType === 'SPLIT'}
                onChange={() => setResolutionType('SPLIT')}
              />
              <span className="ml-3 font-medium text-gray-900">SPLIT</span>
            </label>
            <p className="ml-7 mt-1 text-sm text-gray-500">Divide the escrow funds between the adopter and shelter based on the specified percentages.</p>
          </div>
        </div>
      </div>

      {resolutionType === 'SPLIT' && (
        <div className="mb-6 p-5 border border-gray-200 rounded-lg bg-gray-50 space-y-5">
          <h3 className="text-sm font-semibold text-gray-700">Set Custom Split Ratio</h3>
          
          {/* Adopter Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label htmlFor="adopter-slider" className="text-sm font-medium text-gray-700">
                Adopter: {adopterSplit}%
              </label>
            </div>
            <input
              id="adopter-slider"
              type="range"
              min="0"
              max="100"
              value={adopterSplit}
              onChange={handleAdopterSliderChange}
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Shelter Slider */}
          <div>
            <div className="flex justify-between mb-2">
              <label htmlFor="shelter-slider" className="text-sm font-medium text-gray-700">
                Shelter: {shelterSplit}%
              </label>
            </div>
            <input
              id="shelter-slider"
              type="range"
              min="0"
              max="100"
              value={shelterSplit}
              onChange={handleShelterSliderChange}
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div className="mb-6">
        <label htmlFor="adminNote" className="block text-sm font-semibold text-gray-700 mb-2">
          Admin Note <span className="text-red-500">*</span>
        </label>
        <textarea
          id="adminNote"
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder="Enter detailed reasoning for this resolution..."
          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
            adminNote.length > 0 && !isNoteValid ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          }`}
          rows={4}
        />
        {adminNote.length > 0 && !isNoteValid ? (
          <p className="mt-2 text-sm font-medium text-red-500">
            Admin note must be at least 10 characters long
          </p>
        ) : null}
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className={`px-5 py-2.5 font-medium rounded-lg text-white transition-colors w-full ${
            !isFormValid || isSubmitting
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {isSubmitting ? 'Resolving...' : 'Resolve Dispute'}
        </button>
      </div>
    </form>
  );
} 