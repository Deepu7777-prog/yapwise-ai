import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Sparkles,
  Users,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  MessageSquare,
  Bot,
  User as UserIcon,
  Check,
  Send,
  Zap,
} from 'lucide-react';
import { AvatarProfile, REALISTIC_AVATARS } from '../../lib/avatars';
import { RealisticHumanAvatar, AvatarState } from './RealisticHumanAvatar';
import { LipSyncController, MouthMorphTarget, VISEME_TARGETS } from '../../lib/lipSyncEngine';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { api } from '../../lib/api';
import { SpeakingMode } from '../../lib/types';
import { cn } from '../../lib/utils';

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
}

interface TalkingAvatarArenaProps {
  initialAvatarId?: string;
  mode?: SpeakingMode;
  onSessionEnd?: (messages: ChatMessage[]) => void;
  className?: string;
}

export const TalkingAvatarArena: React.FC<TalkingAvatarArenaProps> = ({
  initialAvatarId = 'priya_sharma',
  mode = 'free',
  onSessionEnd,
  className = '',
}) => {
  // 1. Avatar Selection
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarProfile>(() => {
    return REALISTIC_AVATARS.find((a) => a.id === initialAvatarId) || REALISTIC_AVATARS[0];
  });
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  // 2. Conversation States: 'ready' | 'listening' | 'thinking' | 'speaking' | 'ended'
  const [conversationState, setConversationState] = useState<AvatarState>('ready');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState<number>(1.0);
  const [showTranscript, setShowTranscript] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  // 3. Lip Sync Controller
  const lipSyncControllerRef = useRef<LipSyncController>(new LipSyncController());
  const [currentMouthTarget, setCurrentMouthTarget] = useState<MouthMorphTarget>({
    ...VISEME_TARGETS.viseme_sil,
  });

  // 4. Speech Synthesis & Recognition Hooks
  const { isSpeaking, speak, cancel: cancelSpeech, voices } = useSpeechSynthesis();
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
  } = useSpeechRecognition('en-IN');

  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Auto-scroll transcript drawer
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [messages, interimTranscript]);

  // Synchronize 60fps lip-sync controller with current mouth target
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      const target = lipSyncControllerRef.current.update(delta);
      setCurrentMouthTarget({ ...target });
      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  // Update speech intensity & speaking state in lip sync controller
  useEffect(() => {
    lipSyncControllerRef.current.setSpeaking(isSpeaking);
    if (!isSpeaking && conversationState === 'speaking') {
      setConversationState('ready');
    }
  }, [isSpeaking, conversationState]);

  // Simulated audio level for reactive waves & head nods
  useEffect(() => {
    let interval: any;
    if (conversationState === 'speaking') {
      interval = setInterval(() => {
        setAudioLevel(0.4 + Math.random() * 0.6);
      }, 100);
    } else if (conversationState === 'listening' && (transcript || interimTranscript)) {
      interval = setInterval(() => {
        setAudioLevel(0.3 + Math.random() * 0.5);
      }, 100);
    } else {
      setAudioLevel(0);
    }
    return () => clearInterval(interval);
  }, [conversationState, transcript, interimTranscript]);

  /**
   * Speaks text using speech synthesis while streaming words to LipSyncController
   */
  const speakWithLipSync = useCallback(
    (textToSpeak: string) => {
      if (isMuted) return;

      cancelSpeech();
      setConversationState('speaking');
      lipSyncControllerRef.current.setSpeaking(true, textToSpeak.split(' ')[0]);

      // Resolve best matching voice for current avatar
      let targetVoice = null;
      if (voices.length > 0) {
        const keywords = selectedAvatar.voiceConfig.targetKeywords;
        for (const kw of keywords) {
          const match = voices.find((v) => v.name.toLowerCase().includes(kw));
          if (match) {
            targetVoice = match;
            break;
          }
        }
        if (!targetVoice) {
          targetVoice =
            voices.find((v) =>
              selectedAvatar.gender === 'female'
                ? v.name.toLowerCase().includes('female')
                : v.name.toLowerCase().includes('male')
            ) || voices[0];
        }
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.pitch = selectedAvatar.voiceConfig.pitch;
      utterance.rate = selectedAvatar.voiceConfig.rate;
      utterance.volume = volume;
      if (targetVoice) utterance.voice = targetVoice;

      // Real-time word boundary phoneme tracking
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const spokenWord = textToSpeak.substring(
            event.charIndex,
            event.charIndex + (event.charLength || 6)
          );
          lipSyncControllerRef.current.onWordBoundary(spokenWord);
        }
      };

      utterance.onend = () => {
        lipSyncControllerRef.current.setSpeaking(false);
        setConversationState('ready');
      };

      utterance.onerror = (e) => {
        if (e.error !== 'canceled') {
          console.warn('Utterance playback warning:', e.error);
        }
        lipSyncControllerRef.current.setSpeaking(false);
        setConversationState('ready');
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Speech synthesis error:', err);
        lipSyncControllerRef.current.setSpeaking(false);
        setConversationState('ready');
      }
    },
    [isMuted, cancelSpeech, selectedAvatar, voices, volume]
  );

  /**
   * Initial Avatar Greeting on Mount or Switch
   */
  useEffect(() => {
    const greetingMsg: ChatMessage = {
      id: `msg-greet-${Date.now()}`,
      role: 'assistant',
      text: selectedAvatar.welcomePrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([greetingMsg]);

    // Give browser a moment to initialize audio subsystem, then greet
    const timer = setTimeout(() => {
      speakWithLipSync(selectedAvatar.welcomePrompt);
    }, 450);

    return () => clearTimeout(timer);
  }, [selectedAvatar, speakWithLipSync]);

  /**
   * Process User Speech / Input through AI Backend
   */
  const handleProcessUserSpeech = useCallback(
    async (userInputText: string) => {
      const cleanInput = userInputText.trim();
      if (!cleanInput) return;

      stopListening();
      cancelSpeech();

      // Add user turn to chat feed
      const userMsg: ChatMessage = {
        id: `msg-user-${Date.now()}`,
        role: 'user',
        text: cleanInput,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, userMsg]);
      resetTranscript();
      setTextInput('');

      // Transition to Thinking
      setConversationState('thinking');

      try {
        // Send to backend speaking agent turn API
        const historyPayload = messages.slice(-8).map((m) => ({
          role: m.role,
          content: m.text,
        }));

        const response = await api.speaking.sendTurn(
          cleanInput,
          mode,
          historyPayload
        );

        const aiResponseText =
          response?.spoken_response ||
          response?.follow_up_question ||
          "That's a thoughtful point! Let's continue building on that.";

        // Add assistant turn
        const aiMsg: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          role: 'assistant',
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);

        // Speak response with real-time lip-sync
        speakWithLipSync(aiResponseText);
      } catch (err) {
        console.error('Error generating AI avatar response:', err);
        const fallbackText =
          "I heard you clearly! You expressed that point with great confidence. How would you apply that in a real-world placement interview?";
        const fallbackMsg: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          role: 'assistant',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
        speakWithLipSync(fallbackText);
      }
    },
    [stopListening, cancelSpeech, resetTranscript, messages, mode, selectedAvatar, speakWithLipSync]
  );

  /**
   * Silence Auto-Submit: When user finishes speaking in microphone
   */
  const silenceTimerRef = useRef<any>(null);

  useEffect(() => {
    if (isListening && transcript.trim()) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      // Wait for 1.8 seconds of silence before submitting speech
      silenceTimerRef.current = setTimeout(() => {
        handleProcessUserSpeech(transcript);
      }, 1800);
    }
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [transcript, isListening, handleProcessUserSpeech]);

  /**
   * Toggle Microphone / Voice Input
   */
  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        handleProcessUserSpeech(transcript);
      } else {
        setConversationState('ready');
      }
    } else {
      cancelSpeech();
      resetTranscript();
      setConversationState('listening');
      startListening();
    }
  };

  /**
   * End Conversation
   */
  const handleEndConversation = () => {
    cancelSpeech();
    stopListening();
    setConversationState('ended');
    if (onSessionEnd) {
      onSessionEnd(messages);
    }
  };

  // State badge styling
  const stateBadgeMap: Record<
    AvatarState,
    { label: string; badgeClass: string; icon: typeof Sparkles }
  > = {
    ready: {
      label: 'Ready to talk',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Sparkles,
    },
    listening: {
      label: 'Listening to you...',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
      icon: Mic,
    },
    thinking: {
      label: 'Thinking & analyzing...',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Sparkles,
    },
    speaking: {
      label: `${selectedAvatar.name.split(' ')[0]} is speaking...`,
      badgeClass: 'bg-[#EDE7FF] text-[#7652C8] border-[#DDD3FF]',
      icon: Volume2,
    },
    ended: {
      label: 'Conversation ended',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: Square,
    },
  };

  const activeBadge = stateBadgeMap[conversationState];
  const BadgeIcon = activeBadge.icon;

  return (
    <div
      className={cn(
        'relative w-full rounded-3xl border border-[#EDE7FF] bg-gradient-to-b from-[#FFFDF9] via-[#FAF6FF] to-[#F5EFFF] shadow-card overflow-hidden flex flex-col justify-between',
        className
      )}
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER & HUD BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#EDE7FF] bg-white/80 backdrop-blur-md z-20">
        {/* Left: Avatar Info & Switch Button */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md"
            style={{
              background: `linear-gradient(135deg, ${selectedAvatar.gradient.from}, ${selectedAvatar.gradient.to})`,
            }}
          >
            {selectedAvatar.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-black text-sm sm:text-base text-[#302B42]">
                {selectedAvatar.name}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EDE7FF] text-[#7652C8] border border-[#DDD3FF] hidden sm:inline">
                {selectedAvatar.badge}
              </span>
            </div>
            <p className="text-[11px] text-[#77718B] truncate max-w-[200px] sm:max-w-xs">
              {selectedAvatar.role}
            </p>
          </div>
        </div>

        {/* Center: Live Conversation State Pill */}
        <div className="hidden md:flex items-center">
          <div
            className={cn(
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-xs transition-all duration-300',
              activeBadge.badgeClass
            )}
          >
            <BadgeIcon className="w-3.5 h-3.5" />
            <span>{activeBadge.label}</span>
          </div>
        </div>

        {/* Right: Avatar Switcher & Volume Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Switch Avatar Dropdown Button */}
          <button
            type="button"
            onClick={() => setIsAvatarPickerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F6FF] hover:bg-[#EDE7FF] border border-[#EDE7FF] text-[#7652C8] text-xs font-bold transition-colors cursor-pointer"
            title="Switch Avatar"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Change Avatar</span>
          </button>

          {/* Mute / Unmute Toggle */}
          <button
            type="button"
            onClick={() => {
              if (!isMuted) cancelSpeech();
              setIsMuted(!isMuted);
            }}
            className="p-2 rounded-xl bg-[#F8F6FF] hover:bg-[#EDE7FF] border border-[#EDE7FF] text-[#77718B] hover:text-[#302B42] transition-colors cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#7652C8]" />
            )}
          </button>

          {/* End Conversation Button */}
          <button
            type="button"
            onClick={handleEndConversation}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="End Conversation"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">End Session</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN CENTER STAGE: LARGE REALISTIC TALKING AVATAR */}
      {/* ------------------------------------------------------------- */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-4 sm:p-8 min-h-[380px] sm:min-h-[460px]">
        {/* Mobile State Pill */}
        <div className="md:hidden mb-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs',
              activeBadge.badgeClass
            )}
          >
            <BadgeIcon className="w-3 h-3" />
            <span>{activeBadge.label}</span>
          </span>
        </div>

        {/* Large Prominent Realistic Human Avatar */}
        <div className="relative">
          <RealisticHumanAvatar
            avatar={selectedAvatar}
            state={conversationState}
            mouthTarget={currentMouthTarget}
            audioLevel={audioLevel}
            size="xl"
            className="transition-transform duration-300"
          />

          {/* Active Speaking / Listening Kinetic Waveform Halo */}
          {conversationState === 'speaking' && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-4 py-1.5 rounded-full bg-white/90 border border-[#A78BFA] shadow-lg backdrop-blur-md">
              <Volume2 className="w-3.5 h-3.5 text-[#7652C8] animate-pulse" />
              <div className="flex items-center gap-0.5 h-4">
                {[12, 22, 16, 28, 18, 24, 14, 20].map((h, i) => (
                  <motion.span
                    key={i}
                    animate={{ height: [4, h * (0.5 + audioLevel * 0.7), 4] }}
                    transition={{ repeat: Infinity, duration: 0.4 + i * 0.08, ease: 'easeInOut' }}
                    className="w-1 bg-[#7652C8] rounded-full inline-block"
                  />
                ))}
              </div>
            </div>
          )}

          {conversationState === 'listening' && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/30">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span className="text-xs font-black tracking-wide">Listening to your voice...</span>
            </div>
          )}
        </div>

        {/* Real-time Interim Transcription Banner */}
        {isListening && (interimTranscript || transcript) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 max-w-xl w-full px-4 py-2.5 rounded-2xl bg-white/95 border border-[#EDE7FF] shadow-card text-center"
          >
            <span className="text-[10px] font-bold text-[#77718B] block mb-0.5">YOU ARE SAYING:</span>
            <p className="text-sm font-semibold text-[#302B42] italic">
              "{transcript || interimTranscript}"
            </p>
          </motion.div>
        )}

        {/* Speech Recognition Error Banner if permissions are denied */}
        {speechError && (
          <div className="mt-4 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
            <span>{speechError}</span>
            <button
              type="button"
              onClick={() => startListening()}
              className="underline font-bold hover:text-amber-950 cursor-pointer"
            >
              Retry Mic
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. CONVERSATION TRANSCRIPT DRAWER (Collapsible) */}
      {/* ------------------------------------------------------------- */}
      <div className="border-t border-[#EDE7FF] bg-white/95">
        <button
          type="button"
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full py-2 px-4 flex items-center justify-between text-xs font-bold text-[#77718B] hover:bg-[#F8F6FF] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#7652C8]" />
            Live Conversation Transcript ({messages.length} messages)
          </span>
          {showTranscript ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        <AnimatePresence>
          {showTranscript && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div
                ref={transcriptScrollRef}
                className="max-h-36 sm:max-h-44 overflow-y-auto p-4 space-y-3 bg-[#FCFAFF] border-t border-[#F0EBF8]"
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex items-start gap-2.5 text-xs',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0 mt-0.5"
                        style={{
                          background: `linear-gradient(135deg, ${selectedAvatar.gradient.from}, ${selectedAvatar.gradient.to})`,
                        }}
                      >
                        {selectedAvatar.name.charAt(0)}
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-3.5 py-2 leading-relaxed shadow-xs',
                        msg.role === 'user'
                          ? 'bg-[#7652C8] text-white rounded-tr-xs'
                          : 'bg-white text-[#302B42] border border-[#EDE7FF] rounded-tl-xs'
                      )}
                    >
                      <p>{msg.text}</p>
                      <span
                        className={cn(
                          'text-[9px] mt-1 block font-mono',
                          msg.role === 'user' ? 'text-white/70 text-right' : 'text-[#77718B]'
                        )}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-[#EDE7FF] text-[#7652C8] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. BOTTOM FLOATING CONTROL DOCK (Mic, Text Fallback, Volume) */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 sm:p-5 border-t border-[#EDE7FF] bg-white flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
        {/* Left: Volume Slider */}
        <div className="hidden lg:flex items-center gap-2 w-48">
          <Volume2 className="w-4 h-4 text-[#77718B]" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full accent-[#7652C8] h-1.5 bg-[#EDE7FF] rounded-lg cursor-pointer"
            title="Adjust AI Voice Volume"
          />
          <span className="text-[10px] font-mono font-bold text-[#77718B] w-8">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Center: Prominent Microphone Control Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleMic}
            className={cn(
              'relative p-4 sm:p-5 rounded-full text-white font-bold shadow-xl transition-all duration-300 flex items-center justify-center cursor-pointer',
              isListening
                ? 'bg-rose-500 shadow-rose-500/40 scale-110'
                : 'bg-gradient-to-tr from-[#7652C8] to-[#906EE5] hover:scale-105 shadow-[#7652C8]/35'
            )}
            title={isListening ? 'Stop Listening' : 'Speak into Microphone'}
          >
            {/* Dynamic Animated Pulse Rings while listening */}
            {isListening && (
              <>
                <motion.span
                  animate={{ scale: [1, 1.4, 1.8], opacity: [0.8, 0.4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full border-2 border-rose-400 pointer-events-none"
                />
                <motion.span
                  animate={{ scale: [1, 1.25, 1.5], opacity: [0.9, 0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full border border-rose-300 pointer-events-none"
                />
              </>
            )}
            {isListening ? <Mic className="w-6 h-6 animate-pulse" /> : <Mic className="w-6 h-6" />}
          </button>

          <div className="text-left">
            <span className="text-xs font-black text-[#302B42] block">
              {isListening ? 'Listening... Tap to finish' : 'Tap to Speak'}
            </span>
            <span className="text-[11px] text-[#77718B]">
              {isListening ? 'AI will respond when you pause' : 'Natural two-way voice chat'}
            </span>
          </div>
        </div>

        {/* Right: Quick Text Input Fallback */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && textInput.trim()) {
                handleProcessUserSpeech(textInput);
              }
            }}
            placeholder="Or type your message..."
            className="w-full sm:w-64 px-3.5 py-2 rounded-xl bg-[#F8F6FF] border border-[#EDE7FF] text-xs text-[#302B42] placeholder-[#77718B] focus:outline-none focus:ring-2 focus:ring-[#7652C8]"
          />
          <button
            type="button"
            onClick={() => handleProcessUserSpeech(textInput)}
            disabled={!textInput.trim() || conversationState === 'thinking'}
            className="p-2 rounded-xl bg-[#7652C8] hover:bg-[#6240B2] disabled:opacity-40 text-white transition-colors cursor-pointer"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. INTERACTIVE AVATAR SELECTOR MODAL */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isAvatarPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#EDE7FF] p-6 max-w-2xl w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#EDE7FF] pb-4">
                <div>
                  <h3 className="font-heading font-black text-lg text-[#302B42]">
                    Choose Your AI Talking Avatar
                  </h3>
                  <p className="text-xs text-[#77718B]">
                    Select from diverse male and female professional mentors tailored for campus placements.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-[#F8F6FF] text-[#77718B] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Avatar Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[380px] overflow-y-auto p-1">
                {REALISTIC_AVATARS.map((av) => {
                  const isSelected = av.id === selectedAvatar.id;
                  return (
                    <div
                      key={av.id}
                      onClick={() => {
                        cancelSpeech();
                        setSelectedAvatar(av);
                        setIsAvatarPickerOpen(false);
                      }}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md',
                        isSelected
                          ? 'border-[#7652C8] bg-[#FAF7FF] shadow-xs'
                          : 'border-[#EDE7FF] bg-white hover:border-[#D4C7F5]'
                      )}
                    >
                      <div className="relative shrink-0 w-16 h-18 rounded-xl overflow-hidden bg-gradient-to-b from-[#F5F1FD] to-[#EDE7FF] flex items-center justify-center">
                        <RealisticHumanAvatar
                          avatar={av}
                          state="ready"
                          size="sm"
                          className="scale-75 -translate-y-2 pointer-events-none"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-black text-sm text-[#302B42] truncate">
                            {av.name}
                          </span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#7652C8] text-white flex items-center justify-center text-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-[#7652C8] block truncate">
                          {av.title}
                        </span>
                        <p className="text-[11px] text-[#77718B] line-clamp-2 mt-0.5">
                          {av.tagline}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2 border-t border-[#EDE7FF]">
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(false)}
                  className="px-5 py-2 rounded-xl bg-[#7652C8] text-white text-xs font-bold hover:bg-[#6240B2] transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
