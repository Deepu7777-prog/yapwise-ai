import React, { useState, useEffect } from 'react';
import { Users, Volume2, Sparkles, MessageSquare, Award, CheckCircle2, ShieldAlert, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { GDSession, GDTurn } from '../types';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

const GD_TOPICS = [
  'Is Artificial Intelligence accelerating workforce obsolescence or augmenting creative productivity?',
  'Should remote and asynchronous work become an internationally protected worker right?',
  'Monolithic vs. Microservices Architecture: Pragmatism vs. Premature Scalability in Startups',
  'Data Sovereignty vs. Globalized Cloud: Balancing National Security with Innovation',
];

export const GroupDiscussionPage: React.FC = () => {
  const [session, setSession] = useState<GDSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSubmittingTurn, setIsSubmittingTurn] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(GD_TOPICS[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { speak } = useSpeechSynthesis();

  const startGDSession = async (topicToUse?: string) => {
    setIsInitializing(true);
    setErrorMsg(null);
    const topic = topicToUse || selectedTopic;
    try {
      const data = await api.startGDSession({
        topic,
        category: 'Tech Ethics & Leadership',
      });
      setSession(data);
    } catch (err: any) {
      console.error('Failed to start GD chamber:', err);
      setErrorMsg(err.message || 'Failed to start group discussion with backend.');
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    startGDSession();
  }, []);

  const handleUserIntervention = async (argumentText: string) => {
    if (!session || isSubmittingTurn) return;
    setIsSubmittingTurn(true);
    setErrorMsg(null);

    try {
      const res = await api.submitGDTurn({
        session_id: session.id,
        user_argument: argumentText,
      });

      if (res.is_completed) {
        try {
          const finalSession = await api.getGDSession(session.id);
          setSession(finalSession);
        } catch {
          setSession((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              user_contributions_count: prev.user_contributions_count + 1,
              status: 'completed',
              turns: [...prev.turns, res.user_turn, ...res.ai_reactions],
            };
          });
        }
      } else {
        setSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            user_contributions_count: prev.user_contributions_count + 1,
            turns: [...prev.turns, res.user_turn, ...res.ai_reactions],
          };
        });
      }
    } catch (err: any) {
      console.error('Error submitting GD turn:', err);
      setErrorMsg(err.message || 'Error communicating with group discussion engine.');
    } finally {
      setIsSubmittingTurn(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'moderator':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'advocate':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'skeptic':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'user':
        return 'bg-brand-500/20 text-brand-300 border-brand-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Multi-Agent Discussion Arena</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Group Discussion Chamber</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Practice assertiveness, synthesizing viewpoints, and leadership etiquette alongside AI panel participants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => startGDSession()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium border border-slate-700 transition-colors"
          >
            New Debate
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Topic Card */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Discussion Motion</span>
        <p className="text-base sm:text-lg font-bold text-slate-100">"{session?.topic}"</p>
      </div>

      {isInitializing && (
        <div className="glass-panel rounded-2xl p-8 text-center border border-slate-800 space-y-3">
          <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Convening panel chamber with Elena, Priya, and Marcus...</p>
        </div>
      )}

      {/* Participant Chamber Avatars */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-purple-500/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-xs">
            E
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Elena</div>
            <div className="text-[10px] text-purple-400 font-medium">Moderator</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            P
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Priya</div>
            <div className="text-[10px] text-emerald-400 font-medium">Advocate</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-amber-500/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-xs">
            M
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Marcus</div>
            <div className="text-[10px] text-amber-400 font-medium">Skeptic</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-brand-500/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center font-bold text-xs">
            You
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Candidate</div>
            <div className="text-[10px] text-brand-400 font-medium">Interventions: {session?.user_contributions_count || 0}</div>
          </div>
        </div>
      </div>

      {/* Discussion Thread */}
      <div className="space-y-4">
        {session?.turns.map((turn) => {
          const isUser = turn.speaker_role === 'user';
          return (
            <div
              key={turn.id}
              className={`p-4 sm:p-5 rounded-2xl border space-y-2 ${
                isUser
                  ? 'bg-brand-950/30 border-brand-500/40 ml-4 sm:ml-12'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-100">{turn.speaker_name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleBadge(turn.speaker_role)}`}>
                    {turn.speaker_role.toUpperCase()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => speak(turn.content)}
                  className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Listen</span>
                </button>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{turn.content}</p>

              {/* Live Etiquette Feedback for User Intervention */}
              {turn.feedback_for_user && (
                <div className="mt-2 p-3 rounded-xl bg-slate-950/80 border border-brand-500/20 text-xs text-brand-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Live Coach Note:</strong> {turn.feedback_for_user}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Take the Floor (Speech / Typed Fallback) */}
      {session && session.status !== 'completed' && (
        <div className="pt-4">
          <div className="mb-2 text-xs font-bold text-slate-400 flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
            <span>Claim the floor: Build on Priya's points or address Marcus's concerns diplomatically</span>
          </div>
          <VoiceRecorder
            onTranscriptComplete={(transcript) => handleUserIntervention(transcript)}
            isSubmitting={isSubmittingTurn}
            placeholder="Enter your argument... e.g., 'I agree with Priya that automation spurs new opportunities, but Marcus is right about retraining lag...'"
          />
        </div>
      )}

      {/* Completed Summary Banner */}
      {session?.status === 'completed' && (
        <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 bg-amber-950/20 space-y-4">
          <div className="flex items-center gap-3 text-amber-400">
            <CheckCircle2 className="w-6 h-6" />
            <h3 className="text-lg font-bold">Group Discussion Consensus Reached!</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {session.summary_feedback || 'Demonstrated strong panel leadership, empathetic listening, and synthesized key viewpoints.'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Overall Score</div>
              <div className="text-lg font-bold text-amber-400">{Math.round(session.overall_score || 85)}%</div>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Leadership</div>
              <div className="text-lg font-bold text-purple-400">{Math.round(session.leadership_score || 84)}%</div>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Active Listening</div>
              <div className="text-lg font-bold text-emerald-400">{Math.round(session.active_listening_score || 88)}%</div>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">Assertiveness</div>
              <div className="text-lg font-bold text-cyan-400">{Math.round(session.assertiveness_score || 86)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
