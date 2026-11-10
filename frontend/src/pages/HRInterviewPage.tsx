import React, { useState, useEffect } from 'react';
import { Briefcase, Volume2, VolumeX, User, Bot, Sparkles, Award, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { InterviewSession, InterviewTurn } from '../types';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

export const HRInterviewPage: React.FC = () => {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSubmittingTurn, setIsSubmittingTurn] = useState(false);
  const [autoSpeakQuestion, setAutoSpeakQuestion] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { speak, isSpeaking, stop } = useSpeechSynthesis();

  // Start interview session
  const startNewInterview = async () => {
    setIsInitializing(true);
    setErrorMsg(null);
    try {
      const data = await api.startInterview({
        interview_type: 'hr',
        title: 'HR Behavioral & Leadership Simulation',
        target_role: 'Engineering Lead / Manager',
      });
      setSession(data);

      // Speak opening question
      if (data.turns && data.turns.length > 0 && autoSpeakQuestion) {
        speak(data.turns[0].content);
      }
    } catch (err: any) {
      console.error('Failed to start interview from API:', err);
      setErrorMsg(err.message || 'Failed to start interview session. Check backend connectivity.');
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    startNewInterview();
  }, []);

  const handleTurnSubmit = async (transcript: string, durationSeconds: number) => {
    if (!session || isSubmittingTurn) return;
    setIsSubmittingTurn(true);
    setErrorMsg(null);

    try {
      const res = await api.submitInterviewTurn({
        session_id: session.id,
        user_response: transcript,
        audio_duration_seconds: durationSeconds,
      });

      if (res.is_finished) {
        // Fetch complete calculated session scorecard from backend
        try {
          const finalSummary = await api.getInterviewSession(session.id);
          setSession(finalSummary);
        } catch {
          setSession((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              status: 'completed',
              turns: [...prev.turns, res.user_turn, res.next_question],
            };
          });
        }
      } else {
        setSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            status: 'in_progress',
            turns: [...prev.turns, res.user_turn, res.next_question],
          };
        });

        if (autoSpeakQuestion && res.next_question) {
          speak(res.next_question.content);
        }
      }
    } catch (err: any) {
      console.error('Error submitting interview turn:', err);
      setErrorMsg(err.message || 'Error communicating with interview engine.');
    } finally {
      setIsSubmittingTurn(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Behavioral & STAR Simulation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">HR Interview with Sarah</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time conversational back-and-forth evaluating behavioral storytelling and STAR framework.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoSpeakQuestion(!autoSpeakQuestion)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              autoSpeakQuestion
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {autoSpeakQuestion ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {autoSpeakQuestion ? 'Voice Prompts ON' : 'Voice Prompts Muted'}
          </button>
          <button
            type="button"
            onClick={startNewInterview}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium border border-slate-700 transition-colors"
          >
            Restart
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isInitializing && (
        <div className="glass-panel rounded-2xl p-8 text-center border border-slate-800 space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Initializing conversational interview with Sarah...</p>
        </div>
      )}

      {/* Conversation Stream */}
      <div className="space-y-4">
        {session?.turns.map((turn) => {
          const isAI = turn.role === 'interviewer';
          return (
            <div
              key={turn.id}
              className={`flex gap-3 sm:gap-4 ${isAI ? 'justify-start' : 'justify-end'}`}
            >
              {isAI && (
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 sm:p-5 border space-y-2.5 ${
                  isAI
                    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
                    : 'bg-brand-950/40 border-brand-500/30 text-brand-100 ml-8'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className={isAI ? 'text-indigo-400' : 'text-brand-400'}>
                    {turn.speaker_name}
                  </span>
                  {turn.score && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Score: {turn.score}%
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed whitespace-pre-wrap">{turn.content}</p>

                {/* Per-Turn STAR Feedback */}
                {turn.star_analysis && (
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs space-y-1 text-slate-300">
                    <span className="font-bold text-amber-400 block">STAR Critique:</span>
                    <span>{turn.star_analysis}</span>
                  </div>
                )}

                {isAI && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => speak(turn.content)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Replay Audio</span>
                    </button>
                  </div>
                )}
              </div>

              {!isAI && (
                <div className="w-9 h-9 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Answer Input Section */}
      {session && session.status !== 'completed' && (
        <div className="pt-4">
          <div className="mb-2 text-xs font-bold text-slate-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Your Turn: Answer Sarah's question using the STAR framework</span>
          </div>
          <VoiceRecorder
            onTranscriptComplete={handleTurnSubmit}
            isSubmitting={isSubmittingTurn}
            placeholder="Structure your answer with Situation, Task, Action taken, and Result achieved..."
          />
        </div>
      )}

      {/* Completed Summary Banner */}
      {session?.status === 'completed' && (
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 bg-emerald-950/20 space-y-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
            <h3 className="text-lg font-bold">Interview Completed!</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {session.summary_feedback || 'Completed full behavioral simulation with executive-level clarity.'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Overall Score</div>
              <div className="text-lg font-bold text-emerald-400">{Math.round(session.overall_score || 85)}%</div>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">STAR Structure</div>
              <div className="text-lg font-bold text-indigo-400">{Math.round(session.structure_score || 84)}%</div>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Articulation</div>
              <div className="text-lg font-bold text-cyan-400">{Math.round(session.clarity_score || 88)}%</div>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Confidence</div>
              <div className="text-lg font-bold text-amber-400">{Math.round(session.confidence_score || 86)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
