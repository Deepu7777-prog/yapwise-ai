import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-[#29243A]">
            {label}
          </label>
        )}
        <input
          type={type}
          id={id}
          className={cn(
            'flex w-full rounded-xl border border-[#EDE7FF] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#29243A] placeholder:text-[#A59EBA]',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:border-[#8B70D6] focus-visible:ring-2 focus-visible:ring-[#8B70D6]/20',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
            error && 'border-rose-400 focus-visible:ring-rose-200',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
