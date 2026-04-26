import React from 'react';

export function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-4" data-testid="skeleton-loader">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-8 bg-gray-200 rounded w-1/3 mt-6"></div>
    </div>
  );
}
