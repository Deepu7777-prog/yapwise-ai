import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Mic, Sparkles, AlertCircle, RotateCcw, Radio } from 'lucide-react';
import { cn } from '../../lib/utils';
import { REALISTIC_AVATARS, AvatarProfile } from '../../lib/avatars';
import { RealisticHumanAvatar, AvatarState } from '../avatar/RealisticHumanAvatar';

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

const AVATAR_MAP: Record<'kid' | 'english_coach' | 'interview_coach', string> = {
  kid: 'maya_lin',
  english_coach: 'priya_sharma',
  interview_coach: 'alex_vance',
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
  const avatarId = AVATAR_MAP[characterId] || 'priya_sharma';
  const avatar: AvatarProfile =
    REALISTIC_AVATARS.find((a) => a.id === avatarId) || REALISTIC_AVATARS[0];

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

  const avatarState: AvatarState =
    currentState === 'speaking'
      ? 'speaking'
      : currentState === 'listening'
      ? 'listening'
      : currentState === 'processing'
      ? 'thinking'
      : 'ready';

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center p-3 select-none w-full',
        className
      )}
    >
      {/* 1. TOP STATUS PILL (Reflects Exact Visual State) */}
      <div className="mb-2 z-20">
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
              <span>{characterName || avatar.name} is Speaking</span>
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

      {/* 2. REALISTIC HUMAN AVATAR WITH LIVE EXPRESSIONS & LIP SYNCHRONIZATION */}
      <div className="relative w-full flex items-center justify-center">
        <RealisticHumanAvatar
          avatar={avatar}
          state={avatarState}
          size="md"
          className="shadow-xl"
        />

        {/* Dynamic Waveform for Speaking State */}
        {currentState === 'speaking' && (
          <div className="absolute -bottom-2 inset-x-2 z-20 flex items-center justify-center gap-1 bg-white/95 backdrop-blur-md py-1.5 px-3 rounded-2xl border border-[#EDE7FF] shadow-md">
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
          <div className="absolute -bottom-2 inset-x-2 z-20 flex items-center justify-center gap-1.5 bg-[#E1F7EE]/95 backdrop-blur-md py-1.5 px-3 rounded-2xl border border-[#BDEBD9] shadow-md">
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
          {characterName || avatar.name} • {avatar.title}
        </h4>
        <p className="text-xs text-[#77718B]">
          {avatar.tagline}
        </p>
      </div>
    </div>
  );
};
