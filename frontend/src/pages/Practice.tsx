import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { VoiceSession, VoiceMessage, VoiceSummary } from '../lib/types';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { VoiceInput } from '../components/VoiceInput';
import { EvaluationCard } from '../components/EvaluationCard';
import { ScoreRing } from '../components/ScoreRing';
import { MistakeList } from '../components/MistakeList';
import { ErrorBanner } from '../components/ErrorBanner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Dialog } from '../components/ui/Dialog';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  StopCircle,
  Play,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  Radio,
  Square,
  MessageSquare,
  Flame,
} from 'lucide-react';

const PRESET_TOPICS = [
  'Free conversation',
  'My college projects & technical stack',
  'My hobbies & creative passions',
  'Describe your hometown & culture',
  'Future career aspirations & plans',
];

type VoiceState =
  | 'ready'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'completed';

export const Practice: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState(PRESET_TOPICS[0]);
  const [customTopic, setCustomTopic] = useState('');
  const [currentSession, setCurrentSession] = useState<VoiceSession | null>(null);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | string | null>(null);

  // Summary dialog after ending session
  const [summaryData, setSummaryData] = useState<VoiceSummary | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Audio / Speech Synthesis (TTS)
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsRate, setTtsRate] = useState(1.0);
  const { speak, stop, isSpeaking } = useSpeechSynthesis();

  // Audio Recognition for Orb Quick-Toggle
  const {
    supported: sttSupported,
    listening: sttListening,
    transcript: sttTranscript,
    interim: sttInterim,
    start: startListening,
    stop: stopListening,
    reset: resetSTT,
  } = useSpeechRecognition('en-IN');

  // Preserved input text for retry
  const [pendingInput, setPendingInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      stop();
      if (sttListening) stopListening();
    };
  }, [stop, sttListening, stopListening]);

  // Determine Current Voice Coach State
  let coachState: VoiceState = 'ready';
  if (isSpeaking) {
    coachState = 'speaking';
  } else if (isSending) {
    coachState = 'processing';
  } else if (sttListening) {
    coachState = 'listening';
  } else if (!currentSession) {
    coachState = 'ready';
  }

  const handleStartSession = async (topicToUse?: string) => {
    const finalTopic = topicToUse || (customTopic.trim() ? customTopic.trim() : selectedTopic);
    setIsLoadingSession(true);
    setError(null);
    try {
      const session = await api.voice.startSession(finalTopic);
      setCurrentSession(session);
      if (session.messages && session.messages.length > 0) {
        setMessages(session.messages);
        if (ttsEnabled && session.messages[0].role === 'assistant') {
          speak(session.messages[0].content, { rate: ttsRate });
        }
      } else {
        const initialMsg: VoiceMessage = {
          id: 'welcome-0',
          role: 'assistant',
          content: `Hi there! I'm your AI speaking coach. We're exploring "${finalTopic}". Tell me what's on your mind, or tap the microphone to start!`,
          created_at: new Date().toISOString(),
        };
        setMessages([initialMsg]);
        if (ttsEnabled) {
          speak(initialMsg.content, { rate: ttsRate });
        }
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !currentSession || isSending) return;
    setError(null);
    setIsSending(true);
    setPendingInput(text);
    stop(); // Stop any ongoing AI voice before user turn

    const tempUserMsg: VoiceMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.voice.sendMessage(currentSession.id, text);
      setPendingInput('');

      setMessages((prev) => {
        const updated = [...prev];
        let lastUserIdx = -1;
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'user') {
            lastUserIdx = i;
            break;
          }
        }
        if (lastUserIdx !== -1 && res.evaluation) {
          updated[lastUserIdx] = {
            ...updated[lastUserIdx],
            evaluation: res.evaluation,
          };
        }
        const aiMsg: VoiceMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: res.reply,
          created_at: new Date().toISOString(),
        };
        return [...updated, aiMsg];
      });

      if (ttsEnabled && res.reply) {
        speak(res.reply, { rate: ttsRate });
      }
    } catch (err: any) {
      setError(err);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleOrbClick = () => {
    if (!currentSession) {
      handleStartSession();
      return;
    }

    if (isSpeaking) {
      // Allow student to interrupt AI speech
      stop();
      return;
    }

    if (sttListening) {
      stopListening();
      const finalRecorded = (sttTranscript + ' ' + sttInterim).trim();
      if (finalRecorded) {
        handleSendMessage(finalRecorded);
        resetSTT();
      }
    } else {
      startListening();
    }
  };

  const handleEndSession = async () => {
    if (!currentSession) return;
    stop();
    if (sttListening) stopListening();
    setIsLoadingSession(true);
    setError(null);
    try {
      const res = await api.voice.endSession(currentSession.id);
      const sum = (res?.summary || res) as VoiceSummary;
      setSummaryData(sum);
      setIsSummaryOpen(true);
      setCurrentSession(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoadingSession(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B70D6] bg-[#EDE7FF] px-2.5 py-0.5 rounded-full border border-[#DDD3FF]">
              Campus Voice Studio
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#29243A] tracking-tight flex items-center gap-2.5">
            AI Voice Practice
          </h1>
          <p className="text-xs sm:text-sm text-[#77718B] mt-0.5">
            Speak freely with your AI companion. Receive live transcriptions, grammatical feedback, and clarity drills.
          </p>
        </div>

        {/* Audio / TTS Controls */}
        <div className="flex items-center gap-3 p-2 rounded-2xl bg-white border border-[#EDE7FF] shadow-sm self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              if (ttsEnabled) stop();
              setTtsEnabled(!ttsEnabled);
            }}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              ttsEnabled ? 'bg-[#EDE7FF] text-[#674BB4]' : 'text-[#77718B] hover:text-[#29243A]'
            }`}
            title={ttsEnabled ? 'Mute AI voice' : 'Enable AI voice playback'}
            aria-label="Toggle speaker"
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4 text-[#8B70D6]" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-xs hidden sm:inline">{ttsEnabled ? 'AI Voice On' : 'Muted'}</span>
          </button>

          {ttsEnabled && (
            <div className="flex items-center gap-1.5 border-l border-[#EDE7FF] pl-2.5">
              <span className="text-[11px] text-[#77718B] font-semibold">Speed:</span>
              <select
                aria-label="Speech rate"
                value={ttsRate}
                onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                className="bg-[#FAF8FF] border border-[#DDD3FF] rounded-lg px-2 py-0.5 text-xs text-[#29243A] focus:outline-none focus:ring-1 focus:ring-[#8B70D6]"
              >
                <option value={0.75}>0.75x</option>
                <option value={1.0}>1.0x Normal</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <ErrorBanner
          error={error}
          onRetry={pendingInput ? () => handleSendMessage(pendingInput) : undefined}
          isRetrying={isSending}
        />
      )}

      {/* =========================================================================
          HERO VOICE ORB SECTION (Lavender Glow + Live Waveform + State Indicator)
         ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#EDE7FF]/60 via-white to-[#F8F6FF] border border-[#EDE7FF] p-6 sm:p-10 shadow-card flex flex-col items-center justify-center text-center space-y-6">
        {/* Soft background ambient gradient rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#DDD3FF]/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-[#BDEBD9]/30 rounded-full blur-2xl pointer-events-none" />

        {/* State Indicator Pill */}
        <div className="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-[#EDE7FF] text-xs font-bold transition-all duration-300">
          {coachState === 'ready' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-[#8B70D6]" />
              <span className="text-[#674BB4]">Ready to Practice</span>
            </>
          )}
          {coachState === 'listening' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-rose-600 font-bold">Listening to you...</span>
            </>
          )}
          {coachState === 'processing' && (
            <>
              <Sparkles className="w-3.5 h-3.5 text-[#8B70D6] animate-spin" />
              <span className="text-[#8B70D6]">Analyzing speech...</span>
            </>
          )}
          {coachState === 'speaking' && (
            <>
              <Volume2 className="w-3.5 h-3.5 text-[#267E5A] animate-bounce" />
              <span className="text-[#267E5A]">AI Coach is Speaking... (Tap orb to interrupt)</span>
            </>
          )}
        </div>

        {/* The Animated Voice Orb */}
        <div className="relative z-10 flex items-center justify-center my-2">
          {/* Outer Ripple Rings */}
          {(coachState === 'listening' || coachState === 'speaking') && (
            <>
              <div className="absolute w-44 h-44 rounded-full bg-[#8B70D6]/20 animate-orb-ripple pointer-events-none" />
              <div className="absolute w-52 h-52 rounded-full bg-[#BDEBD9]/30 animate-orb-ripple delay-300 pointer-events-none" />
            </>
          )}

          {/* Central Glowing Orb Button */}
          <button
            type="button"
            onClick={handleOrbClick}
            disabled={isLoadingSession}
            aria-label={
              isSpeaking
                ? 'Interrupt AI speech'
                : sttListening
                ? 'Stop recording and send'
                : 'Start speaking'
            }
            className={`w-36 h-36 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center transition-all duration-300 select-none cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#8B70D6]/30 shadow-elevated ${
              coachState === 'listening'
                ? 'bg-gradient-to-tr from-rose-500 to-rose-400 text-white animate-mic-pulse'
                : coachState === 'speaking'
                ? 'bg-gradient-to-tr from-[#46B88A] to-[#63CAA2] text-white shadow-glow-mint'
                : coachState === 'processing'
                ? 'bg-gradient-to-tr from-[#8B70D6] to-[#A58FF0] text-white animate-pulse'
                : 'bg-gradient-to-tr from-[#8B70D6] via-[#9B82E3] to-[#BDEBD9] text-white hover:scale-105 shadow-glow-primary'
            }`}
          >
            {coachState === 'speaking' ? (
              <>
                <Square className="w-8 h-8 fill-current mb-1" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Interrupt</span>
              </>
            ) : coachState === 'listening' ? (
              <>
                <MicOff className="w-9 h-9 mb-1" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider">Tap to Send</span>
              </>
            ) : (
              <>
                <Mic className="w-9 h-9 mb-1" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  {currentSession ? 'Tap to Speak' : 'Start Session'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Live Audio Waveform Animation Bars */}
        <div className="relative z-10 flex items-center justify-center gap-1.5 h-8">
          <span
            className={`w-1.5 rounded-full transition-all duration-200 ${
              coachState === 'listening' || coachState === 'speaking'
                ? 'bg-[#8B70D6] animate-wave-1'
                : 'bg-[#DDD3FF] h-2'
            }`}
          />
          <span
            className={`w-1.5 rounded-full transition-all duration-200 ${
              coachState === 'listening' || coachState === 'speaking'
                ? 'bg-[#46B88A] animate-wave-2'
                : 'bg-[#DDD3FF] h-3'
            }`}
          />
          <span
            className={`w-1.5 rounded-full transition-all duration-200 ${
              coachState === 'listening' || coachState === 'speaking'
                ? 'bg-[#8B70D6] animate-wave-3'
                : 'bg-[#DDD3FF] h-4'
            }`}
          />
          <span
            className={`w-1.5 rounded-full transition-all duration-200 ${
              coachState === 'listening' || coachState === 'speaking'
                ? 'bg-[#F48B62] animate-wave-4'
                : 'bg-[#DDD3FF] h-2'
            }`}
          />
          <span
            className={`w-1.5 rounded-full transition-all duration-200 ${
              coachState === 'listening' || coachState === 'speaking'
                ? 'bg-[#8B70D6] animate-wave-2'
                : 'bg-[#DDD3FF] h-3'
            }`}
          />
        </div>

        {/* Current Topic Indicator & End Session Button */}
        {currentSession ? (
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 pt-1">
            <span className="text-xs font-semibold text-[#77718B] bg-white px-3.5 py-1.5 rounded-full border border-[#EDE7FF]">
              Topic: <strong className="text-[#29243A]">{currentSession.topic}</strong>
            </span>
            <Button
              variant="danger"
              size="sm"
              onClick={handleEndSession}
              disabled={isLoadingSession}
              className="text-xs"
            >
              <StopCircle className="w-3.5 h-3.5 mr-1" />
              End Practice & View Scores
            </Button>
          </div>
        ) : (
          <p className="relative z-10 text-xs text-[#77718B] max-w-sm">
            Select a topic below and tap the orb to begin your speaking conversation.
          </p>
        )}
      </div>

      {/* TOPIC PICKER (when no session is active) */}
      {!currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-[#29243A]">Choose Conversation Topic</CardTitle>
            <CardDescription>
              Pick a recommended campus practice prompt or provide your own scenario.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {PRESET_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => {
                    setSelectedTopic(topic);
                    setCustomTopic('');
                  }}
                  className={`p-4 rounded-2xl text-left border transition-all text-xs font-semibold ${
                    selectedTopic === topic && !customTopic
                      ? 'bg-[#EDE7FF] border-[#8B70D6] text-[#29243A] shadow-sm'
                      : 'bg-[#FAF8FF] border-[#EDE7FF] text-[#77718B] hover:border-[#DDD3FF] hover:bg-white'
                  }`}
                >
                  <span className="block text-[#8B70D6] font-bold mb-1 text-[10px] uppercase">
                    Theme
                  </span>
                  {topic}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label htmlFor="custom-practice-topic" className="block text-xs font-semibold text-[#29243A] mb-1.5">
                Or enter a custom situation or speaking prompt:
              </label>
              <input
                id="custom-practice-topic"
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g. Pitching a final-year IoT project or explaining machine learning to a non-tech recruiter..."
                className="w-full bg-[#FAF8FF] border border-[#EDE7FF] rounded-xl px-3.5 py-2.5 text-xs text-[#29243A] placeholder:text-[#A59EBA] focus:outline-none focus:ring-2 focus:ring-[#8B70D6]/20 focus:border-[#8B70D6]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleStartSession()}
                isLoading={isLoadingSession}
              >
                <Mic className="w-4 h-4 mr-2" />
                Start Voice Practice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ACTIVE CONVERSATION FEED (Transcript Panel) */}
      {currentSession && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#77718B] uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#8B70D6]" />
              Live Conversation Transcript
            </span>
            <span className="text-xs text-[#77718B]">{messages.length} messages</span>
          </div>

          <div className="space-y-4 min-h-[300px] max-h-[500px] overflow-y-auto p-4 sm:p-5 rounded-3xl bg-white border border-[#EDE7FF] shadow-sm">
            {messages.map((msg, index) => {
              const isStudent = msg.role === 'user';
              return (
                <div key={msg.id || index} className={`space-y-2 ${isStudent ? 'pl-6 sm:pl-16' : 'pr-6 sm:pr-16'}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isStudent
                        ? 'bg-[#EDE7FF] border border-[#DDD3FF] text-[#29243A] ml-auto'
                        : 'bg-[#FAF8FF] border border-[#EDE7FF] text-[#29243A]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {isStudent ? (
                        <>
                          <div className="w-5 h-5 rounded-full bg-[#8B70D6] text-white flex items-center justify-center text-[10px] font-bold">
                            Y
                          </div>
                          <span className="text-xs font-bold text-[#674BB4]">You</span>
                        </>
                      ) : (
                        <>
                          <div className="w-5 h-5 rounded-full bg-[#BDEBD9] text-[#267E5A] flex items-center justify-center text-[10px] font-bold">
                            AI
                          </div>
                          <span className="text-xs font-bold text-[#267E5A]">YapWise Coach</span>
                        </>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Student turn evaluation expander */}
                  {isStudent && msg.evaluation && (
                    <EvaluationCard
                      evaluation={msg.evaluation}
                      title="Speech Feedback for this Turn"
                    />
                  )}
                </div>
              );
            })}

            {isSending && (
              <div className="p-3.5 rounded-2xl bg-[#EDE7FF]/60 border border-[#DDD3FF] text-xs text-[#674BB4] flex items-center gap-2 max-w-xs animate-pulse">
                <Bot className="w-4 h-4 text-[#8B70D6] animate-spin" />
                <span>AI coach is listening and evaluating...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Voice & Typed Dual Input */}
          <div className="pt-2">
            <VoiceInput
              initialValue={pendingInput}
              placeholder="Speak naturally or type your response here..."
              onSubmit={handleSendMessage}
              isLoading={isSending}
              disabled={isLoadingSession}
              buttonText="Send Response"
            />
          </div>
        </div>
      )}

      {/* End Session Summary Dialog */}
      <Dialog
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        title="Practice Session Completed 🎉"
        description="Here is your overall performance summary and recurring speech patterns from this session."
      >
        <div className="space-y-5 py-2">
          {summaryData ? (
            <>
              {/* Overall Score & Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-4 rounded-2xl bg-[#FAF8FF] border border-[#EDE7FF]">
                <div className="flex items-center justify-center">
                  <ScoreRing
                    score={summaryData.avg_overall}
                    size={84}
                    strokeWidth={7}
                    label="Session Average"
                  />
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#EDE7FF]">
                    <span className="text-[#77718B]">Turns Evaluated:</span>
                    <strong className="text-[#29243A]">{summaryData.evaluated_turns}</strong>
                  </div>
                  {summaryData.skill_averages &&
                    Object.entries(summaryData.skill_averages).map(([k, v]) => (
                      <div key={k} className="flex justify-between py-0.5 text-[11px]">
                        <span className="text-[#77718B] capitalize">{k}:</span>
                        <strong className="text-[#8B70D6]">
                          {v !== null ? `${Math.round(v)}/100` : '–'}
                        </strong>
                      </div>
                    ))}
                </div>
              </div>

              {/* Strengths */}
              {summaryData.strengths && summaryData.strengths.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#267E5A] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Observed Strengths
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {summaryData.strengths.map((str, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-[#E1F7EE] border border-[#BDEBD9] text-xs text-[#267E5A]">
                        • {str}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Repeated Mistakes */}
              {summaryData.top_mistakes && summaryData.top_mistakes.length > 0 && (
                <MistakeList
                  mistakes={summaryData.top_mistakes}
                  title="Mistakes to Focus On"
                />
              )}
            </>
          ) : (
            <p className="text-xs text-[#77718B]">No summary recorded for this session.</p>
          )}

          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              onClick={() => {
                setIsSummaryOpen(false);
                setMessages([]);
                setSummaryData(null);
              }}
            >
              Start Another Session
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
