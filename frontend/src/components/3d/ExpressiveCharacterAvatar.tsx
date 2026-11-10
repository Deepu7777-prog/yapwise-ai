import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Mic, Sparkles, AlertCircle, RotateCcw, Radio, Zap, Target } from 'lucide-react';
import { cn } from '../../lib/utils';

export type CharacterState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface ExpressiveCharacterAvatarProps {
  characterId: 'kid' | 'english_coach' | 'interview_coach';
  characterName: string;
  isSpeaking: boolean;
  isListening: boolean;
  isProcessing: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

interface CharacterProfile {
  name: string;
  title: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  badgeBg: string;
  shadowColor: string;
  icon: typeof Sparkles;
  shortDesc: string;
}

const PROFILES: Record<'kid' | 'english_coach' | 'interview_coach', CharacterProfile> = {
  kid: {
    name: 'Leo',
    title: 'Beginner English Buddy',
    accentColor: '#10B981', // Mint green
    gradientFrom: '#34D399',
    gradientTo: '#059669',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    shadowColor: 'rgba(16, 185, 129, 0.4)',
    icon: Zap,
    shortDesc: 'Casual, patient & friendly everyday conversations',
  },
  english_coach: {
    name: 'Maya',
    title: 'English Fluency Coach',
    accentColor: '#7652C8', // Deep lavender/purple
    gradientFrom: '#A78BFA',
    gradientTo: '#7652C8',
    badgeBg: 'bg-[#EDE7FF] text-[#7652C8] border-[#DDD3FF]',
    shadowColor: 'rgba(118, 82, 200, 0.4)',
    icon: Sparkles,
    shortDesc: 'Grammar refinement, vocabulary & natural idioms',
  },
  interview_coach: {
    name: 'Vikram',
    title: 'Placement & Technical Coach',
    accentColor: '#F59E0B', // Amber / Coral
    gradientFrom: '#FCD34D',
    gradientTo: '#D97706',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    shadowColor: 'rgba(245, 158, 11, 0.4)',
    icon: Target,
    shortDesc: 'Technical clarity, behavioral answers & campus rounds',
  },
};

export const ExpressiveCharacterAvatar: React.FC<ExpressiveCharacterAvatarProps> = ({
  characterId,
  characterName,
  isSpeaking,
  isListening,
  isProcessing,
  error,
  onRetry,
  className = '',
}) => {
  const profile = PROFILES[characterId] || PROFILES.english_coach;
  const IconComponent = profile.icon;

  // Determine current active visual state
  const currentState: CharacterState = error
    ? 'error'
    : isSpeaking
    ? 'speaking'
    : isProcessing
    ? 'processing'
    : isListening
    ? 'listening'
    : 'idle';

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center p-4 select-none',
        className
      )}
    >
      {/* 1. TOP STATUS PILL (Reflects Exact Visual State) */}
      <div className="mb-4 z-20">
        <AnimatePresence mode="wait">
          {currentState === 'speaking' && (
            <motion.div
              key="speaking"
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black shadow-md bg-[#7652C8] text-white border border-[#A78BFA]"
            >
              <Volume2 className="w-3.5 h-3.5 animate-bounce" />
              <span>{characterName || profile.name} is Speaking</span>
              <span className="flex gap-0.5 ml-1">
                {[4, 8, 5, 10, 6].map((h, i) => (
                  <motion.span
                    key={i}
                    animate={{ height: [4, h * 1.5, 4] }}
                    transition={{ repeat: Infinity, duration: 0.5 + i * 0.1, ease: 'easeInOut' }}
                    className="w-1 bg-white rounded-full inline-block"
                    style={{ height: h }}
                  />
                ))}
              </span>
            </motion.div>
          )}

          {currentState === 'listening' && (
            <motion.div
              key="listening"
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black shadow-md bg-[#E1F7EE] text-[#1D6A4E] border border-[#BDEBD9]"
            >
              <Radio className="w-3.5 h-3.5 text-[#2E9B71] animate-ping" />
              <span>Listening to You... (Speak Now)</span>
            </motion.div>
          )}

          {currentState === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black shadow-md bg-amber-50 text-amber-800 border border-amber-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              <span>Analyzing Grammar & Fluency...</span>
            </motion.div>
          )}

          {currentState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md bg-rose-50 text-rose-700 border border-rose-200"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>{error || 'Could not hear clearly'}</span>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="ml-1 underline font-black flex items-center gap-1 hover:text-rose-900 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Retry
                </button>
              )}
            </motion.div>
          )}

          {currentState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs bg-white text-[#77718B] border border-[#EDE7FF]"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI Coach Ready • Tap Microphone Below</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. COOL INTERACTIVE AI VOICE ORB & ACOUSTIC CORE */}
      <div
        className="relative w-72 h-76 flex items-center justify-center cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Dynamic Multi-Layer Kinetic Waves (Listening State) */}
        {currentState === 'listening' && (
          <>
            <motion.div
              animate={{ scale: [1, 1.45, 1.8], opacity: [0.7, 0.25, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
              className="absolute w-56 h-56 rounded-full border-2 border-emerald-400 pointer-events-none"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1.6], opacity: [0.8, 0.35, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, delay: 0.35, ease: 'easeOut' }}
              className="absolute w-56 h-56 rounded-full border border-emerald-300 pointer-events-none"
            />
          </>
        )}

        {/* Dynamic Multi-Layer Kinetic Waves (Speaking State) */}
        {currentState === 'speaking' && (
          <>
            <motion.div
              animate={{ scale: [1, 1.25, 1.45], opacity: [0.6, 0.2, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeOut' }}
              className="absolute w-56 h-56 rounded-full border-2 border-[#A78BFA] pointer-events-none"
            />
            <motion.div
              animate={{ scale: [1, 1.15, 1.3], opacity: [0.7, 0.3, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, delay: 0.3, ease: 'easeOut' }}
              className="absolute w-56 h-56 rounded-full border border-[#FF9A91] pointer-events-none"
            />
          </>
        )}

        {/* Ambient Halo Glow */}
        <motion.div
          animate={
            currentState === 'speaking'
              ? { scale: [1, 1.18, 1], opacity: [0.5, 0.85, 0.5] }
              : currentState === 'listening'
              ? { scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }
              : { scale: [0.95, 1.05, 0.95], opacity: [0.3, 0.45, 0.3] }
          }
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="absolute w-52 h-52 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: profile.shadowColor }}
        />

        {/* Rotating Concentric Orbit Ring with Nodes */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: currentState === 'processing' ? 4 : currentState === 'speaking' ? 8 : 16,
            ease: 'linear',
          }}
          className="absolute w-60 h-60 rounded-full border border-dashed border-[#D4C7F5]/80 pointer-events-none flex items-start justify-center"
        >
          <div
            className="w-3 h-3 rounded-full shadow-md"
            style={{ backgroundColor: profile.accentColor }}
          />
        </motion.div>

        {/* Counter-Rotating Outer Dash Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{
            repeat: Infinity,
            duration: 22,
            ease: 'linear',
          }}
          className="absolute w-68 h-68 rounded-full border border-dotted border-[#EDE7FF] pointer-events-none"
        />

        {/* THE MAIN INTERACTIVE SONIC SPHERE */}
        <motion.div
          animate={
            currentState === 'speaking'
              ? {
                  scale: [1, 1.06, 0.98, 1.04, 1],
                  y: [0, -4, 0, -2, 0],
                }
              : currentState === 'listening'
              ? {
                  scale: [1, 1.05, 1],
                  y: -4,
                }
              : currentState === 'processing'
              ? {
                  scale: [1, 0.97, 1.03, 1],
                  rotate: [0, 4, -4, 0],
                }
              : {
                  y: [0, -6, 0],
                  scale: isHovered ? 1.06 : 1,
                }
          }
          transition={{
            repeat: Infinity,
            duration: currentState === 'speaking' ? 0.7 : 3,
            ease: 'easeInOut',
          }}
          className="relative z-10 w-44 h-44 rounded-full flex flex-col items-center justify-center p-4 shadow-2xl transition-transform"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${profile.gradientFrom}, ${profile.gradientTo})`,
            boxShadow: `0 16px 40px -10px ${profile.shadowColor}`,
          }}
        >
          {/* Inner Light Reflection / Glass Sheen */}
          <div className="absolute top-2 inset-x-6 h-14 rounded-full bg-white/30 blur-xs pointer-events-none" />

          {/* Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-inner mb-1">
            <IconComponent className="w-7 h-7 drop-shadow-md" />
          </div>

          {/* Coach Name & Role */}
          <span className="font-heading font-black text-sm text-white drop-shadow-md">
            {profile.name}
          </span>
          <span className="text-[10px] font-bold text-white/90 drop-shadow-xs">
            {characterId === 'kid' ? 'Buddy' : characterId === 'interview_coach' ? 'Interviewer' : 'Fluency'}
          </span>

          {/* Audio Equalizer Frequency Bars Inside Orb */}
          {currentState === 'speaking' && (
            <div className="flex items-center gap-1 mt-1.5">
              {[8, 14, 20, 12, 16, 9].map((h, i) => (
                <motion.span
                  key={i}
                  animate={{ height: [3, h, 3] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.35 + (i % 3) * 0.1,
                    ease: 'easeInOut',
                  }}
                  className="w-1 bg-white rounded-full inline-block"
                  style={{ height: h }}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Dynamic Soundwave Waveform Footer */}
        {currentState === 'speaking' && (
          <div className="absolute -bottom-3 inset-x-4 z-20 flex items-center justify-center gap-1 bg-white/95 backdrop-blur-md py-2 px-4 rounded-2xl border border-[#EDE7FF] shadow-md">
            <Volume2 className="w-3.5 h-3.5 text-[#7652C8] mr-1 shrink-0" />
            {[6, 12, 18, 10, 16, 22, 14, 8, 15, 20, 11, 7].map((baseHeight, i) => (
              <motion.span
                key={i}
                animate={{
                  height: [4, baseHeight * 1.25, 3, baseHeight * 0.75, 4],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.35 + (i % 3) * 0.12,
                  ease: 'easeInOut',
                }}
                className="w-1 rounded-full bg-gradient-to-t from-[#7652C8] to-[#A78BFA]"
                style={{ height: baseHeight }}
              />
            ))}
          </div>
        )}

        {/* Dynamic In-Waveform for Listening State */}
        {currentState === 'listening' && (
          <div className="absolute -bottom-3 inset-x-4 z-20 flex items-center justify-center gap-1.5 bg-[#E1F7EE]/95 backdrop-blur-md py-2 px-4 rounded-2xl border border-[#BDEBD9] shadow-md">
            <Mic className="w-3.5 h-3.5 text-[#2E9B71] animate-pulse shrink-0" />
            <span className="text-[10px] font-black text-[#1D6A4E] mr-1">Listening:</span>
            {[8, 14, 20, 12, 18, 10].map((h, i) => (
              <motion.span
                key={i}
                animate={{
                  height: [4, h * 1.3, 4],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.35 + (i % 2) * 0.15,
                  ease: 'easeInOut',
                }}
                className="w-1 rounded-full bg-[#2E9B71]"
                style={{ height: h }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. COACH SUMMARY & INTERACTION TAGLINE */}
      <div className="mt-4 text-center max-w-xs space-y-1">
        <h4 className="font-heading font-black text-sm text-[#302B42]">
          {characterName || profile.name} • {profile.title}
        </h4>
        <p className="text-xs text-[#77718B]">
          {profile.shortDesc}
        </p>
      </div>
    </div>
  );
};
