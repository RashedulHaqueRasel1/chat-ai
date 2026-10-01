import React from 'react';

export const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 20 }) => {
  return (
    <div
      style={{ width: size, height: size }}
      className="inline-block animate-spin rounded-full border-2 border-indigo-500/20 border-t-indigo-500"
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
