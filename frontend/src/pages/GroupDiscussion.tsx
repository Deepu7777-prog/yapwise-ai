import React, { useState, useEffect, useRef } from 'react';
import { api, ApiError } from '../lib/api';
import {
  GDSession,
  GDSummary,
  GDParticipantTurn,
  Evaluation,
} from '../lib/types';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { VoiceInput } from '../components/VoiceInput';
import { EvaluationCard } from '../components/EvaluationCard';
import { ScoreRing } from '../components/ScoreRing';
import { MistakeList } from '../components/MistakeList';
import { ErrorBanner } from '../components/ErrorBanner';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Dialog } from '../components/ui/Dialog';
import {
  Users,
  Volume2,
  VolumeX,
  Sparkles,
  StopCircle,
  Play,
  RotateCcw,
  MessageSquare,
  Bot,
  User,
  CheckCircle2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  speaker: string;
  text: string;
  evaluation?: Evaluation | null;
  role: 'student' | 'ai';
}

const PARTICIPANT_COLORS: Record<string, { badge: string; avatar: string; pitch: number; tag: string }> = {
  Aarav: {
    badge: 'bg-[#EDE7FF] text-[#6949C6] border-[#D4C7F5]',
    avatar: 'bg-[#8B70D6] text-white',
    pitch: 0.9,
    tag: 'Analytical & Data-driven',
  },
  Meera: {
    badge: 'bg-[#E1F7EE] text-[#1D6A4E] border-[#BDEBD9]',
    avatar: 'bg-[#2E9B71] text-white',
    pitch: 1.2,
    tag: 'Human-centric & Practical',
  },
  Rohan: {
    badge: 'bg-[#FFF0E8] text-[#9A4B29] border-[#FFD9C9]',
    avatar: 'bg-[#E07A5F] text-white',
    pitch: 1.0,
    tag: 'Critical & Strategic',
  },
};

