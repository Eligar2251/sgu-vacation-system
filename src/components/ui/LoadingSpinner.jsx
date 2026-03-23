import React from 'react';

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} border-3 border-sgu-blue/20 border-t-sgu-blue rounded-full animate-spin`}
      />
    </div>
  );
};

export const LoadingScreen = ({ message = 'Загрузка...' }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="flex flex-col items-center gap-6">
      <div className="w-16 h-16 border-4 border-sgu-blue/20 border-t-sgu-blue rounded-full animate-spin" />
      <p className="text-lg text-gray-600 font-medium">{message}</p>
    </div>
  </div>
);

export const SkeletonCard = () => (
  <div className="card">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl skeleton" />
      <div className="flex-1 space-y-3">
        <div className="h-5 w-3/4 skeleton" />
        <div className="h-4 w-1/2 skeleton" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-4 skeleton" />
      <div className="h-4 w-5/6 skeleton" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 p-4 bg-white rounded-xl">
        <div className="w-10 h-10 rounded-lg skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 skeleton" />
          <div className="h-3 w-1/4 skeleton" />
        </div>
        <div className="w-24 h-8 skeleton rounded-full" />
      </div>
    ))}
  </div>
);

export default LoadingSpinner;