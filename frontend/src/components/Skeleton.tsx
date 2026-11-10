import React from 'react';
import { cn } from '../lib/utils';

export const Skeleton: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-[#EDE7FF]/70', className)}
      style={style}
      aria-hidden="true"
    />
  );
};

export const CardSkeleton: React.FC<{ className?: string; rows?: number }> = ({
  className,
  rows = 3,
}) => {
  return (
    <div className={cn('p-6 rounded-2xl bg-white border border-[#EDE7FF] shadow-sm space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" style={{ width: `${85 - i * 15}%` }} />
        ))}
      </div>
    </div>
  );
};

export const StatSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('p-5 rounded-2xl bg-white border border-[#EDE7FF] shadow-sm space-y-2.5', className)}>
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
};

export const ListSkeleton: React.FC<{ items?: number; className?: string }> = ({
  items = 3,
  className,
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl bg-white border border-[#EDE7FF] flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
};
