import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SpeakingMode, SpeakingTurnResponse } from '../lib/types';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Dialog } from '../components/ui/Dialog';
import { ScoreRing } from '../components/ScoreRing';
import { cn } from '../lib/utils';
import { ExpressiveCharacterAvatar } from '../components/3d/ExpressiveCharacterAvatar';
import { TalkingAvatarArena } from '../components/avatar/TalkingAvatarArena';
import { REALISTIC_AVATARS } from '../lib/avatars';
import {
  Mic,
  MicOff,
  Volume2,
  Play,
  Square,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Send,
  Radio,
  BookOpen,
  Briefcase,
  Layers,
  MessageSquare,
  Lightbulb,
  ArrowRight,
  ChevronLeft,
  Trophy,
  Award,
  Star,
  Check,
  Zap,
  Target,
} from 'lucide-react';

interface ChatTurn {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  has_correction?: boolean;
  original_phrase?: string | null;
  corrected_phrase?: string | null;
  correction_explanation?: string | null;
  timestamp: string;
}

export type SpeakingStage = 'partner-select' | 'room' | 'celebration';

interface PartnerInfo {
  id: 'kid' | 'english_coach' | 'interview_coach';
  name: string;
  roleTitle: string;
  levelBadge: string;
  levelColor: string;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  shadowColor: string;
  icon: typeof Sparkles;
  mode: SpeakingMode;
  tagline: string;
  description: string;
  features: string[];
  welcomePrompt: string;
}

const PARTNERS: PartnerInfo[] = [
  {
    id: 'kid',
    name: 'Leo',
    roleTitle: 'Beginner-Friendly English Practice',
    levelBadge: 'Level 1 • Beginner',
    levelColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    gradientFrom: '#34D399',
    gradientTo: '#059669',
    accentColor: '#10B981',
    shadowColor: 'rgba(16, 185, 129, 0.35)',
    icon: Zap,
    mode: 'daily',
    tagline: 'Casual & patient companion with zero pressure',
    description:
      'Friendly, slow-paced conversational practice. Ideal for building fundamental speaking habits, discussing daily routines, hobbies, and college life without anxiety.',
    features: ['Everyday English & hobbies', 'Zero pressure environment', 'Warm encouragement & patience'],
    welcomePrompt:
      "Hi there! I'm Leo, your English study buddy. Let's have fun chatting! How has your college day been going so far?",
  },
  {
    id: 'english_coach',
    name: 'Maya',
    roleTitle: 'Friendly English Coach (Recommended)',
    levelBadge: 'Level 2 • Intermediate',
    levelColor: 'bg-purple-100 text-purple-800 border-purple-300',
    gradientFrom: '#A78BFA',
    gradientTo: '#7652C8',
    accentColor: '#7652C8',
    shadowColor: 'rgba(118, 82, 200, 0.35)',
    icon: Sparkles,
    mode: 'free',
    tagline: 'Real-time grammar polish & natural phrasing',
    description:
      'Warm and articulate speaking coach. Pinpoints grammar slips, helps you rephrase thoughts into fluent native English, and builds your conversational confidence.',
    features: ['Instant grammar feedback', 'Natural phrasing tips', 'Fluency & vocabulary booster'],
    welcomePrompt:
      "Hello! I am Maya, your English fluency coach. Tell me about a project, passion, or goal you are working on!",
  },
  {
    id: 'interview_coach',
    name: 'Vikram',
    roleTitle: 'Professional Speaking Coach',
    levelBadge: 'Level 3 • Advanced',
    levelColor: 'bg-amber-100 text-amber-800 border-amber-300',
    gradientFrom: '#FCD34D',
    gradientTo: '#D97706',
    accentColor: '#F59E0B',
    shadowColor: 'rgba(245, 158, 11, 0.35)',
    icon: Target,
    mode: 'hr',
    tagline: 'Mock interviews, STAR method & executive articulation',
    description:
      'Senior placement and technical interview coach. Prepares you for campus placement interviews, STAR behavioral answers, and crisp engineering discussions.',
    features: ['Campus placement interview drills', 'STAR behavioral storytelling', 'Technical articulation practice'],
    welcomePrompt:
      "Good day! I'm Vikram, your placement coach. Let's start with a classic interview question: Could you introduce yourself and walk me through your key strengths?",
  },
];

