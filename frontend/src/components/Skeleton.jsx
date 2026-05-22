import React from 'react';

export const CardSkeleton = () => (
  <div className="p-6 border border-white/5 rounded-2xl bg-white/5 animate-pulse">
    <div className="flex justify-between items-center mb-4">
      <div className="w-1/3 h-4 rounded bg-white/10" />
      <div className="w-8 h-8 rounded-full bg-white/10" />
    </div>
    <div className="w-1/2 h-8 rounded bg-white/10 mb-2" />
    <div className="w-2/3 h-3 rounded bg-white/5" />
  </div>
);

export const GraphSkeleton = () => (
  <div className="p-6 border border-white/5 rounded-2xl bg-white/5 animate-pulse min-h-[300px] flex flex-col justify-between">
    <div className="w-1/4 h-5 rounded bg-white/10 mb-6" />
    <div className="flex-1 flex gap-4 items-end mb-4">
      <div className="flex-1 h-3/4 rounded bg-white/5" />
      <div className="flex-1 h-1/2 rounded bg-white/5" />
      <div className="flex-1 h-5/6 rounded bg-white/5" />
      <div className="flex-1 h-2/3 rounded bg-white/5" />
      <div className="flex-1 h-1/3 rounded bg-white/5" />
    </div>
    <div className="w-full h-2 rounded bg-white/10" />
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="w-full border border-white/5 rounded-2xl bg-white/5 overflow-hidden animate-pulse">
    {/* Header */}
    <div className="flex gap-4 p-4 border-b border-white/5 bg-white/5">
      <div className="flex-1 h-4 rounded bg-white/10" />
      <div className="flex-1 h-4 rounded bg-white/10" />
      <div className="flex-1 h-4 rounded bg-white/10" />
      <div className="flex-1 h-4 rounded bg-white/10" />
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, idx) => (
      <div key={idx} className="flex gap-4 p-4 border-b border-white/5">
        <div className="flex-1 h-3 rounded bg-white/5" />
        <div className="flex-1 h-3 rounded bg-white/5" />
        <div className="flex-1 h-3 rounded bg-white/5" />
        <div className="flex-1 h-3 rounded bg-white/5" />
      </div>
    ))}
  </div>
);

const Skeleton = {
  Card: CardSkeleton,
  Graph: GraphSkeleton,
  Table: TableSkeleton
};

export default Skeleton;
