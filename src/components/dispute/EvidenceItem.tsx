import React from 'react';
import type { EvidenceFile } from '../../pages/disputes/types';

interface Props {
  evidence: EvidenceFile;
}

export function EvidenceItem({ evidence }: Props) {
  const truncatedHash = `${evidence.sha256.slice(0, 8)}...${evidence.sha256.slice(-8)}`;

  return (
    <li className="py-4 flex items-center justify-between space-x-4 bg-white rounded-md border border-gray-200 px-4 mb-3 shadow-sm">
      <div className="flex flex-col min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">
          {evidence.fileName}
        </p>
        <div className="flex items-center mt-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800" title={evidence.sha256}>
            SHA-256: {truncatedHash}
          </span>
        </div>
      </div>
      <div>
        <a
          href={evidence.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-900"
          aria-label={`Download ${evidence.fileName}`}
        >
          Download
        </a>
      </div>
    </li>
  );
}
