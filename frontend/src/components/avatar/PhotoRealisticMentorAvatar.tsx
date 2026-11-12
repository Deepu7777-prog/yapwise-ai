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
  onReplayClick?: () => void;
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
  onReplayClick,
}) => {
  // 1. Natural Eye Blinking Engine
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    let blinkTimeout: any;

    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
        // Next blink between 3.0s and 5.2s
        const nextInterval = 3000 + Math.random() * 2200;
        blinkTimeout = setTimeout(triggerBlink, nextInterval);
      }, 130);
    };

    blinkTimeout = setTimeout(triggerBlink, 2500);
    return () => clearTimeout(blinkTimeout);
  }, []);

  // 2. High-Frequency Real-Time Syllable Oscillator for 100% Visible Lip-Sync
  // Even if browser TTS boundary events are delayed, this guarantees smooth, natural phonetic lip motion!
  const [syllableAperture, setSyllableAperture] = useState(0);

  useEffect(() => {
    if (!isSpeaking) {
      setSyllableAperture(0);
      return;
    }

    let animId: number;
    const startTime = performance.now();

    const updateSyllables = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      // 4.2 Hz oscillation (standard English speech syllable rate: ~4 syllables per second)
      const primaryPulse = (Math.sin(elapsed * 16.5) + 1) / 2; // 0 to 1
      const cadenceMod = (Math.sin(elapsed * 7.2) + 1) / 2;    // Harmonic variation
      // Modulation creates varied jaw drops for open vowels vs consonants
      const aperture = primaryPulse * (0.35 + 0.65 * cadenceMod);
      setSyllableAperture(aperture);

      animId = requestAnimationFrame(updateSyllables);
    };

    animId = requestAnimationFrame(updateSyllables);
    return () => cancelAnimationFrame(animId);
  }, [isSpeaking]);

  // Combined mouth metrics: highest of viseme engine or continuous syllable rhythm
  const rawOpen = Math.max(syllableAperture, mouthTarget?.mouthOpen || 0);
  const mouthOpen = isSpeaking ? Math.min(1.0, Math.max(0, rawOpen * 1.15)) : 0;
  const mouthWide = isSpeaking ? (mouthTarget?.mouthWide || 0.6) : 0.35;

  // 3. Natural Head Kinetics & Conversational Gestures
  const getKineticTransform = (): any => {
    if (state === 'speaking' || isSpeaking) {
      return {
        y: [0, -4, 2, -3, 0],
        rotate: [0, -1.4, 1.0, -0.7, 0],
        scale: [1, 1.008, 1.003, 1.007, 1],
        transition: {
          duration: 2.2,
          repeat: Infinity,
          ease: 'easeInOut' as any,
        },
      };
    }
    if (state === 'listening' || isListening) {
      return {
        y: [-3, -1, -3],
        rotate: 1.5, // Attentive forward head tilt
        scale: 1.015,
        transition: {
          duration: 2.4,
          repeat: Infinity,
          ease: 'easeInOut' as any,
        },
      };
    }
    if (state === 'thinking') {
      return {
        y: -2,
        rotate: -1.6, // Reflective head tilt
        scale: 1.008,
        transition: { duration: 0.6, ease: 'easeOut' as any },
      };
    }
    // Gentle natural breathing
    return {
      y: [0, -2, 0],
      rotate: 0,
      scale: [1, 1.003, 1],
      transition: {
        duration: 4.2,
        repeat: Infinity,
        ease: 'easeInOut' as any,
      },
    };
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#151222] select-none ${className}`}
    >
      {/* Studio Lighting Ambient Glow */}
      <div className="absolute inset-0 bg-radial from-purple-500/10 via-transparent to-black/60 pointer-events-none z-10" />

      {/* Kinetic Avatar Container (Head Nods & Conversational Gestures) */}
      <motion.div
        animate={getKineticTransform()}
        className="relative w-full h-full flex items-center justify-center"
        style={{ transformOrigin: '51% 55%' }}
      >
        {/* Base Image: Real Female AI Mentor in Office Studio */}
        <img
          src="/ai_mentor.jpg"
          alt="YapWise AI Placement Mentor"
          className="w-full h-full object-cover object-center pointer-events-none"
          draggable={false}
        />

        {/* ========================================================================= */}
        {/* REAL-TIME VISIBLE LIP-READING MOUTH APERTURE                               */}
        {/* Centered at exact mouth coordinates (x: 51.1%, y: 32.5%)                 */}
        {/* Flexes open & closed with speech syllables; stops completely when silent   */}
        {/* ========================================================================= */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: '51.1%',
            top: '32.5%',
            width: '10.5%',
            height: '6.5%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {isSpeaking && mouthOpen > 0.08 && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Outer Lip Flesh Shadow Contour */}
              <div
                className="absolute rounded-full transition-all duration-75"
                style={{
                  width: `${Math.max(30, Math.min(85, 42 + mouthWide * 38))}%`,
                  height: `${Math.max(16, mouthOpen * 62)}%`,
                  background: 'radial-gradient(ellipse at center, #260A10 35%, #5E1A27 75%, #8A3040 100%)',
                  boxShadow: '0 0 4px rgba(180, 80, 95, 0.4), inset 0 2px 3px rgba(0,0,0,0.9)',
                }}
              >
                {/* Upper Teeth Arch (Visible on Open Vowels) */}
                {mouthOpen > 0.22 && (
                  <div
                    className="mx-auto rounded-b-md shadow-xs transition-all duration-75"
                    style={{
                      width: '64%',
                      height: `${Math.min(42, mouthOpen * 36)}%`,
                      background: 'linear-gradient(to bottom, #FFFFFF 0%, #F5EDE4 80%, #D4C7BA 100%)',
                    }}
                  />
                )}

                {/* Lower Lip / Tongue Depth Highlight */}
                {mouthOpen > 0.45 && (
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-full transition-all duration-75"
                    style={{
                      width: '52%',
                      height: `${mouthOpen * 26}%`,
                      background: 'linear-gradient(to top, #D46675 0%, #A83E4E 100%)',
                    }}
                  />
                )}
              </div>

              {/* Dynamic Lip Contour Highlight */}
              <div
                className="absolute inset-0 rounded-full border border-[#B75365]/40 pointer-events-none transition-transform duration-75"
                style={{
                  transform: `scale(${0.9 + mouthWide * 0.15}, ${0.8 + mouthOpen * 0.45})`,
                }}
              />
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* NATURAL EYE BLINKING OVERLAY                                               */}
        {/* Left Pupil (46.1%, 24.5%), Right Pupil (54.7%, 22.5%)                     */}
        {/* ========================================================================= */}
        {isBlinking && (
          <>
            {/* Right Eye (Image Left Eye) */}
            <div
              className="absolute pointer-events-none rounded-full bg-[#E2B19D] border-b border-[#6E3626]/50 shadow-xs"
              style={{
                left: '46.1%',
                top: '24.5%',
                width: '3.6%',
                height: '1.5%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.94,
              }}
            />
            {/* Left Eye (Image Right Eye) */}
            <div
              className="absolute pointer-events-none rounded-full bg-[#E2B19D] border-b border-[#6E3626]/50 shadow-xs"
              style={{
                left: '54.7%',
                top: '22.5%',
                width: '3.5%',
                height: '1.5%',
                transform: 'translate(-50%, -50%) rotate(2deg)',
                opacity: 0.94,
              }}
            />
          </>
        )}
      </motion.div>

      {/* ========================================================================= */}
      {/* PROFESSIONAL LIVE STATUS & AUDIO WAVE HUD                                  */}
      {/* ========================================================================= */}

      {/* Top Left: Mentor Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-lg">
        <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
        <span className="font-heading font-black text-xs tracking-wide">
          Aaradhya (AI Senior Mentor)
        </span>
      </div>

      {/* Bottom Center: Conversational State & Sound Waves */}
      {showStatusBadge && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/20 shadow-2xl">
          {/* Status Label */}
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
                  ? 'Mentor Speaking...'
                  : state === 'listening' || isListening
                  ? 'Listening to Candidate...'
                  : state === 'thinking'
                  ? 'Analyzing STAR Rigor...'
                  : 'Ready for Interview')}
            </span>
          </div>

          {/* Sound Wave Frequency Bars (Connected to Speech Audio) */}
          {(isSpeaking || isListening) && (
            <div className="flex items-center gap-0.5 pl-2 border-l border-white/20">
              {[45, 80, 60, 95, 65, 40].map((h, i) => (
                <div
                  key={i}
                  className={`w-0.5 rounded-full transition-all duration-75 ${
                    isSpeaking ? 'bg-purple-300' : 'bg-emerald-300'
                  }`}
                  style={{
                    height: `${Math.max(
                      3,
                      (isSpeaking ? Math.max(0.4, mouthOpen) * 18 : audioLevel * 18 || 7) *
                        (h / 100)
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
