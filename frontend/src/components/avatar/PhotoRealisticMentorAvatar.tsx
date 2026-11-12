import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MouthMorphTarget } from '../../lib/lipSyncEngine';

export type MentorState = 'ready' | 'speaking' | 'listening' | 'thinking' | 'ended';

interface PhotoRealisticMentorAvatarProps {
  state?: MentorState;
  mouthTarget?: MouthMorphTarget;
  isSpeaking?: boolean;
  isListening?: boolean;
  audioLevel?: number; // 0 to 1
  className?: string;
  showStatusBadge?: boolean;
  statusLabel?: string;
}

export const PhotoRealisticMentorAvatar: React.FC<PhotoRealisticMentorAvatarProps> = ({
  state = 'ready',
  mouthTarget,
  isSpeaking = false,
  isListening = false,
  audioLevel = 0,
  className = '',
  showStatusBadge = true,
  statusLabel,
}) => {
  // 1. Natural Blinking Engine
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    let blinkTimeout: any;

    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
        // Next blink in 3.2 to 6.0 seconds
        const nextInterval = 3200 + Math.random() * 2800;
        blinkTimeout = setTimeout(triggerBlink, nextInterval);
      }, 140); // Natural eyelid close/open duration: 140ms
    };

    blinkTimeout = setTimeout(triggerBlink, 3000);
    return () => clearTimeout(blinkTimeout);
  }, []);

  // 2. Head & Torso Kinetics (Natural Breathing & Conversational Gestures)
  // Kinematics dynamically react to speaking, listening, and thinking states
  const getKineticTransform = (): any => {
    if (state === 'speaking' || isSpeaking) {
      return {
        y: [0, -2, 1, -1, 0],
        rotate: [0, -0.6, 0.4, -0.3, 0],
        scale: [1, 1.003, 1, 1.002, 1],
        transition: {
          duration: 2.4,
          repeat: Infinity,
          ease: 'easeInOut' as any,
        },
      };
    }
    if (state === 'listening' || isListening) {
      return {
        y: -1.5,
        rotate: 0.8, // Attentive active-listening head tilt
        scale: 1.006, // Slight forward engagement
        transition: { duration: 0.8, ease: 'easeOut' as any },
      };
    }
    if (state === 'thinking') {
      return {
        y: -1,
        rotate: -1.0, // Reflective head tilt
        scale: 1.002,
        transition: { duration: 0.6, ease: 'easeOut' as any },
      };
    }
    // Idle gentle breathing
    return {
      y: [0, -1.5, 0],
      rotate: 0,
      scale: [1, 1.002, 1],
      transition: {
        duration: 4.5,
        repeat: Infinity,
        ease: 'easeInOut' as any,
      },
    };
  };

  // 3. Lip-Sync Metrics
  // Real-time mouth parameters derived from phoneme / viseme target
  const mouthOpen = isSpeaking ? Math.min(1, Math.max(0, (mouthTarget?.mouthOpen || 0) * 1.1)) : 0;
  const mouthWidth = isSpeaking ? (mouthTarget?.mouthWide || 1.0) : 1.0;
  const mouthSmile = isSpeaking ? (mouthTarget?.smileCurve || 0.4) : 0.6; // Keep her warm smile

  return (
    <div
      className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#151222] select-none ${className}`}
    >
      {/* Dynamic Ambient Studio Lighting */}
      <div className="absolute inset-0 bg-radial from-purple-500/10 via-transparent to-black/60 pointer-events-none z-10" />

      {/* Kinetic Avatar Container */}
      <motion.div
        animate={getKineticTransform()}
        className="relative w-full h-full flex items-center justify-center"
        style={{ transformOrigin: '51% 60%' }}
      >
        {/* Base High-Resolution Mentor Visual */}
        <img
          src="/ai_mentor.jpg"
          alt="YapWise AI Interview Mentor"
          className="w-full h-full object-cover object-center pointer-events-none"
          draggable={false}
        />

        {/* ========================================================================= */}
        {/* REAL-TIME LIP-SYNC COMPOSITE LAYER                                         */}
        {/* Centered at exact mouth coordinates (x: 51.1%, y: 32.5%)                 */}
        {/* Only animates when the AI is speaking actual words; 0% random motion       */}
        {/* ========================================================================= */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: '51.1%',
            top: '32.5%',
            width: '9.2%',
            height: '5.2%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {isSpeaking && mouthOpen > 0.05 && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Inner Oral Cavity & Depth Shadow */}
              <div
                className="absolute rounded-full bg-[#3B151C] transition-all duration-75"
                style={{
                  width: `${Math.max(20, Math.min(65, mouthWidth * 46))}%`,
                  height: `${Math.max(14, mouthOpen * 48)}%`,
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), 0 0 2px rgba(90,20,30,0.5)',
                }}
              >
                {/* Upper Teeth Highlight */}
                {mouthOpen > 0.25 && (
                  <div
                    className="mx-auto bg-gradient-to-b from-[#FFFDF8] to-[#E5DCD0] rounded-b-sm shadow-xs"
                    style={{
                      width: '60%',
                      height: `${Math.min(38, mouthOpen * 32)}%`,
                    }}
                  />
                )}
                {/* Tongue / Lower Cavity Depth */}
                {mouthOpen > 0.4 && (
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-[#C25A68] rounded-t-full"
                    style={{
                      width: '50%',
                      height: `${mouthOpen * 25}%`,
                    }}
                  />
                )}
              </div>

              {/* Dynamic Lip Boundary Shading (Maintains natural lip coloration) */}
              <div
                className="absolute inset-0 rounded-full border border-[#9D4353]/30 pointer-events-none"
                style={{
                  transform: `scale(${mouthWidth * 0.95}, ${0.8 + mouthOpen * 0.45})`,
                  transition: 'transform 80ms ease-out',
                }}
              />
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* REAL-TIME NATURAL BLINKING OVERLAY                                         */}
        {/* Exact eye coordinates: Left Pupil (46.1%, 24.5%), Right Pupil (54.7%, 22.5%)*/}
        {/* ========================================================================= */}
        {isBlinking && (
          <>
            {/* Right Eye (Image Left Eye: 46.1%, 24.5%) */}
            <div
              className="absolute pointer-events-none rounded-full bg-[#E5B5A1] border-b border-[#703B2A]/40 shadow-xs"
              style={{
                left: '46.1%',
                top: '24.5%',
                width: '3.4%',
                height: '1.4%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.92,
              }}
            />
            {/* Left Eye (Image Right Eye: 54.7%, 22.5%) */}
            <div
              className="absolute pointer-events-none rounded-full bg-[#E5B5A1] border-b border-[#703B2A]/40 shadow-xs"
              style={{
                left: '54.7%',
                top: '22.5%',
                width: '3.3%',
                height: '1.4%',
                transform: 'translate(-50%, -50%) rotate(2deg)',
                opacity: 0.92,
              }}
            />
          </>
        )}
      </motion.div>

      {/* ========================================================================= */}
      {/* PROFESSIONAL CONVERSATION HUD OVERLAYS                                     */}
      {/* ========================================================================= */}

      {/* Top Left: Mentor Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white shadow-lg">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-heading font-black text-xs tracking-wide">AI Mentor Interviewer</span>
      </div>

      {/* Bottom Center: Real-Time State & Audio Waveform Dock */}
      {showStatusBadge && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/20 shadow-2xl">
          {/* Status Indicator Icon */}
          <div className="flex items-center gap-2">
            {state === 'speaking' || isSpeaking ? (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-3 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-5 bg-purple-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-3 bg-purple-400 rounded-full animate-bounce" />
              </div>
            ) : state === 'listening' || isListening ? (
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              </div>
            ) : state === 'thinking' ? (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              </div>
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-purple-400/80" />
            )}

            <span className="text-xs font-bold text-white tracking-wide">
              {statusLabel ||
                (state === 'speaking' || isSpeaking
                  ? 'Interviewer Speaking...'
                  : state === 'listening' || isListening
                  ? 'Listening to Candidate...'
                  : state === 'thinking'
                  ? 'Analyzing STAR Rigor...'
                  : 'Ready for Interview')}
            </span>
          </div>

          {/* Mini Real-Time Audio Energy Wave (When Speaking or Listening) */}
          {(isSpeaking || isListening) && (
            <div className="flex items-center gap-0.5 pl-2 border-l border-white/20">
              {[40, 75, 55, 90, 60, 35].map((h, i) => (
                <div
                  key={i}
                  className={`w-0.5 rounded-full transition-all duration-75 ${
                    isSpeaking ? 'bg-purple-300' : 'bg-emerald-300'
                  }`}
                  style={{
                    height: `${Math.max(
                      3,
                      (isSpeaking ? mouthOpen * 16 : audioLevel * 16 || 6) * (h / 100)
                    )}px`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
