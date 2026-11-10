import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined || isNaN(score)) {
    return 'No data';
  }
  return `${Math.round(score)}`;
}

export function getScoreColor(score: number | null | undefined): {
  text: string;
  bg: string;
  border: string;
  ring: string;
} {
  if (score === null || score === undefined || isNaN(score)) {
    return {
      text: 'text-[#77718B]',
      bg: 'bg-[#EDE7FF]/50',
      border: 'border-[#DDD3FF]',
      ring: 'stroke-[#DDD3FF]',
    };
  }
  if (score >= 80) {
    return {
      text: 'text-[#267E5A]',
      bg: 'bg-[#E1F7EE]',
      border: 'border-[#BDEBD9]',
      ring: 'stroke-[#46B88A]',
    };
  }
  if (score >= 60) {
    return {
      text: 'text-[#674BB4]',
      bg: 'bg-[#EDE7FF]',
      border: 'border-[#DDD3FF]',
      ring: 'stroke-[#8B70D6]',
    };
  }
  return {
    text: 'text-[#C8572A]',
    bg: 'bg-[#FFEBE2]',
    border: 'border-[#FFD9C9]',
    ring: 'stroke-[#F48B62]',
  };
}

export function getLevelBadge(level: string): {
  label: string;
  className: string;
} {
  const norm = (level || 'beginner').toLowerCase();
  switch (norm) {
    case 'advanced':
      return {
        label: 'Advanced',
        className: 'bg-[#FFEBE2] text-[#C8572A] border-[#FFD9C9]',
      };
    case 'intermediate':
      return {
        label: 'Intermediate',
        className: 'bg-[#EDE7FF] text-[#674BB4] border-[#DDD3FF]',
      };
    default:
      return {
        label: 'Beginner',
        className: 'bg-[#E1F7EE] text-[#267E5A] border-[#BDEBD9]',
      };
  }
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatTime(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
