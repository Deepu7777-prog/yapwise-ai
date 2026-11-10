import React from 'react';
import { AlertTriangle, RefreshCw, ZapOff } from 'lucide-react';
import { Button } from './ui/Button';
import { ApiError } from '../lib/api';
import { cn } from '../lib/utils';

interface ErrorBannerProps {
  error: Error | string | null | undefined;
  onRetry?: () => void;
  className?: string;
  isRetrying?: boolean;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onRetry,
  className,
  isRetrying = false,
}) => {
  if (!error) return null;

  let message = typeof error === 'string' ? error : error.message;
  let isAiIssue = false;

  if (error instanceof ApiError) {
    if (error.status === 503 || error.code === 'AI_QUOTA' || error.code === 'AI_UNAVAILABLE') {
      isAiIssue = true;
      message =
        'AI evaluation service is temporarily busy. Your input has been preserved in the box. Please click Retry below to resubmit.';
    }
  } else if (
    typeof message === 'string' &&
    (message.toLowerCase().includes('quota') ||
      message.toLowerCase().includes('503') ||
      message.toLowerCase().includes('temporarily unavailable'))
  ) {
    isAiIssue = true;
  }

  return (
    <div
      className={cn(
        'p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-fade-up shadow-sm',
        isAiIssue
          ? 'bg-[#FFEBE2] border-[#FFD9C9] text-[#C8572A]'
          : 'bg-rose-50 border-rose-200 text-rose-800',
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-xl flex-shrink-0 mt-0.5',
            isAiIssue ? 'bg-white text-[#C8572A] shadow-sm' : 'bg-white text-rose-500 shadow-sm'
          )}
        >
          {isAiIssue ? <ZapOff className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        </div>
        <div>
          <span className="font-bold text-sm block mb-0.5">
            {isAiIssue ? 'AI Evaluation Notice' : 'Notice'}
          </span>
          <p className="leading-relaxed opacity-90">{message}</p>
        </div>
      </div>

      {onRetry && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRetry}
          disabled={isRetrying}
          className="flex-shrink-0 self-end sm:self-center border-current bg-white shadow-sm"
        >
          <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', isRetrying && 'animate-spin')} />
          {isRetrying ? 'Retrying...' : 'Retry'}
        </Button>
      )}
    </div>
  );
};
