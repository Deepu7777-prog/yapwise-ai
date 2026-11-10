import React, { useState } from 'react';
import { Evaluation } from '../lib/types';
import { ChevronDown, ChevronUp, Sparkles, CheckCircle2, Lightbulb } from 'lucide-react';
import { ScoreRing } from './ScoreRing';
import { SkillBar } from './SkillBar';
import { MistakeList } from './MistakeList';
import { cn } from '../lib/utils';
import { Badge } from './ui/Badge';

interface EvaluationCardProps {
  evaluation: Evaluation | null | undefined;
  defaultOpen?: boolean;
  title?: string;
  className?: string;
}

export const EvaluationCard: React.FC<EvaluationCardProps> = ({
  evaluation,
  defaultOpen = false,
  title = 'AI Evaluation & Feedback',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!evaluation) {
    return null;
  }

  const hasAnyScore =
    evaluation.overall !== null ||
    evaluation.grammar !== null ||
    evaluation.vocabulary !== null ||
    evaluation.clarity !== null ||
    evaluation.content !== null;

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#EDE7FF] bg-white shadow-sm overflow-hidden transition-all duration-200 text-[#29243A]',
        isOpen ? 'shadow-md border-[#DDD3FF]' : 'hover:border-[#DDD3FF]',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-[#FAF8FF]"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#EDE7FF] text-[#674BB4]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-[#29243A] block">{title}</span>
            <div className="flex items-center gap-2 mt-0.5">
              {hasAnyScore ? (
                <span className="text-xs font-semibold text-[#8B70D6]">
                  Overall Score: {evaluation.overall ?? 'N/A'}/100
                </span>
              ) : (
                <span className="text-xs text-[#77718B]">Feedback available</span>
              )}
              {evaluation.mistakes && evaluation.mistakes.length > 0 && (
                <Badge variant="peach" className="text-[10px] py-0 px-2 font-bold">
                  {evaluation.mistakes.length} correction{evaluation.mistakes.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[#77718B]">
          <span className="text-xs font-medium hidden sm:inline">
            {isOpen ? 'Collapse' : 'View feedback'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-3 border-t border-[#EDE7FF] space-y-4 animate-fade-up">
          {/* Top scores section */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center bg-[#FAF8FF] p-4 rounded-2xl border border-[#EDE7FF]">
            <div className="md:col-span-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#EDE7FF] pb-3 md:pb-0 md:pr-3">
              <ScoreRing score={evaluation.overall} size={76} strokeWidth={6} label="Overall Score" />
            </div>

            <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SkillBar label="Grammar" score={evaluation.grammar} />
              <SkillBar label="Vocabulary" score={evaluation.vocabulary} />
              <SkillBar label="Clarity" score={evaluation.clarity} />
              <SkillBar label="Content" score={evaluation.content} />
            </div>
          </div>

          {/* Qualitative Feedback Text */}
          {evaluation.feedback && (
            <div className="p-3.5 rounded-2xl bg-[#EDE7FF]/60 border border-[#DDD3FF] text-xs text-[#29243A] leading-relaxed">
              <p className="font-bold text-[#674BB4] mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI Coach Assessment:
              </p>
              {evaluation.feedback}
            </div>
          )}

          {/* Tip / Recommendation if present */}
          {evaluation.tip && (
            <div className="p-3.5 rounded-2xl bg-[#FFEBE2] border border-[#FFD9C9] text-xs text-[#C8572A] leading-relaxed">
              <p className="font-bold text-[#C8572A] mb-1 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                Actionable Tip:
              </p>
              {evaluation.tip}
            </div>
          )}

          {/* Strengths */}
          {evaluation.strengths && evaluation.strengths.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#267E5A] uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Key Strengths
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {evaluation.strengths.map((str, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-[#267E5A] p-2.5 rounded-xl bg-[#E1F7EE] border border-[#BDEBD9] flex items-start gap-1.5"
                  >
                    <span className="font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mistakes with Corrections */}
          {evaluation.mistakes && evaluation.mistakes.length > 0 && (
            <MistakeList
              mistakes={evaluation.mistakes}
              title="Grammar & Vocabulary Refinements"
            />
          )}
        </div>
      )}
    </div>
  );
};
