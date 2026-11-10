import React, { useState, useEffect } from 'react';
import { Mic, Sparkles, Shuffle, RefreshCw, Award, History, Volume2, AlertCircle, Clock } from 'lucide-react';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { FeedbackCard } from '../components/FeedbackCard';
import { api } from '../services/api';
import { PracticeSession } from '../types';

const SAMPLE_TOPICS = [
  'How will Generative AI transform software architecture over the next 5 years?',
  'Explain why continuous automated testing is critical for high-velocity teams.',
  'Describe how you make difficult engineering decisions when data is incomplete.',
  'Should remote engineering teams adopt asynchronous communication as default?',
  'How do you motivate a demoralized team after a major production incident?',
];

export const VoicePracticePage: React.FC = () => {
  const [topic, setTopic] = useState(SAMPLE_TOPICS[0]);
  const [mode, setMode] = useState<'extempore' | 'monologue' | 'pacing' | 'articulation'>('extempore');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentResult, setCurrentResult] = useState<PracticeSession | null>(null);
  const [history, setHistory] = useState<PracticeSession[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const data = await api.getPracticeHistory();
      setHistory(data);
    } catch (err: any) {
      console.warn('Could not fetch practice history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const randomizeTopic = () => {
    const remaining = SAMPLE_TOPICS.filter((t) => t !== topic);
    const chosen = remaining[Math.floor(Math.random() * remaining.length)];
    setTopic(chosen);
  };

  const handleTranscriptSubmit = async (transcript: string, durationSeconds: number) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const result = await api.evaluatePractice({
        title: `${mode.toUpperCase()} Exercise`,
        topic,
        mode,
        transcript,
        audio_duration_seconds: durationSeconds,
      });
      setCurrentResult(result);
      fetchHistory();
    } catch (err: any) {
      console.error('API evaluate error:', err);
      setErrorMsg(err.message || 'Failed to evaluate practice session with backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectHistoryItem = async (sessionId: number) => {
    try {
      const detail = await api.getPracticeSession(sessionId);
      setCurrentResult(detail);
      setTopic(detail.topic);
      window.scrollTo({ top: 400, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load historical session details.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold mb-2">
          <Mic className="w-3.5 h-3.5" />
          <span>Extempore & Speech Telemetry Lab</span>
        </div>
        <h1 className="text-3xl font-black text-white">Voice Practice Lab</h1>
        <p className="text-sm text-slate-400 mt-1">
          Speak out loud or type below. Gemini AI analyzes words per minute (WPM), filler pauses, clarity, and thematic coherence.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mode Selector */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'extempore', label: 'Impromptu / Extempore', desc: 'No prep, quick thinking' },
          { key: 'monologue', label: 'Structured Monologue', desc: 'Narrative storytelling' },
          { key: 'pacing', label: 'Cadence & Pacing', desc: 'Maintain 130-150 WPM' },
          { key: 'articulation', label: 'Diction & Articulation', desc: 'Clarity and consonant attack' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setMode(item.key as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              mode === item.key
                ? 'bg-brand-600 text-white border-brand-500 shadow-lg shadow-brand-500/20'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Prompt / Topic Card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Prompt Topic
          </span>
          <button
            type="button"
            onClick={randomizeTopic}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Randomize Prompt
          </button>
        </div>

        <p className="text-lg font-bold text-slate-100 leading-snug">"{topic}"</p>
      </div>

      {/* Dual Input Recorder (Speech Recognition + Typed Fallback) */}
      <VoiceRecorder
        onTranscriptComplete={handleTranscriptSubmit}
        isSubmitting={isSubmitting}
        placeholder={`Start speaking about: "${topic}"... or switch to Typed Fallback tab.`}
      />

      {/* Evaluation Results */}
      {currentResult && (
        <div className="pt-4">
          <FeedbackCard
            overallScore={currentResult.overall_score}
            clarityScore={currentResult.clarity_score}
            fluencyScore={currentResult.fluency_score}
            vocabularyScore={currentResult.vocabulary_score}
            confidenceScore={currentResult.confidence_score}
            wpm={currentResult.wpm}
            fillerCount={currentResult.filler_words_count}
            fillerBreakdown={currentResult.filler_words_breakdown}
            summary={currentResult.feedback_summary}
            strengths={currentResult.strengths}
            weaknesses={currentResult.weaknesses}
            recommendations={currentResult.recommendations}
          />
        </div>
      )}

      {/* Past Practice History from Backend */}
      {history.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-brand-400" />
            Recent Practice Sessions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectHistoryItem(item.id)}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-brand-500/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-brand-400 uppercase text-[10px]">{item.mode}</span>
                  <span className="font-bold text-slate-200">{Math.round(item.overall_score)}%</span>
                </div>
                <p className="text-xs text-slate-300 font-medium line-clamp-1 group-hover:text-white">
                  {item.topic}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                  <span>{item.wpm} WPM</span>
                  <span>{item.filler_words_count} fillers</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