export const GroupDiscussion: React.FC = () => {
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  // Active Session
  const [currentSession, setCurrentSession] = useState<GDSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmittingTurn, setIsSubmittingTurn] = useState(false);
  const [error, setError] = useState<Error | string | null>(null);
  const [pendingText, setPendingText] = useState('');

  // Audio / Speech Synthesis
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const { speak, stop, isSpeaking } = useSpeechSynthesis();

  // Summary Dialog
  const [summaryData, setSummaryData] = useState<GDSummary | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // Load preset GD topics
  useEffect(() => {
    async function loadTopics() {
      setIsLoadingTopics(true);
      try {
        const res = await api.gd.getTopics();
        if (res && res.topics && res.topics.length > 0) {
          setTopics(res.topics);
          setSelectedTopic(res.topics[0]);
        }
      } catch {
        // Fallback default topics
        const fallback = [
          'Will Artificial Intelligence replace entry-level software engineers?',
          'Work from Home vs Return to Office: What is best for fresh graduates?',
          'Should college curriculum prioritize practical coding over theory?',
          'Electric Vehicles in India: Readiness, infrastructure, and future.',
        ];
        setTopics(fallback);
        setSelectedTopic(fallback[0]);
      } finally {
        setIsLoadingTopics(false);
      }
    }
    loadTopics();
  }, []);

  const handleStartGD = async () => {
    const finalTopic = customTopic.trim() ? customTopic.trim() : selectedTopic;
    if (!finalTopic) return;

    setIsStarting(true);
    setError(null);
    setChatMessages([]);
    stop();

    try {
      const session = await api.gd.start(finalTopic);
      setCurrentSession(session);

      // Process initial openings from Aarav/Meera/Rohan
      const initialMsgs: ChatMessage[] = [];
      if (session.openings && session.openings.length > 0) {
        session.openings.forEach((op, idx) => {
          initialMsgs.push({
            id: `opening-${idx}`,
            speaker: op.name,
            text: op.text,
            role: 'ai',
          });
        });
      }

      setChatMessages(initialMsgs);

      // Speak the first opening aloud if TTS enabled
      if (ttsEnabled && initialMsgs.length > 0) {
        const first = initialMsgs[0];
        const pitch = PARTICIPANT_COLORS[first.speaker]?.pitch || 1.0;
        speak(`${first.speaker} says: ${first.text}`, { pitch });
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleSendTurn = async (text: string) => {
    if (!text.trim() || !currentSession || isSubmittingTurn) return;
    setError(null);
    setIsSubmittingTurn(true);
    setPendingText(text);
    stop();

    const tempStudentMsg: ChatMessage = {
      id: `student-${Date.now()}`,
      speaker: 'You',
      text,
      role: 'student',
    };

    setChatMessages((prev) => [...prev, tempStudentMsg]);

    try {
      const res = await api.gd.sendTurn(currentSession.id, text);
      setPendingText(''); // cleared on success

      // Attach evaluation to student's message
      setChatMessages((prev) => {
        const updated = [...prev];
        let lastIdx = -1;
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'student') {
            lastIdx = i;
            break;
          }
        }
        if (lastIdx !== -1 && res.evaluation) {
          updated[lastIdx] = {
            ...updated[lastIdx],
            evaluation: res.evaluation,
          };
        }

        // Append responding participants
        if (res.participants && res.participants.length > 0) {
          res.participants.forEach((p: GDParticipantTurn, idx: number) => {
            updated.push({
              id: `ai-reply-${Date.now()}-${idx}`,
              speaker: p.name,
              text: p.text,
              role: 'ai',
            });
          });
        }
        return updated;
      });

      // Speak first responder aloud
      if (ttsEnabled && res.participants && res.participants.length > 0) {
        const first = res.participants[0];
        const pitch = PARTICIPANT_COLORS[first.name]?.pitch || 1.0;
        speak(`${first.name} counters: ${first.text}`, { pitch });
      }
    } catch (err: any) {
      setError(err);
      // Remove temp student turn on error so user can retry with preserved input
      setChatMessages((prev) => prev.filter((m) => m.id !== tempStudentMsg.id));
    } finally {
      setIsSubmittingTurn(false);
    }
  };

  const handleEndGD = async () => {
    if (!currentSession) return;
    stop();
    setIsStarting(true);
    setError(null);
    try {
      const res = await api.gd.end(currentSession.id);
      const sum = (res?.summary || res) as GDSummary;
      setSummaryData(sum);
      setIsSummaryOpen(true);
      setCurrentSession(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#29243A] tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EDE7FF] text-[#8B70D6] border border-[#D4C7F5]">
              <Users className="w-5 h-5" />
            </div>
            AI Group Discussion Simulator
          </h1>
          <p className="text-xs sm:text-sm text-[#77718B] mt-1">
            Practice GD rounds with 3 distinct AI peers (Aarav, Meera, Rohan). Learn turn-taking, counter-arguments, and synthesis.
          </p>
        </div>

        {/* TTS Toggle */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-[#EDE7FF] shadow-sm self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              if (ttsEnabled) stop();
              setTtsEnabled(!ttsEnabled);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              ttsEnabled ? 'bg-[#EDE7FF] text-[#8B70D6]' : 'text-[#77718B] hover:text-[#29243A]'
            }`}
            aria-label="Toggle speaker"
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4 text-[#8B70D6]" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-[11px]">{ttsEnabled ? 'Peer Voices On' : 'Peer Voices Muted'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <ErrorBanner
          error={error}
          onRetry={pendingText ? () => handleSendTurn(pendingText) : undefined}
          isRetrying={isSubmittingTurn}
        />
      )}

      {/* SETUP VIEW: Topic Selection */}
      {!currentSession && (
        <Card className="border-[#EDE7FF] bg-white shadow-card">
          <CardHeader>
            <CardTitle className="text-base text-[#29243A]">Select a Group Discussion Topic</CardTitle>
            <p className="text-xs text-[#77718B]">
              Campus placement GDs test your ability to structure arguments respectfully and add valuable points.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* AI Peers Preview */}
            <div className="p-4 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] space-y-2.5">
              <span className="text-xs font-bold text-[#29243A] block uppercase tracking-wider">
                Your Discussion Circle:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#EDE7FF] shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-[#8B70D6] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    A
                  </div>
                  <div>
                    <strong className="block text-xs text-[#29243A]">Aarav</strong>
                    <span className="text-[10px] text-[#77718B]">Analytical & Data-driven</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#EDE7FF] shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-[#2E9B71] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    M
                  </div>
                  <div>
                    <strong className="block text-xs text-[#29243A]">Meera</strong>
                    <span className="text-[10px] text-[#77718B]">Human-centric & Practical</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#EDE7FF] shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-[#E07A5F] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    R
                  </div>
                  <div>
                    <strong className="block text-xs text-[#29243A]">Rohan</strong>
                    <span className="text-[10px] text-[#77718B]">Critical & Strategic</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Topics List */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-[#29243A] uppercase tracking-wider">
                Choose from Current Placement GD Topics:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {topics.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setSelectedTopic(t);
                      setCustomTopic('');
                    }}
                    className={`p-3.5 rounded-xl text-left border transition-all text-xs leading-relaxed ${
                      selectedTopic === t && !customTopic
                        ? 'bg-[#EDE7FF]/60 border-[#8B70D6] text-[#29243A] shadow-sm font-semibold ring-2 ring-[#8B70D6]/20'
                        : 'bg-[#F8F6FF] border-[#EDE7FF] text-[#29243A] hover:bg-white hover:border-[#8B70D6]/40'
                    }`}
                  >
                    "{t}"
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Topic */}
            <div>
              <label htmlFor="custom-gd-topic" className="block text-xs font-semibold text-[#29243A] mb-1.5">
                Or propose a custom GD topic:
              </label>
              <input
                id="custom-gd-topic"
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g. Impact of social media algorithms on student attention spans..."
                className="w-full bg-[#F8F6FF] border border-[#EDE7FF] rounded-xl px-3.5 py-2.5 text-xs text-[#29243A] placeholder:text-[#77718B] focus:outline-none focus:ring-2 focus:ring-[#8B70D6] focus:border-[#8B70D6]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartGD}
                isLoading={isStarting}
              >
                <Users className="w-4 h-4 mr-2" />
                Enter Discussion Room
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ACTIVE GD ROOM */}
      {currentSession && (
        <div className="space-y-4">
          {/* Top Room Banner */}
          <div className="p-4 rounded-2xl bg-white border border-[#EDE7FF] shadow-card flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-[#29243A]">Live GD Room</span>
                <span className="text-xs text-[#77718B]">• 4 Active Participants</span>
              </div>
              <p className="text-sm text-[#8B70D6] font-semibold">"{currentSession.topic}"</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleEndGD}
              disabled={isStarting}
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <StopCircle className="w-4 h-4 mr-1.5" />
              End Discussion & View Consensus
            </Button>
          </div>

          {/* Discussion Turn Feed */}
          <div className="space-y-4 min-h-[360px] max-h-[580px] overflow-y-auto p-4 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF]">
            {chatMessages.map((msg) => {
              const isStudent = msg.role === 'student';
              const pMeta = PARTICIPANT_COLORS[msg.speaker];

              return (
                <div key={msg.id} className={`space-y-2 ${isStudent ? 'pl-6 sm:pl-16' : 'pr-6 sm:pr-16'}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isStudent
                        ? 'bg-[#EDE7FF]/70 border border-[#D4C7F5] text-[#29243A] ml-auto shadow-sm'
                        : 'bg-white border border-[#EDE7FF] text-[#29243A] shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {isStudent ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-[#8B70D6] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                            Y
                          </div>
                          <span className="text-xs font-bold text-[#8B70D6]">You (Candidate)</span>
                        </>
                      ) : (
                        <>
                          <div
                            className={`w-6 h-6 rounded-full ${
                              pMeta?.avatar || 'bg-slate-700'
                            } text-white flex items-center justify-center text-[10px] font-bold shadow-sm`}
                          >
                            {msg.speaker.charAt(0)}
                          </div>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${pMeta?.badge || ''}`}>
                            {msg.speaker}
                          </span>
                          <span className="text-[10px] text-[#77718B] hidden sm:inline">
                            {pMeta?.tag}
                          </span>
                        </>
                      )}
                    </div>

                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {/* Student turn evaluation expander */}
                  {isStudent && msg.evaluation && (
                    <EvaluationCard
                      evaluation={msg.evaluation}
                      title="Your Turn Assessment (Grammar, Clarity & Content)"
                    />
                  )}
                </div>
              );
            })}

            {isSubmittingTurn && (
              <div className="p-3.5 rounded-xl bg-white border border-[#EDE7FF] shadow-sm text-xs text-[#77718B] flex items-center gap-2.5 max-w-xs animate-pulse">
                <Users className="w-4 h-4 text-[#8B70D6] animate-spin" />
                <span>Participants are formulating replies...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Student Turn Input */}
          <div className="pt-2">
            <VoiceInput
              initialValue={pendingText}
              placeholder="Contribute your perspective to the discussion (speak or type)..."
              onSubmit={handleSendTurn}
              isLoading={isSubmittingTurn}
              disabled={isStarting}
              buttonText="Speak in Discussion"
            />
          </div>
        </div>
      )}

      {/* GD End Summary Dialog */}
      <Dialog
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        title="Group Discussion Concluded"
        description="Comprehensive summary of key debate outcomes, group consensus, and your individual contribution."
      >
        <div className="space-y-5 py-2">
          {summaryData ? (
            <>
              {/* Overall Score */}
              <div className="p-4 rounded-xl bg-[#F8F6FF] border border-[#EDE7FF] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#77718B] uppercase tracking-wider block">
                    Your Average GD Score
                  </span>
                  <span className="text-xl font-heading font-extrabold text-[#29243A]">
                    {summaryData.avg_overall !== null && summaryData.avg_overall !== undefined
                      ? `${Math.round(summaryData.avg_overall)}/100`
                      : 'Not scored'}
                  </span>
                </div>
                <ScoreRing score={summaryData.avg_overall} size={64} strokeWidth={6} />
              </div>

              {/* Consensus & Synthesis */}
              {summaryData.consensus && (
                <div className="p-3.5 rounded-xl bg-[#EDE7FF]/50 border border-[#D4C7F5] text-xs text-[#29243A] space-y-1">
                  <span className="font-bold text-[#8B70D6] block flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Group Consensus
                  </span>
                  <p className="leading-relaxed text-[#29243A]">{summaryData.consensus}</p>
                </div>
              )}

              {/* Qualitative Feedback */}
              {summaryData.feedback && (
                <div className="text-xs text-[#29243A] leading-relaxed">
                  <strong className="text-[#29243A] block mb-1">Coach Observation:</strong>
                  {summaryData.feedback}
                </div>
              )}

              {/* Repeated Mistakes */}
              {summaryData.top_mistakes && summaryData.top_mistakes.length > 0 && (
                <MistakeList
                  mistakes={summaryData.top_mistakes}
                  title="Speech Patterns to Refine"
                />
              )}
            </>
          ) : (
            <p className="text-xs text-[#77718B]">Discussion ended.</p>
          )}

          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              onClick={() => {
                setIsSummaryOpen(false);
                setChatMessages([]);
                setSummaryData(null);
              }}
            >
              Join Another Discussion
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};