import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'mint' | 'peach';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, isLoading, disabled, children, ...props }, ref) => {
    const isBusy = loading || isLoading || false;
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B70D6] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-[#8B70D6] hover:bg-[#7A5EC8] text-white shadow-sm hover:shadow-[0_4px_16px_rgba(139,112,214,0.35)]',
      secondary:
        'bg-[#EDE7FF] hover:bg-[#DDD3FF] text-[#674BB4] font-semibold border border-[#DDD3FF]',
      outline:
        'bg-white hover:bg-[#FAF8FF] text-[#29243A] border border-[#DDD3FF] hover:border-[#8B70D6]',
      ghost:
        'bg-transparent hover:bg-[#EDE7FF]/60 text-[#77718B] hover:text-[#29243A]',
      danger:
        'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200',
      mint:
        'bg-[#E1F7EE] hover:bg-[#BDEBD9] text-[#267E5A] font-semibold border border-[#BDEBD9]',
      peach:
        'bg-[#FFEBE2] hover:bg-[#FFD9C9] text-[#C8572A] font-semibold border border-[#FFD9C9]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-xs sm:text-sm px-4 py-2.5 gap-2',
      lg: 'text-sm sm:text-base px-6 py-3 gap-2.5 rounded-2xl',
      icon: 'p-2.5 aspect-square rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isBusy}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isBusy && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0 mr-1" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
