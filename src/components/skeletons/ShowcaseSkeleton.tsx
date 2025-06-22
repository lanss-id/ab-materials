import React from 'react';

const Shimmer: React.FC = () => (
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />
);

const SkeletonBox: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`relative overflow-hidden rounded-md bg-slate-200 ${className}`}>
    <Shimmer />
  </div>
);

const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-full">
    <div className="p-6 pb-2">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <SkeletonBox className="h-5 w-1/4 rounded-full" />
        <SkeletonBox className="h-5 w-1/3 rounded-full" />
      </div>
    </div>
    <div className="p-6 pt-0 flex-grow">
      <SkeletonBox className="h-6 w-3/4 mb-4" />
      <div className="space-y-2 mb-4 border-t border-b border-slate-100 py-3">
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-5/6" />
      </div>
      <SkeletonBox className="h-8 w-1/2 mb-4" />
      <SkeletonBox className="h-10 w-full mb-3" />
    </div>
    <div className="px-6 pb-6 bg-slate-50 pt-4 border-t">
      <SkeletonBox className="h-12 w-full rounded-lg" />
    </div>
  </div>
);

const ShowcaseSkeleton: React.FC = () => {
  return (
    <div className="space-y-12">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b">
            <SkeletonBox className="h-8 w-1/4 mb-2" />
            <SkeletonBox className="h-4 w-1/2" />
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, j) => (
                <CardSkeleton key={j} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShowcaseSkeleton; 