import React from 'react';

interface Props {
  onClick: () => void;
}

export function AddEvidenceButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      aria-label="Add Evidence"
    >
      + Add Evidence
    </button>
  );
}
