import React from 'react';
import { Mistake } from '../lib/types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from './ui/Badge';

interface MistakeListProps {
  mistakes: Mistake[];
  maxItems?: number;
  title?: string;
  emptyMessage?: string;
  className?: string;
}

export const MistakeList: React.FC<MistakeListProps> = ({
  mistakes,
  maxItems,
  title,
  emptyMessage = 'No repeated mistakes found. Great work!',
  className,
}) => {
  const displayed = maxItems ? mistakes.slice(0, maxItems) : mistakes;

  if (!mistakes || mistakes.length === 0) {
    return (
      <div className={cn('p-5 rounded-2xl bg-[#EDE7FF]/40 border border-[#DDD3FF]/60 text-center', className)}>
        <p className="text-xs text-[#77718B] font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {title && (
        <h4 className="text-xs font-bold text-[#77718B] uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-[#F48B62]" />
          {title}
        </h4>
      )}

      <div className="space-y-2.5">
        {displayed.map((m, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-white border border-[#EDE7FF] shadow-sm hover:border-[#DDD3FF] transition-colors space-y-2.5 text-xs"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Badge variant="lavender" className="text-[10px] uppercase font-bold">
                {m.category || 'grammar'}
              </Badge>
              {typeof m.count === 'number' && m.count > 1 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                  Seen {m.count}x
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800">
                <span className="block text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-0.5">
                  Said
                </span>
                <span className="font-medium line-through decoration-rose-400">"{m.original}"</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#E1F7EE] border border-[#BDEBD9] text-[#267E5A]">
                <span className="block text-[10px] font-bold text-[#267E5A] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#267E5A] inline" />
                  Better
                </span>
                <span className="font-bold">"{m.correction}"</span>
              </div>
            </div>

            {m.explanation && (
              <p className="text-[11px] text-[#77718B] leading-relaxed pt-1 border-t border-[#EDE7FF]">
                <span className="font-semibold text-[#29243A]">Why: </span>
                {m.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
