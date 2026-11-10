import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'mint' | 'peach' | 'lavender' | 'rose' | 'amber';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#EDE7FF] text-[#674BB4] border-[#DDD3FF]',
    lavender: 'bg-[#EDE7FF] text-[#674BB4] border-[#DDD3FF]',
    mint: 'bg-[#E1F7EE] text-[#267E5A] border-[#BDEBD9]',
    peach: 'bg-[#FFEBE2] text-[#C8572A] border-[#FFD9C9]',
    outline: 'bg-white text-[#77718B] border-[#DDD3FF]',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
