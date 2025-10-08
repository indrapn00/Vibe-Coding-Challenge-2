import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-slate-800 rounded-xl shadow-lg p-6 animate-pulse">
      <div className="h-6 bg-slate-700 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
      <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
      <div className="h-4 bg-slate-700 rounded w-5/6 mb-4"></div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 bg-slate-700 rounded-full"></div>
        <div className="h-6 w-20 bg-slate-700 rounded-full"></div>
        <div className="h-6 w-12 bg-slate-700 rounded-full"></div>
      </div>
      <div className="pt-4 border-t border-slate-700">
        <div className="h-5 w-28 bg-slate-700 rounded"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;