import React from 'react';
import { cn } from '../lib/utils';

interface ScoreRingProps {
  score: number | null | undefined;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 84,
  strokeWidth = 7,
  label,
  className,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const hasScore = typeof score === 'number' && !isNaN(score);
  const normalizedScore = hasScore ? Math.max(0, Math.min(100, Math.round(score!))) : 0;
  const strokeDashoffset = hasScore
    ? circumference - (normalizedScore / 100) * circumference
    : circumference;

  let strokeColor = 'stroke-[#DDD3FF]';
  let textColor = 'text-[#77718B]';

  if (hasScore) {
    if (normalizedScore >= 80) {
      strokeColor = 'stroke-[#46B88A]';
      textColor = 'text-[#267E5A]';
    } else if (normalizedScore >= 60) {
      strokeColor = 'stroke-[#8B70D6]';
      textColor = 'text-[#674BB4]';
    } else if (normalizedScore >= 40) {
      strokeColor = 'stroke-[#F48B62]';
      textColor = 'text-[#C8572A]';
    } else {
      strokeColor = 'stroke-rose-400';
      textColor = 'text-rose-600';
    }
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-1.5', className)}>
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-[#EDE7FF]"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={cn('transition-all duration-700 ease-out', strokeColor)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={cn('font-heading font-extrabold tracking-tight', textColor, size >= 100 ? 'text-2xl' : 'text-lg')}>
            {hasScore ? normalizedScore : '–'}
          </span>
          {hasScore && (
            <span className="text-[10px] text-[#77718B] font-medium -mt-1">/100</span>
          )}
        </div>
      </div>
      {label && (
        <span className="text-xs font-semibold text-[#77718B] text-center">{label}</span>
      )}
    </div>
  );
};