interface SpeakingCompanionProps {
  initialStage?: 'partner-select' | 'room' | 'celebration';
}

export const SpeakingCompanion: React.FC<SpeakingCompanionProps> = ({ initialStage = 'partner-select' }) => {
  const { user, profile } = useAuth();

  // Navigation stage: 'partner-select' -> 'room' -> 'celebration'
  const [stage, setStage] = useState<SpeakingStage>(initialStage);
  const [selectedPartner, setSelectedPartner] = useState<PartnerInfo>(PARTNERS[1]);
  const [mode, setMode] = useState<SpeakingMode>('free');
  const [viewMode, setViewMode] = useState<'avatar' | 'split'>('avatar');

  useEffect(() => {
    if (initialStage) {
      setStage(initialStage);
    }
  }, [initialStage]);

  // Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDurationSec, setSessionDurationSec] = useState(0);

  // Conversation Turns Feed
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // End Session Confirmation Modal
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);

  // Typed fallback text
  const [typedInput, setTypedInput] = useState('');
  const [autoListenEnabled, setAutoListenEnabled] = useState(false);
  const [autoSendSilence, setAutoSendSilence] = useState(false);
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);

  // Audio Speech Recognition and Synthesis Hooks
  const {
    isSupported: isSpeechRecSupported,
    isListening,
    transcript,
    interim,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition('en-IN');

  const {
    speak,
    cancel: stopSpeaking,
    speaking: isSpeaking,
    supported: isTtsSupported,
    previewVoice,
    voices,
    selectedVoice,
    setSelectedVoice,
  } = useSpeechSynthesis();

  // Accumulated Session Results
  const [mistakesAccumulator, setMistakesAccumulator] = useState<
    Array<{ original: string; correction: string; explanation: string }>
  >([]);
  const [newVocabAccumulator, setNewVocabAccumulator] = useState<string[]>([]);
  const [averageScore, setAverageScore] = useState<number>(92);
  const [latestCorrection, setLatestCorrection] = useState<{
    original: string;
    correction: string;
    explanation: string;
  } | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const silenceTimerRef = useRef<any>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [turns, interim]);

  // Session duration timer
  useEffect(() => {
    let interval: any = null;
    if (isSessionActive && sessionStartTime) {
      interval = setInterval(() => {
        setSessionDurationSec(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive, sessionStartTime]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, [stopSpeaking, stopListening]);

  // Silence auto-send detection (ONLY active when student explicitly enables autoSendSilence)
  useEffect(() => {
    if (!autoSendSilence || !isListening) {
      setSilenceCountdown(null);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      return;
    }

    const currentSpeech = (transcript + ' ' + interim).trim();
    if (!currentSpeech) {
      setSilenceCountdown(null);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      return;
    }

    setSilenceCountdown(5);
    const interval = setInterval(() => {
      setSilenceCountdown((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    silenceTimerRef.current = setTimeout(() => {
      const speechToSend = (transcript + ' ' + interim).trim();
      if (speechToSend && isListening) {
        handleTurnSubmit(speechToSend);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [transcript, interim, isListening, autoSendSilence]);

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Launch Session with Selected Partner
  const handleLaunchPartnerSession = (partner: PartnerInfo) => {
    setSelectedPartner(partner);
    setMode(partner.mode);
    setStage('room');
    setIsSessionActive(true);
    setSessionStartTime(Date.now());
    setSessionDurationSec(0);
    setError(null);
    setMistakesAccumulator([]);
    setNewVocabAccumulator([]);
    setLatestCorrection(null);
    resetTranscript();

    const welcome = partner.welcomePrompt;
    const initialTurn: ChatTurn = {
      id: `ai-init-${Date.now()}`,
      role: 'assistant',
      text: welcome,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTurns([initialTurn]);

    // Speak welcome prompt using selected partner's custom voice profile, then automatically start listening
    speak(welcome, {
      characterId: partner.id,
      onEnd: () => {
        if (autoListenEnabled) {
          resetTranscript();
          startListening();
        }
      },
    });
  };

  // Submit student turn (via voice "Done Speaking" button OR typed input)
  const handleTurnSubmit = async (spokenText?: string) => {
    const text = (spokenText !== undefined ? spokenText : `${transcript} ${interim}`).trim();
    if (!text || isProcessingTurn) return;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    setSilenceCountdown(null);

    stopListening();
    stopSpeaking();
    setIsProcessingTurn(true);
    setError(null);

    const studentTurn: ChatTurn = {
      id: `student-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTurns((prev) => [...prev, studentTurn]);
    resetTranscript();
    setTypedInput('');

    try {
      const history = turns.slice(-6).map((t) => ({ role: t.role, content: t.text }));
      const response: SpeakingTurnResponse = await api.speaking.sendTurn(text, mode, history);

      if (response.has_correction && response.original_phrase && response.corrected_phrase) {
        const item = {
          original: response.original_phrase,
          correction: response.corrected_phrase,
          explanation: response.correction_explanation || 'Natural phrasing adjustment',
        };
        setMistakesAccumulator((prev) => [...prev, item]);
        setLatestCorrection(item);
      }

      if (response.evaluation?.new_vocabulary) {
        setNewVocabAccumulator((prev) => Array.from(new Set([...prev, ...response.evaluation.new_vocabulary])));
      }

      if (response.evaluation?.overall) {
        setAverageScore((prev) => Math.round((prev + response.evaluation.overall) / 2));
      }

      const aiTurn: ChatTurn = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: response.spoken_response,
        has_correction: response.has_correction,
        original_phrase: response.original_phrase,
        corrected_phrase: response.corrected_phrase,
        correction_explanation: response.correction_explanation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setTurns((prev) => [...prev, aiTurn]);

      // Speak AI response aloud with selected character's voice, then automatically activate listening!
      speak(response.spoken_response, {
        characterId: selectedPartner.id,
        onEnd: () => {
          if (autoListenEnabled && isSessionActive) {
            resetTranscript();
            startListening();
          }
        },
      });
    } catch (err: any) {
      setError(err?.message || 'Could not process speaking turn. You can speak again or type.');
    } finally {
      setIsProcessingTurn(false);
    }
  };

  // End Session & Go to Celebration Screen
  const confirmEndSession = () => {
    stopSpeaking();
    stopListening();
    setIsSessionActive(false);
    setIsEndModalOpen(false);
    setStage('celebration');
  };

  const latestAiTurn = [...turns].reverse().find((t) => t.role === 'assistant');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ========================================================================= */}
      {/* 1. STAGE: CONVERSATION PARTNER SELECTION                                    */}
      {/* ========================================================================= */}
      {stage === 'partner-select' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="text-center max-w-2xl mx-auto pt-2 pb-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE7FF] border border-[#D4C7F5] text-xs font-bold text-[#7652C8] mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive AI Conversation Partners</span>
            </div>
            <h1 className="font-heading font-black text-3xl sm:text-4xl text-[#302B42] tracking-tight">
              Choose Your Speaking Coach
            </h1>
            <p className="text-sm sm:text-base text-[#77718B] mt-2">
              Practice spoken English in a natural, student-friendly interactive environment. Select an AI coach suited to your goals.
            </p>
          </div>

          {/* NEW FEATURE HIGHLIGHT: REALISTIC AI TALKING AVATAR HERO BANNER */}
          <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-[#7652C8] via-[#855FD8] to-[#9973E8] text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl text-center md:text-left z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>NEW FEATURE UPGRADE</span>
              </div>
              <h2 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
                Realistic AI Talking Avatars with Real-Time Lip Sync
              </h2>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                Meet realistic male & female conversational mentors. See accurate mouth movements synchronized to spoken speech, natural blinking, and responsive facial expressions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 z-10 w-full md:w-auto">
              <button
                type="button"
                onClick={() => {
                  setViewMode('avatar');
                  setStage('room');
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white text-[#7652C8] font-heading font-black text-sm shadow-lg hover:bg-[#FAF7FF] hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Launch Talking Avatar Arena</span>
              </button>
            </div>

            {/* Subtle Background Glow Spheres */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -left-12 -top-12 w-64 h-64 rounded-full bg-black/10 blur-2xl pointer-events-none" />
          </div>

          {/* 3 Partner Cards Grid with Framer Motion */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {PARTNERS.map((partner, index) => {
              const isRecommended = partner.id === 'english_coach';
              const IconComp = partner.icon;

              return (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.12 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={cn(
                    'relative rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between group',
                    'bg-white border-2 shadow-card hover:shadow-xl',
                    isRecommended
                      ? 'border-[#7652C8] ring-4 ring-[#7652C8]/15 bg-gradient-to-b from-white via-[#FBF9FF] to-[#EDE7FF]/30'
                      : 'border-[#EDE7FF] hover:border-[#7652C8]/60'
                  )}
                >
                  {/* Top Level Pill */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={cn('text-xs font-black px-3 py-1 rounded-full border shadow-xs', partner.levelColor)}>
                      {partner.levelBadge}
                    </span>
                    {isRecommended && (
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#7652C8] text-white uppercase tracking-wider shadow-xs">
                        Most Popular
                      </span>
                    )}
                  </div>

                  {/* Interactive AI Acoustic Persona Stage */}
                  <div className="w-full flex flex-col items-center justify-center my-3 relative h-48 overflow-hidden rounded-2xl bg-gradient-to-b from-[#F8F6FF] to-[#EDE7FF]/40 border border-[#EDE7FF] group-hover:border-[#7652C8]/40 transition-colors">
                    {/* Ambient Halo */}
                    <div
                      className="absolute w-32 h-32 rounded-full blur-2xl opacity-40 pointer-events-none group-hover:scale-125 transition-transform"
                      style={{ backgroundColor: partner.shadowColor }}
                    />

                    {/* Concentric Pulsing Sound Ring */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 20 + index * 4, ease: 'linear' }}
                      className="absolute w-36 h-36 rounded-full border border-dashed border-[#D4C7F5] pointer-events-none flex items-start justify-center"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: partner.accentColor }} />
                    </motion.div>

                    {/* Dynamic Center Persona Orb */}
                    <motion.div
                      animate={{ y: [0, -5, 0], scale: [1, 1.03, 1] }}
                      transition={{ repeat: Infinity, duration: 3 + index * 0.5, ease: 'easeInOut' }}
                      className="relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform"
                      style={{
                        background: `radial-gradient(circle at 35% 30%, ${partner.gradientFrom}, ${partner.gradientTo})`,
                        boxShadow: `0 10px 25px -5px ${partner.shadowColor}`,
                      }}
                    >
                      <IconComp className="w-8 h-8 drop-shadow-md mb-0.5" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-white/90">
                        {partner.name}
                      </span>
                    </motion.div>

                    {/* Mini Equalizer Frequency Waves */}
                    <div className="flex items-center gap-1 mt-3 z-10">
                      {[6, 12, 18, 10, 16, 8, 14].map((h, i) => (
                        <motion.span
                          key={i}
                          animate={{ height: [3, h, 3] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.4 + (i % 3) * 0.15,
                            ease: 'easeInOut',
                          }}
                          className="w-1 rounded-full"
                          style={{ height: h, backgroundColor: partner.accentColor }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mt-2 flex-1">
                    <h3 className="font-heading font-black text-2xl text-[#302B42]">
                      {partner.name}
                    </h3>
                    <p className="text-xs font-black text-[#7652C8]">{partner.roleTitle}</p>
                    <p className="text-xs text-[#77718B] leading-relaxed line-clamp-3">
                      {partner.description}
                    </p>

                    {/* Features list */}
                    <div className="space-y-1.5 pt-3">
                      {partner.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-[#302B42]">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons: Preview Voice & Start Speaking */}
                  <div className="pt-5 space-y-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        previewVoice(partner.id);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl font-black text-xs border border-[#D4C7F5] bg-[#F8F6FF] hover:bg-[#EDE7FF] text-[#7652C8] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:scale-[1.01]"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#7652C8]" />
                      <span>🔊 Preview {partner.name}'s Voice</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLaunchPartnerSession(partner)}
                      className={cn(
                        'w-full py-3.5 px-4 rounded-2xl font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer',
                        isRecommended
                          ? 'bg-[#7652C8] hover:bg-[#5835C8] text-white shadow-[#7652C8]/30 hover:scale-[1.01]'
                          : 'bg-[#EDE7FF] hover:bg-[#7652C8] text-[#302B42] hover:text-white border border-[#D4C7F5] hover:scale-[1.01]'
                      )}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Practicing with {partner.name}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Quick Info Footer Bar */}
          <div className="p-4 rounded-2xl bg-white border border-[#EDE7FF] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#77718B]">
            <div className="flex items-center gap-2 font-medium">
              <span className="p-1 rounded bg-[#EDE7FF] text-[#7652C8]">💡</span>
              <span>Headset or microphone recommended for optimal voice clarity. AI adapts automatically to your speaking pace.</span>
            </div>
            <div className="flex items-center gap-2 font-black text-[#7652C8] shrink-0">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Real-time Gemini AI Conversational Intelligence</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STAGE: IMMERSIVE SPEAKING ROOM                                         */}
      {/* ========================================================================= */}
      {stage === 'room' && (
        <div className="space-y-5 animate-fadeIn">
          {/* Top Progress & Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#EDE7FF] shadow-card">
            {/* Left: Back / Partner Switch */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  stopListening();
                  setStage('partner-select');
                }}
                className="p-2 rounded-xl border border-[#EDE7FF] bg-[#F8F6FF] hover:bg-[#EDE7FF] text-[#77718B] hover:text-[#302B42] transition-colors cursor-pointer"
                title="Switch Coach"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <span className="text-[11px] font-bold text-[#77718B] block">Speaking With</span>
                <span className="font-heading font-black text-base text-[#302B42] flex items-center gap-2">
                  {selectedPartner.name}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#EDE7FF] text-[#7652C8] font-bold">
                    {selectedPartner.roleTitle}
                  </span>
                </span>
              </div>
            </div>

            {/* Center: Experience Mode Switcher (Talking Avatar vs Studio View) */}
            <div className="flex items-center gap-1 p-1 bg-[#F8F6FF] rounded-xl border border-[#EDE7FF]">
              <button
                type="button"
                onClick={() => setViewMode('avatar')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer',
                  viewMode === 'avatar'
                    ? 'bg-[#7652C8] text-white shadow-xs'
                    : 'text-[#77718B] hover:text-[#302B42]'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Talking Avatar</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-400 text-emerald-950 font-black">
                  LIVE
                </span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer',
                  viewMode === 'split'
                    ? 'bg-[#7652C8] text-white shadow-xs'
                    : 'text-[#77718B] hover:text-[#302B42]'
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Studio View</span>
              </button>
            </div>

            {/* Right: Timer & End Session Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F6FF] border border-[#EDE7FF] text-xs font-mono font-bold text-[#302B42]">
                <Clock className="w-3.5 h-3.5 text-[#7652C8]" />
                <span>{formatTime(sessionDurationSec)}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEndModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>End Session</span>
              </button>
            </div>
          </div>

          {/* EXPERIENCE MODE DISPLAY */}
          {viewMode === 'avatar' ? (
            <TalkingAvatarArena
              initialAvatarId={
                selectedPartner.id === 'interview_coach'
                  ? 'alex_vance'
                  : selectedPartner.id === 'kid'
                  ? 'maya_lin'
                  : 'priya_sharma'
              }
              mode={mode}
              onSessionEnd={() => setStage('celebration')}
            />
          ) : (
            /* MAIN SPEAKING ARENA (3 Columns) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* 1. LEFT COLUMN: Expressive AI Character Avatar (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="rounded-3xl border-2 border-[#EDE7FF] bg-gradient-to-b from-white via-white to-[#EDE7FF]/40 p-4 shadow-card flex flex-col items-center justify-center text-center relative overflow-hidden">
                <ExpressiveCharacterAvatar
                  characterId={selectedPartner.id}
                  characterName={selectedPartner.name}
                  isSpeaking={isSpeaking}
                  isListening={isListening}
                  isProcessing={isProcessingTurn}
                  error={error}
                  onRetry={() => {
                    setError(null);
                    startListening();
                  }}
                  className="w-full"
                />
              </div>

              {/* Quick Speaking Tips Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#EDE7FF] shadow-xs space-y-2">
                <span className="text-xs font-bold text-[#302B42] flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Tips for Better Fluency
                </span>
                <p className="text-[11px] text-[#77718B] leading-relaxed">
                  Speak in complete sentences. Pause when finished; our AI companion will automatically respond and provide natural English feedback.
                </p>
              </div>
            </div>

            {/* 2. CENTER COLUMN: Conversation Feed, Waves & Glowing Mic (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl border-2 border-[#EDE7FF] bg-white p-5 shadow-card flex flex-col justify-between min-h-[500px]">
                
                {/* Active Coach Prompt Bubble */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#77718B] font-bold">
                    <span className="flex items-center gap-1.5 text-[#7652C8]">
                      <Bot className="w-4 h-4" />
                      {selectedPartner.name} asked:
                    </span>
                    {latestAiTurn && (
                      <button
                        type="button"
                        onClick={() => speak(latestAiTurn.text, { characterId: selectedPartner.id })}
                        className="text-[11px] font-bold text-[#7652C8] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Replay Coach Voice
                      </button>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#EDE7FF]/60 to-[#F8F6FF] border border-[#D4C7F5] shadow-xs">
                    <p className="font-heading font-black text-sm text-[#302B42] leading-relaxed">
                      "{latestAiTurn ? latestAiTurn.text : selectedPartner.welcomePrompt}"
                    </p>
                  </div>
                </div>

                {/* SCROLLABLE CONVERSATION MESSAGE BUBBLES STREAM */}
                <div
                  ref={chatContainerRef}
                  className="my-3 max-h-56 overflow-y-auto space-y-3 p-2 rounded-2xl bg-[#FBF9FF] border border-[#EDE7FF]"
                >
                  {turns.map((turn) => {
                    const isAI = turn.role === 'assistant';
                    return (
                      <div
                        key={turn.id}
                        className={cn('flex flex-col text-xs', isAI ? 'items-start pr-6' : 'items-end pl-6')}
                      >
                        <div
                          className={cn(
                            'p-3 rounded-2xl max-w-[90%] shadow-2xs leading-relaxed',
                            isAI
                              ? 'bg-white border border-[#EDE7FF] text-[#302B42]'
                              : 'bg-[#7652C8] text-white rounded-br-xs'
                          )}
                        >
                          <p className="whitespace-pre-wrap">{turn.text}</p>
                          {turn.has_correction && turn.corrected_phrase && (
                            <div className="mt-2 pt-2 border-t border-emerald-100 bg-emerald-50/80 -mx-1 -mb-1 p-2 rounded-xl text-[11px] text-emerald-800">
                              <span className="font-black block">Tip: "{turn.corrected_phrase}"</span>
                              <span className="text-[10px] text-emerald-700">{turn.correction_explanation}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-[#77718B] mt-0.5 px-1">{turn.timestamp}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Animated Sound Wave Visualizer */}
                <div className="flex flex-col items-center justify-center my-2">
                  <div className="flex items-center justify-center gap-1.5 h-10 w-full max-w-xs">
                    {[35, 75, 95, 60, 85, 45, 100, 70, 85, 40, 90, 55, 75, 50].map((height, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'w-1.5 rounded-full transition-all duration-150',
                          isListening || isSpeaking ? 'bg-[#7652C8] animate-pulse' : 'bg-[#EDE7FF]'
                        )}
                        style={{
                          height: isListening || isSpeaking ? `${height}%` : '20%',
                          animationDelay: `${idx * 0.07}s`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Real-time speech and hands-free toggle preview */}
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-[11px] px-1 text-[#77718B]">
                      <span className="flex items-center gap-1.5 font-bold">
                        <span className={cn("w-2 h-2 rounded-full", isListening ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                        {isListening ? "Continuous Listening Active • Speak freely at your pace" : "Ready • Tap Mic to Speak"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAutoSendSilence(!autoSendSilence)}
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1",
                          autoSendSilence ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-500"
                        )}
                      >
                        <span>Auto-Send (5s pause): {autoSendSilence ? "ON" : "OFF"}</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF] shadow-2xs space-y-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#7652C8]">
                          Live Speech Preview
                        </span>
                        {silenceCountdown !== null && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                            ⏱️ Auto-sending in {silenceCountdown}s
                          </span>
                        )}
                        {(transcript || interim) && (
                          <button
                            type="button"
                            onClick={() => resetTranscript()}
                            className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-[#302B42] font-semibold min-h-[28px] break-words leading-relaxed">
                        {transcript && <span>{transcript} </span>}
                        {interim && <span className="text-[#7652C8] italic font-normal">{interim}</span>}
                        {!transcript && !interim && (
                          <span className="text-[#77718B] font-normal italic">
                            {isListening ? "Listening... Speak your entire sentence freely without being cut off!" : "Tap the microphone below when ready to speak."}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Big Glowing Centerpiece Microphone Button with Send Action */}
                <div className="flex flex-col items-center justify-center pt-2 space-y-2">
                  <div className="flex items-center justify-center gap-3">
                    {/* Reset Button if listening and has spoken words */}
                    {isListening && (transcript || interim).trim() && (
                      <button
                        type="button"
                        onClick={() => resetTranscript()}
                        className="px-3 py-2 rounded-2xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      >
                        Reset
                      </button>
                    )}

                    {/* Microphone Circle */}
                    <div className="relative">
                      {isListening && (
                        <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
                      )}
                      {isSpeaking && (
                        <div className="absolute inset-0 rounded-full bg-[#7652C8]/30 animate-ping" />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (isSpeaking) {
                            stopSpeaking();
                            resetTranscript();
                            startListening();
                          } else if (isListening) {
                            const curText = (transcript + ' ' + interim).trim();
                            if (curText) {
                              handleTurnSubmit(curText);
                            } else {
                              stopListening();
                            }
                          } else {
                            stopSpeaking();
                            resetTranscript();
                            startListening();
                          }
                        }}
                        className={cn(
                          'relative w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer',
                          isSpeaking
                            ? 'bg-[#7652C8] text-white ring-8 ring-[#EDE7FF] shadow-[#7652C8]/40 animate-pulse'
                            : isListening
                            ? 'bg-emerald-600 text-white ring-8 ring-emerald-100 shadow-emerald-600/40'
                            : isProcessingTurn
                            ? 'bg-amber-500 text-white ring-8 ring-amber-100 cursor-wait'
                            : 'bg-[#EDE7FF] hover:bg-[#D4C7F5] text-[#7652C8] border-2 border-[#8B70D6]'
                        )}
                      >
                        {isSpeaking ? (
                          <Volume2 className="w-8 h-8 animate-bounce" />
                        ) : isListening ? (
                          <Mic className="w-8 h-8 animate-pulse" />
                        ) : isProcessingTurn ? (
                          <Sparkles className="w-7 h-7 animate-spin" />
                        ) : (
                          <MicOff className="w-7 h-7" />
                        )}
                      </button>
                    </div>

                    {/* Done Speaking Send Button */}
                    {isListening && (transcript || interim).trim() && (
                      <button
                        type="button"
                        onClick={() => handleTurnSubmit((transcript + ' ' + interim).trim())}
                        className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
                      >
                        <Check className="w-4 h-4" />
                        <span>Done Speaking</span>
                      </button>
                    )}
                  </div>

                  <span className="text-xs font-bold text-[#302B42]">
                    {isSpeaking
                      ? 'AI Coach Speaking (Tap to Interrupt)'
                      : isListening
                      ? (transcript || interim).trim()
                        ? 'Tap "Done Speaking" or Mic to Send'
                        : 'Listening to You... (Speak sentence, then tap Done)'
                      : isProcessingTurn
                      ? 'Analyzing Your Speech...'
                      : 'Tap Mic to Speak'}
                  </span>
                </div>

                {/* Typed Fallback Input Bar */}
                <div className="mt-4 pt-3 border-t border-[#EDE7FF]">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (typedInput.trim()) {
                        handleTurnSubmit(typedInput.trim());
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={typedInput}
                      onChange={(e) => setTypedInput(e.target.value)}
                      placeholder="Or type your reply here..."
                      className="flex-1 bg-[#F8F6FF] border border-[#EDE7FF] rounded-xl px-3.5 py-2 text-xs text-[#302B42] placeholder:text-[#77718B] focus:outline-none focus:ring-2 focus:ring-[#7652C8]"
                      disabled={isProcessingTurn}
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={!typedInput.trim() || isProcessingTurn}
                      className="rounded-xl"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>

            {/* 3. RIGHT COLUMN: Live Scorecard & Phrasing Corrections (3 Cols) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Real-time Metrics Card */}
              <div className="rounded-3xl border-2 border-[#EDE7FF] bg-white p-5 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Great! Keep going!
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#302B42] mb-1">
                      <span>Pronunciation</span>
                      <span className="text-emerald-600 font-black">95%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#EDE7FF] overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '95%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#302B42] mb-1">
                      <span>Fluency</span>
                      <span className="text-[#7652C8] font-black">{averageScore}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#EDE7FF] overflow-hidden">
                      <div className="h-full bg-[#7652C8] rounded-full" style={{ width: `${averageScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#302B42] mb-1">
                      <span>Grammar</span>
                      <span className="text-sky-600 font-black">90%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#EDE7FF] overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: '90%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Phrasing Correction Callout Card */}
              {latestCorrection ? (
                <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50/70 p-5 shadow-card space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-800">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Real-time Phrasing Tip</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-rose-700 font-medium line-through">"{latestCorrection.original}"</p>
                    <p className="text-emerald-900 font-black">"{latestCorrection.correction}"</p>
                    <p className="text-[11px] text-emerald-700 leading-relaxed pt-1">
                      {latestCorrection.explanation}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border-2 border-[#EDE7FF] bg-gradient-to-br from-[#EDE7FF]/40 to-[#F8F6FF] p-5 shadow-card space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7652C8]">
                    <Sparkles className="w-4 h-4" />
                    <span>Live Grammar Guidance</span>
                  </div>
                  <p className="text-xs text-[#77718B] leading-relaxed">
                    Whenever you speak or type, your AI coach highlights natural phrasing improvements right here.
                  </p>
                </div>
              )}

              {/* Session Stats Mini Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#EDE7FF] shadow-xs space-y-2 text-xs">
                <div className="flex justify-between text-[#77718B]">
                  <span>Turns Exchanged:</span>
                  <span className="font-black text-[#302B42]">{turns.length}</span>
                </div>
                <div className="flex justify-between text-[#77718B]">
                  <span>Vocabulary Added:</span>
                  <span className="font-black text-[#7652C8]">{newVocabAccumulator.length} words</span>
                </div>
                <div className="flex justify-between text-[#77718B]">
                  <span>Phrasing Tips:</span>
                  <span className="font-black text-emerald-600">{mistakesAccumulator.length}</span>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. STAGE: CELEBRATION & SESSION SUMMARY (Matching Screen 9)               */}
      {/* ========================================================================= */}
      {stage === 'celebration' && (
        <div className="max-w-2xl mx-auto space-y-6 pt-4 animate-fadeIn">
          <div className="rounded-3xl p-8 bg-white border-2 border-[#EDE7FF] shadow-card text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-500 shadow-lg">
              <Trophy className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="font-heading font-black text-3xl text-[#302B42]">
                Outstanding Speaking Practice!
              </h2>
              <p className="text-sm text-[#77718B]">
                You completed a speaking session with {selectedPartner.name}
              </p>
            </div>

            {/* 3 Key Metric Tiles */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#F8F6FF] border border-[#EDE7FF]">
                <span className="text-[11px] font-bold text-[#77718B] block">Duration</span>
                <span className="font-heading font-black text-xl text-[#302B42]">
                  {formatTime(sessionDurationSec)}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 block">Overall Fluency</span>
                <span className="font-heading font-black text-xl text-emerald-600">
                  {averageScore}%
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50 border border-[#D4C7F5]">
                <span className="text-[11px] font-bold text-[#7652C8] block">XP Earned</span>
                <span className="font-heading font-black text-xl text-[#7652C8]">
                  +{Math.max(120, turns.length * 25)} XP
                </span>
              </div>
            </div>

            {/* Mistakes & New Vocabulary Review */}
            {mistakesAccumulator.length > 0 && (
              <div className="text-left space-y-3 pt-2">
                <h4 className="font-heading font-bold text-sm text-[#302B42] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7652C8]" />
                  <span>Phrasing Insights from this Session:</span>
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {mistakesAccumulator.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#F8F6FF] border border-[#EDE7FF] text-xs">
                      <p className="text-rose-700 font-medium line-through">"{m.original}"</p>
                      <p className="text-emerald-800 font-black">"{m.correction}"</p>
                      <p className="text-[10px] text-[#77718B] mt-0.5">{m.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStage('partner-select')}
                className="flex-1 py-3 px-4 rounded-2xl border border-[#D4C7F5] bg-[#F8F6FF] hover:bg-[#EDE7FF] text-[#7652C8] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice Another Session</span>
              </button>
              <Button
                variant="primary"
                onClick={() => (window.location.href = '/dashboard')}
                className="flex-1 rounded-2xl font-black text-xs"
              >
                <span>Return to Dashboard</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to End Session */}
      <Dialog
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        title="End Speaking Session?"
        description="Your practice progress, fluency metrics, and phrasing takeaways will be saved."
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={() => setIsEndModalOpen(false)}>
            Keep Practicing
          </Button>
          <Button variant="danger" onClick={confirmEndSession}>
            End & Save Progress
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
