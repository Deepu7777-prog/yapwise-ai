import React from 'react';
import { CheckCircle2, AlertTriangle, Lightbulb, Volume2, VolumeX, Sparkles, Award } from 'lucide-react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface FeedbackCardProps {
  overallScore: number;
  clarityScore: number;
  fluencyScore: number;
  vocabularyScore: number;
  confidenceScore: number;
  wpm?: number;
  fillerCount?: number;
  fillerBreakdown?: Record<string, number>;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
  overallScore,
  clarityScore,
  fluencyScore,
  vocabularyScore,
  confidenceScore,
  wpm,
  fillerCount,
  fillerBreakdown,
  summary,
  strengths,
  weaknesses,
  recommendations,
}) => {
  const { isSpeaking, speak, stop } = useSpeechSynthesis();

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stop();
    } else {
      const speechScript = `Executive communication score: ${Math.round(overallScore)} out of 100. ${summary}`;
      speak(speechScript);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 70) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              AI Executive Feedback
            </h3>
            <p className="text-xs text-slate-400">Personalized communication & articulation analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleSpeak}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isSpeaking
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            {isSpeaking ? 'Stop Audio' : 'Listen Feedback'}
          </button>

          <div className={`px-4 py-2 rounded-xl border text-center ${getScoreColor(overallScore)}`}>
            <div className="text-2xl font-black">{Math.round(overallScore)}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider">Overall Score</div>
          </div>
        </div>
      </div>

      {/* Summary note */}
      {summary && (
        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 text-sm text-slate-200 leading-relaxed">
          <span className="font-semibold text-brand-400 mr-2">Coach Insight:</span>
          {summary}
        </div>
      )}

      {/* Metric Breakdown Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">Clarity & Diction</div>
          <div className="text-lg font-bold text-slate-100 mt-0.5">{Math.round(clarityScore)}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-brand-500 h-full rounded-full" style={{ width: `${clarityScore}%` }} />
          </div>
        </div>

        <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">Pacing & Fluency</div>
          <div className="text-lg font-bold text-slate-100 mt-0.5">
            {wpm ? `${wpm} WPM` : `${Math.round(fluencyScore)}%`}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${fluencyScore}%` }} />
          </div>
        </div>

        <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">Filler Words</div>
          <div className="text-lg font-bold text-slate-100 mt-0.5">
            {fillerCount !== undefined ? `${fillerCount} detected` : `${Math.round(vocabularyScore)}%`}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                (fillerCount || 0) <= 2 ? 'bg-emerald-500' : (fillerCount || 0) <= 5 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.max(10, 100 - (fillerCount || 0) * 12)}%` }}
            />
          </div>
        </div>

        <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">Vocal Confidence</div>
          <div className="text-lg font-bold text-slate-100 mt-0.5">{Math.round(confidenceScore)}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${confidenceScore}%` }} />
          </div>
        </div>
      </div>

      {/* Filler word pill tags if any */}
      {fillerBreakdown && Object.keys(fillerBreakdown).length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400">Filler tags:</span>
          {Object.entries(fillerBreakdown).map(([word, count]) => (
            <span
              key={word}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-rose-500/10 border border-rose-500/30 text-rose-300"
            >
              <span>"{word}"</span>
              <span className="bg-rose-500/20 px-1 rounded font-bold">×{count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Strengths */}
        <div className="space-y-2.5 p-4 rounded-xl bg-slate-900/30 border border-slate-800/60">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Key Strengths
          </h4>
          <ul className="space-y-1.5">
            {strengths.map((item, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Growth Areas */}
        <div className="space-y-2.5 p-4 rounded-xl bg-slate-900/30 border border-slate-800/60">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Areas for Growth
          </h4>
          <ul className="space-y-1.5">
            {weaknesses.map((item, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actionable Drills */}
      {recommendations.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-brand-950/40 to-slate-900/40 border border-brand-500/20 space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-300 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-brand-400" />
            Actionable Next Drills
          </h4>
          <div className="space-y-1.5">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
