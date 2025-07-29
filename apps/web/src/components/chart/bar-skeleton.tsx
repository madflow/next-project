import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const BarSkeleton = () => {
  return (
    <div className="w-full max-w-2xl rounded-lg p-4">
      {/* Title */}
      <Skeleton className="mb-4 h-6 w-48" />

      {/* Chart Area */}
      <div className="flex h-64 items-end justify-around gap-2 rounded p-4">
        <Skeleton className="h-20 w-8" />
        <Skeleton className="h-32 w-8" />
        <Skeleton className="h-16 w-8" />
        <Skeleton className="h-28 w-8" />
        <Skeleton className="h-24 w-8" />
        <Skeleton className="h-36 w-8" />
      </div>
    </div>
  );
};

export default BarSkeleton;
