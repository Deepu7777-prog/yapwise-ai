import React from 'react';
import { cn } from '../lib/utils';

interface SkillBarProps {
  label: string;
  score: number | null | undefined;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export const SkillBar: React.FC<SkillBarProps> = ({
  label,
  score,
  icon,
  description,
  className,
}) => {
  const hasScore = typeof score === 'number' && !isNaN(score);
  const normalized = hasScore ? Math.max(0, Math.min(100, Math.round(score!))) : 0;

  let barColor = 'bg-[#EDE7FF]';
  let badgeColor = 'text-[#77718B] bg-[#EDE7FF]/60 border-[#DDD3FF]';

  if (hasScore) {
    if (normalized >= 80) {
      barColor = 'bg-[#46B88A]';
      badgeColor = 'text-[#267E5A] bg-[#E1F7EE] border-[#BDEBD9]';
    } else if (normalized >= 60) {
      barColor = 'bg-[#8B70D6]';
      badgeColor = 'text-[#674BB4] bg-[#EDE7FF] border-[#DDD3FF]';
    } else if (normalized >= 40) {
      barColor = 'bg-[#F48B62]';
      badgeColor = 'text-[#C8572A] bg-[#FFEBE2] border-[#FFD9C9]';
    } else {
      barColor = 'bg-rose-400';
      badgeColor = 'text-rose-600 bg-rose-50 border-rose-200';
    }
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-[#29243A]">
          {icon}
          <span>{label}</span>
        </div>
        <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold border', badgeColor)}>
          {hasScore ? `${normalized}/100` : 'No data yet'}
        </span>
      </div>

      <div className="h-2.5 w-full bg-[#EDE7FF] rounded-full overflow-hidden border border-[#DDD3FF]/40">
        <div
          className={cn('h-full transition-all duration-500 ease-out rounded-full', barColor)}
          style={{ width: `${hasScore ? normalized : 0}%` }}
        />
      </div>

      {description && (
        <p className="text-[11px] text-[#77718B] leading-tight">{description}</p>
      )}
    </div>
  );
};
