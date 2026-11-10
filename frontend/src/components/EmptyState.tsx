import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionLink?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Sparkles,
  title,
  description,
  actionText,
  onAction,
  actionLink,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-8 sm:p-12 rounded-3xl bg-white border border-[#EDE7FF] text-center flex flex-col items-center justify-center max-w-lg mx-auto my-6 shadow-sm',
        className
      )}
    >
      <div className="w-16 h-16 rounded-3xl bg-[#EDE7FF] text-[#8B70D6] flex items-center justify-center mb-4 shadow-sm">
        <Icon className="w-8 h-8" />
      </div>

      <h3 className="font-heading font-bold text-lg text-[#29243A] mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-[#77718B] leading-relaxed max-w-sm mb-6">{description}</p>

      {actionText && (
        <>
          {actionLink ? (
            <Link to={actionLink}>
              <Button variant="primary">{actionText}</Button>
            </Link>
          ) : (
            <Button variant="primary" onClick={onAction}>
              {actionText}
            </Button>
          )}
        </>
      )}
    </div>
  );
};
