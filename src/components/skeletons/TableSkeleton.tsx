import React from 'react';

const Shimmer: React.FC = () => (
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />
);

const SkeletonBox: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`relative overflow-hidden rounded-md bg-slate-200 ${className}`}>
    <Shimmer />
  </div>
);

const TableSkeleton: React.FC = () => {
  const renderRows = (count: number) => 
    Array.from({ length: count }).map((_, i) => (
      <div key={i} className="grid grid-cols-12 gap-4 items-center p-4 border-t border-slate-200">
        <div className="col-span-4 flex items-center space-x-3">
          <SkeletonBox className="h-12 w-12" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 w-3/4" />
            <SkeletonBox className="h-3 w-1/2" />
          </div>
        </div>
        <div className="col-span-3">
          <SkeletonBox className="h-4 w-full" />
        </div>
        <div className="col-span-2">
          <SkeletonBox className="h-4 w-1/2" />
        </div>
        <div className="col-span-3">
          <SkeletonBox className="h-10 w-full" />
        </div>
      </div>
    ));

  return (
    <div className="w-full">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="mb-8 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Category Header */}
          <div className="p-4 bg-slate-100/80">
            <SkeletonBox className="h-8 w-1/3" />
          </div>
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 text-sm font-semibold text-slate-500 border-b bg-white">
            <div className="col-span-4">Produk</div>
            <div className="col-span-3">Spesifikasi</div>
            <div className="col-span-2">Harga</div>
            <div className="col-span-3">Jumlah</div>
          </div>
          {/* Table Rows */}
          {renderRows(4)}
        </div>
      ))}
    </div>
  );
};

export default TableSkeleton; 