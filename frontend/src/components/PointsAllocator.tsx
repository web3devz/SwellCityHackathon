import React from "react";

type PointsAllocatorProps = {
  allocated: number;
  total: number;
};

export default function PointsAllocator({
  allocated,
  total,
}: PointsAllocatorProps) {
  const isExceeded = allocated > total;

  return (
    <div className="flex items-center justify-center text-zinc-400 text-sm">
      <span
        className={`font-medium ${isExceeded ? "text-red-500" : "text-white"}`}
      >
        {allocated}
      </span>
      <span className="mx-1">of</span>
      <span className="font-medium text-white">{total}</span>
      <span className="ml-1">strategy points allocated</span>
      {isExceeded && (
        <span className="ml-2 text-red-500">(Exceeded maximum points)</span>
      )}
    </div>
  );
}
