import React, { useEffect, useRef, useState } from 'react';
import { AvatarProfile } from '../../lib/avatars';
import { MouthMorphTarget, VISEME_TARGETS, lerp } from '../../lib/lipSyncEngine';
import { cn } from '../../lib/utils';

export type AvatarState = 'ready' | 'listening' | 'thinking' | 'speaking' | 'ended';

interface RealisticHumanAvatarProps {
  avatar: AvatarProfile;
  state: AvatarState;
  mouthTarget?: MouthMorphTarget;
  audioLevel?: number; // 0.0 to 1.0 (from microphone or audio output)
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const RealisticHumanAvatar: React.FC<RealisticHumanAvatarProps> = ({
  avatar,
  state,
  mouthTarget = VISEME_TARGETS.viseme_sil,
  audioLevel = 0,
  className = '',
  size = 'lg',
}) => {
  // Kinetic Head Transformation States
  const [headTilt, setHeadTilt] = useState({ x: 0, y: 0, rotZ: 0 });
  const [eyeGaze, setEyeGaze] = useState({ x: 0, y: 0 });
  const [blinkProgress, setBlinkProgress] = useState(0); // 0 = open, 1 = closed

  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const lastBlinkTimeRef = useRef<number>(Date.now());
  const blinkDurationRef = useRef<number>(140);
  const isBlinkingRef = useRef<boolean>(false);
  const nextBlinkIntervalRef = useRef<number>(3200);

  // Smooth interpolated mouth target
  const smoothMouthRef = useRef<MouthMorphTarget>({ ...VISEME_TARGETS.viseme_sil });
  const [, forceRender] = useState({});

  useEffect(() => {
    let lastTimestamp = performance.now();

    const animate = (timestamp: number) => {
      const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = timestamp;
      timeRef.current += delta;
      const t = timeRef.current;

      // 1. Natural Eyelid Blinking Routine
      const now = Date.now();
      const elapsedSinceBlink = now - lastBlinkTimeRef.current;

      if (!isBlinkingRef.current && elapsedSinceBlink > nextBlinkIntervalRef.current) {
        isBlinkingRef.current = true;
        lastBlinkTimeRef.current = now;
        blinkDurationRef.current = 130 + Math.random() * 40;
      }

      if (isBlinkingRef.current) {
        const blinkTime = now - lastBlinkTimeRef.current;
        const halfBlink = blinkDurationRef.current / 2;

        if (blinkTime < halfBlink) {
          // Closing (0 -> 1)
          setBlinkProgress(blinkTime / halfBlink);
        } else if (blinkTime < blinkDurationRef.current) {
          // Opening (1 -> 0)
          setBlinkProgress(1 - (blinkTime - halfBlink) / halfBlink);
        } else {
          // Blink finished
          setBlinkProgress(0);
          isBlinkingRef.current = false;
          lastBlinkTimeRef.current = now;
          // Randomize next blink: 2.8s to 5.2s, occasional quick double blink
          const isDouble = Math.random() < 0.18;
          nextBlinkIntervalRef.current = isDouble ? 250 : 2800 + Math.random() * 2400;
        }
      }

      // 2. Kinetic Head Motion & Eye Gaze per State
      if (state === 'listening') {
        // Attentive tilt towards user, subtle nod with audio level
        const reactiveNod = audioLevel * 3.5;
        setHeadTilt({
          x: Math.sin(t * 1.5) * 1.0 + reactiveNod,
          y: Math.cos(t * 1.2) * 1.2,
          rotZ: 2.2 + Math.sin(t * 2) * 0.5,
        });
        setEyeGaze({
          x: Math.sin(t * 0.8) * 1.0,
          y: 1.5, // Attentive eye contact
        });
      } else if (state === 'thinking') {
        // Contemplative gaze shifting slightly up and left, head slight back
        setHeadTilt({
          x: -2.5 + Math.sin(t * 1.2) * 0.8,
          y: -4.0 + Math.cos(t * 1.0) * 1.2,
          rotZ: -2.0,
        });
        setEyeGaze({
          x: -5.0 + Math.sin(t * 0.5) * 1.5,
          y: -6.5 + Math.cos(t * 0.5) * 1.5,
        });
      } else if (state === 'speaking') {
        // Lively conversational micro-nods and emphasis oscillations
        const nodCadence = Math.sin(t * 5.5) * 2.5;
        const sideSway = Math.cos(t * 2.8) * 1.8;
        setHeadTilt({
          x: nodCadence,
          y: sideSway,
          rotZ: Math.sin(t * 2.0) * 1.2,
        });
        // Occasional natural gaze shift
        setEyeGaze({
          x: Math.sin(t * 1.1) * 2.0,
          y: Math.cos(t * 1.3) * 1.0,
        });
      } else {
        // Ready / Ended: Gentle natural breathing cycle
        const breathing = Math.sin(t * 1.6) * 1.2;
        setHeadTilt({
          x: breathing,
          y: Math.sin(t * 0.9) * 0.8,
          rotZ: Math.cos(t * 1.2) * 0.6,
        });
        setEyeGaze({
          x: Math.sin(t * 0.4) * 1.5,
          y: 0,
        });
      }

      // 3. Smooth Mouth Interpolation (Lerp)
      const current = smoothMouthRef.current;
      const target = state === 'speaking' ? mouthTarget : VISEME_TARGETS.viseme_sil;
      const factor = Math.min(1.0, delta * 20.0);

      current.mouthOpen = lerp(current.mouthOpen, target.mouthOpen, factor);
      current.mouthWide = lerp(current.mouthWide, target.mouthWide, factor);
      current.mouthRound = lerp(current.mouthRound, target.mouthRound, factor);
      current.upperTeeth = lerp(current.upperTeeth, target.upperTeeth, factor);
      current.lowerTeeth = lerp(current.lowerTeeth, target.lowerTeeth, factor);
      current.tongueVisible = lerp(current.tongueVisible, target.tongueVisible, factor);
      current.jawDrop = lerp(current.jawDrop, target.jawDrop, factor);
      current.smileCurve = lerp(current.smileCurve, target.smileCurve, factor);

      forceRender({});
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [state, mouthTarget, audioLevel]);

  const { visualTraits } = avatar;
  const mouth = smoothMouthRef.current;

  // Eyebrow emotional adjustments
  const browOffset =
    state === 'thinking' ? -4 : state === 'speaking' ? -1.5 : state === 'listening' ? 1.5 : 0;
  const browFurrow = state === 'thinking' ? 3 : 0;

  // Dimensions
  const sizeMap: Record<string, string> = {
    sm: 'w-44 h-48',
    md: 'w-64 h-72',
    lg: 'w-80 h-96 sm:w-96 sm:h-[420px]',
    xl: 'w-96 h-[460px] sm:w-[480px] sm:h-[540px]',
    '2xl': 'w-full h-full max-w-[520px] max-h-[480px]',
    full: 'w-full h-full min-h-[300px]',
  };

  // Mouth calculation parameters
  const mouthCenterY = 228 + mouth.jawDrop * 8;
  const mouthHalfWidth = 26 + mouth.mouthWide * 18 - mouth.mouthRound * 10;
  const mouthHeight = Math.max(3, mouth.mouthOpen * 28);
  const smileElevation = mouth.smileCurve * 9;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center select-none overflow-hidden rounded-3xl',
        sizeMap[size],
        className
      )}
    >
      {/* 1. AMBIENT BACKDROP HALO & STATE GLOW */}
      <div
        className={cn(
          'absolute inset-0 rounded-3xl transition-all duration-700 pointer-events-none opacity-40 blur-2xl',
          state === 'speaking'
            ? 'scale-105 opacity-60'
            : state === 'listening'
            ? 'scale-100 opacity-50'
            : 'scale-95 opacity-25'
        )}
        style={{
          background: `radial-gradient(circle at 50% 45%, ${avatar.gradient.glow}, transparent 70%)`,
        }}
      />

      {/* 2. REALISTIC VECTOR-MESH SVG HEAD & TORSO */}
      <svg
        viewBox="0 0 360 400"
        className="w-full h-full drop-shadow-2xl transition-transform duration-100 ease-out"
        style={{
          transform: `translate3d(${headTilt.y * 1.5}px, ${headTilt.x * 1.5}px, 0) rotate(${headTilt.rotZ}deg)`,
          transformOrigin: '50% 85%',
        }}
      >
        <defs>
          {/* Skin Gradients */}
          <radialGradient id={`skin-grad-${avatar.id}`} cx="50%" cy="38%" r="55%">
            <stop offset="0%" stopColor={visualTraits.skinHighlight} />
            <stop offset="55%" stopColor={visualTraits.skinTone} />
            <stop offset="100%" stopColor={visualTraits.skinShadow} />
          </radialGradient>

          <linearGradient id={`neck-grad-${avatar.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={visualTraits.skinShadow} />
            <stop offset="85%" stopColor={visualTraits.skinTone} />
          </linearGradient>

          {/* Hair Gradients */}
          <linearGradient id={`hair-grad-${avatar.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={visualTraits.hairHighlight} />
            <stop offset="40%" stopColor={visualTraits.hairColor} />
            <stop offset="100%" stopColor="#0B0908" />
          </linearGradient>

          {/* Attire Gradients */}
          <linearGradient id={`attire-grad-${avatar.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={visualTraits.attireSecondaryColor} />
            <stop offset="35%" stopColor={visualTraits.attirePrimaryColor} />
            <stop offset="100%" stopColor="#0A0F1D" />
          </linearGradient>

          {/* Soft Shadow Filters */}
          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000" floodOpacity="0.25" />
          </filter>

          {/* Eye Socket Clip Paths for Natural In-Socket Blinking */}
          <clipPath id={`left-eye-clip-${avatar.id}`}>
            <path d="M -18 0 C -12 -9, 12 -9, 18 0 C 12 8, -12 8, -18 0 Z" />
          </clipPath>
          <clipPath id={`right-eye-clip-${avatar.id}`}>
            <path d="M -18 0 C -12 -9, 12 -9, 18 0 C 12 8, -12 8, -18 0 Z" />
          </clipPath>
        </defs>

        {/* ------------------------------------------------------------- */}
        {/* A. TORSO & PROFESSIONAL ATTIRE (Tailored Suit / Jacket / Collar) */}
        {/* ------------------------------------------------------------- */}
        <g id="torso" filter="url(#soft-shadow)">
          {/* Shoulders */}
          <path
            d="M 60 400 C 60 325, 110 300, 180 300 C 250 300, 300 325, 300 400 Z"
            fill={`url(#attire-grad-${avatar.id})`}
          />

          {/* Inner Shirt / Blouse Collar */}
          <path d="M 145 300 L 180 345 L 215 300 Z" fill="#F8FAFC" />
          <path d="M 180 345 L 180 400" stroke="#E2E8F0" strokeWidth="2" />

          {/* Lapels */}
          <path
            d="M 125 300 L 165 370 L 180 400 L 195 370 L 235 300 L 215 300 L 180 355 L 145 300 Z"
            fill={visualTraits.attirePrimaryColor}
            opacity="0.95"
          />

          {/* Necktie / Scarf for specific styles */}
          {visualTraits.attireStyle === 'charcoal_blazer' || visualTraits.attireStyle === 'executive_formal' ? (
            <path
              d="M 175 330 L 185 330 L 190 395 L 180 400 L 170 395 Z"
              fill={avatar.accentColor}
            />
          ) : null}
        </g>

        {/* ------------------------------------------------------------- */}
        {/* B. NECK */}
        {/* ------------------------------------------------------------- */}
        <path
          d="M 152 245 L 150 315 C 165 322, 195 322, 210 315 L 208 245 Z"
          fill={`url(#neck-grad-${avatar.id})`}
        />
        {/* Neck Shadow under chin */}
        <path
          d="M 152 248 C 170 262, 190 262, 208 248 C 195 258, 165 258, 152 248 Z"
          fill="#000"
          opacity="0.22"
        />

        {/* ------------------------------------------------------------- */}
        {/* C. HEAD & FACE STRUCTURE */}
        {/* ------------------------------------------------------------- */}
        <g id="head">
          {/* Back Hair Layer (Behind Face) */}
          {visualTraits.hairStyle === 'wavy_shoulder' && (
            <path
              d="M 90 140 C 70 200, 75 270, 95 315 C 105 285, 110 240, 112 210 L 248 210 C 250 240, 255 285, 265 315 C 285 270, 290 200, 270 140 Z"
              fill={`url(#hair-grad-${avatar.id})`}
            />
          )}

          {/* Ears */}
          <ellipse cx="108" cy="182" rx="11" ry="19" fill={visualTraits.skinTone} />
          <ellipse cx="108" cy="182" rx="7" ry="12" fill={visualTraits.skinShadow} opacity="0.6" />
          <ellipse cx="252" cy="182" rx="11" ry="19" fill={visualTraits.skinTone} />
          <ellipse cx="252" cy="182" rx="7" ry="12" fill={visualTraits.skinShadow} opacity="0.6" />

          {/* Face Contours (Slightly jaw-drop dynamic) */}
          <path
            d={`M 112 150 C 108 215, 125 ${245 + mouth.jawDrop * 5}, 180 ${
              260 + mouth.jawDrop * 8
            } C 235 ${245 + mouth.jawDrop * 5}, 252 215, 248 150 C 248 90, 112 90, 112 150 Z`}
            fill={`url(#skin-grad-${avatar.id})`}
            filter="url(#soft-shadow)"
          />

          {/* Cheek Contour & Soft Warm Blush */}
          <ellipse
            cx="138"
            cy="198"
            rx="18"
            ry="10"
            fill={avatar.gender === 'female' ? '#F43F5E' : '#E11D48'}
            opacity="0.14"
          />
          <ellipse
            cx="222"
            cy="198"
            rx="18"
            ry="10"
            fill={avatar.gender === 'female' ? '#F43F5E' : '#E11D48'}
            opacity="0.14"
          />

          {/* Forehead & Temple Highlights */}
          <ellipse cx="180" cy="125" rx="42" ry="24" fill={visualTraits.skinHighlight} opacity="0.35" />

          {/* ----------------------------------------------------------- */}
          {/* D. EYES & EYEBROWS (Natural Blinking & Emotional Gaze) */}
          {/* ----------------------------------------------------------- */}
          {/* Left Eyebrow */}
          <path
            d={`M ${128 - browFurrow} ${148 + browOffset} Q 146 ${140 + browOffset - 3} 165 ${
              147 + browOffset + (state === 'thinking' ? -3 : 0)
            }`}
            stroke={visualTraits.hairColor}
            strokeWidth="4.2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Right Eyebrow */}
          <path
            d={`M ${195} ${147 + browOffset + (state === 'thinking' ? 2 : 0)} Q 214 ${
              140 + browOffset - 3
            } ${232 + browFurrow} ${148 + browOffset}`}
            stroke={visualTraits.hairColor}
            strokeWidth="4.2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Left Eye Sclera & Iris */}
          <g transform={`translate(145, 168)`}>
            {/* White of eye */}
            <path
              d="M -18 0 C -12 -9, 12 -9, 18 0 C 12 8, -12 8, -18 0 Z"
              fill="#F8FAFC"
              stroke={visualTraits.skinShadow}
              strokeWidth="1"
            />
            {/* Clipped Iris & In-Socket Eyelid */}
            <g clipPath={`url(#left-eye-clip-${avatar.id})`}>
              {/* Iris & Pupil (moves with eyeGaze) */}
              <g transform={`translate(${eyeGaze.x}, ${eyeGaze.y})`}>
                <circle cx="0" cy="0" r="7.5" fill={visualTraits.eyeColor} />
                <circle cx="0" cy="0" r="3.6" fill="#0B0908" />
                {/* Catchlight glint */}
                <circle cx="-2.5" cy="-2.5" r="2.0" fill="#FFFFFF" />
                <circle cx="2.2" cy="2.2" r="1.0" fill="#FFFFFF" opacity="0.8" />
              </g>
              {/* Natural Eyelid Closure (covers down over sclera) */}
              <path
                d={`M -22 -14 L 22 -14 L 22 ${-10 + blinkProgress * 22} C 12 ${
                  -8 + blinkProgress * 19
                }, -12 ${-8 + blinkProgress * 19}, -22 ${-10 + blinkProgress * 22} Z`}
                fill={visualTraits.skinTone}
              />
            </g>
            {/* Eyelash Line */}
            <path
              d={`M -20 0 Q 0 ${-8 + blinkProgress * 16} 20 0`}
              stroke="#1E1E24"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Right Eye Sclera & Iris */}
          <g transform={`translate(215, 168)`}>
            {/* White of eye */}
            <path
              d="M -18 0 C -12 -9, 12 -9, 18 0 C 12 8, -12 8, -18 0 Z"
              fill="#F8FAFC"
              stroke={visualTraits.skinShadow}
              strokeWidth="1"
            />
            {/* Clipped Iris & In-Socket Eyelid */}
            <g clipPath={`url(#right-eye-clip-${avatar.id})`}>
              {/* Iris & Pupil */}
              <g transform={`translate(${eyeGaze.x}, ${eyeGaze.y})`}>
                <circle cx="0" cy="0" r="7.5" fill={visualTraits.eyeColor} />
                <circle cx="0" cy="0" r="3.6" fill="#0B0908" />
                {/* Catchlight glint */}
                <circle cx="-2.5" cy="-2.5" r="2.0" fill="#FFFFFF" />
                <circle cx="2.2" cy="2.2" r="1.0" fill="#FFFFFF" opacity="0.8" />
              </g>
              {/* Natural Eyelid Closure (covers down over sclera) */}
              <path
                d={`M -22 -14 L 22 -14 L 22 ${-10 + blinkProgress * 22} C 12 ${
                  -8 + blinkProgress * 19
                }, -12 ${-8 + blinkProgress * 19}, -22 ${-10 + blinkProgress * 22} Z`}
                fill={visualTraits.skinTone}
              />
            </g>
            {/* Eyelash Line */}
            <path
              d={`M -20 0 Q 0 ${-8 + blinkProgress * 16} 20 0`}
              stroke="#1E1E24"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Eyeglasses (if present) */}
          {visualTraits.glasses && (
            <g id="glasses" opacity="0.92">
              {/* Left Rim */}
              <rect
                x="124"
                y="152"
                width="42"
                height="30"
                rx="8"
                fill="none"
                stroke={visualTraits.glassesColor || '#1E293B'}
                strokeWidth="2.6"
              />
              {/* Right Rim */}
              <rect
                x="194"
                y="152"
                width="42"
                height="30"
                rx="8"
                fill="none"
                stroke={visualTraits.glassesColor || '#1E293B'}
                strokeWidth="2.6"
              />
              {/* Bridge */}
              <path
                d="M 166 164 Q 180 159 194 164"
                stroke={visualTraits.glassesColor || '#1E293B'}
                strokeWidth="2.6"
                fill="none"
              />
              {/* Subtle glass reflection */}
              <line x1="130" y1="158" x2="148" y2="176" stroke="#FFF" strokeWidth="1.2" opacity="0.4" />
              <line x1="200" y1="158" x2="218" y2="176" stroke="#FFF" strokeWidth="1.2" opacity="0.4" />
            </g>
          )}

          {/* ----------------------------------------------------------- */}
          {/* E. NOSE */}
          {/* ----------------------------------------------------------- */}
          <path
            d="M 180 162 L 178 196 C 172 198, 168 204, 174 207 C 178 208, 182 208, 186 207 C 192 204, 188 198, 182 196 Z"
            fill={visualTraits.skinShadow}
            opacity="0.5"
          />
          {/* Nose tip highlight */}
          <circle cx="180" cy="203" r="3.2" fill={visualTraits.skinHighlight} opacity="0.6" />

          {/* ----------------------------------------------------------- */}
          {/* F. REAL-TIME SYNCHRONIZED MOUTH & LIPS */}
          {/* ----------------------------------------------------------- */}
          <g id="mouth">
            {/* Philtrum indent */}
            <path
              d="M 177 212 L 178 219 M 183 212 L 182 219"
              stroke={visualTraits.skinShadow}
              strokeWidth="1.2"
              opacity="0.4"
            />

            {mouth.mouthOpen > 0.05 ? (
              // 1. OPEN MOUTH STATE (During Speech)
              <>
                {/* Oral Cavity Background */}
                <ellipse
                  cx="180"
                  cy={mouthCenterY}
                  rx={mouthHalfWidth}
                  ry={mouthHeight}
                  fill="#450A0A"
                />

                {/* Upper Teeth */}
                {mouth.upperTeeth > 0.1 && (
                  <path
                    d={`M ${180 - mouthHalfWidth * 0.75} ${mouthCenterY - mouthHeight * 0.4} Q 180 ${
                      mouthCenterY - mouthHeight * 0.6
                    } ${180 + mouthHalfWidth * 0.75} ${mouthCenterY - mouthHeight * 0.4} L ${
                      180 + mouthHalfWidth * 0.65
                    } ${mouthCenterY - mouthHeight * 0.4 + 4 * mouth.upperTeeth} Q 180 ${
                      mouthCenterY - mouthHeight * 0.5 + 5 * mouth.upperTeeth
                    } ${180 - mouthHalfWidth * 0.65} ${
                      mouthCenterY - mouthHeight * 0.4 + 4 * mouth.upperTeeth
                    } Z`}
                    fill="#F8FAFC"
                  />
                )}

                {/* Tongue (if visible) */}
                {mouth.tongueVisible > 0.15 && (
                  <ellipse
                    cx="180"
                    cy={mouthCenterY + mouthHeight * 0.35}
                    rx={mouthHalfWidth * 0.55}
                    ry={mouthHeight * 0.4}
                    fill="#F43F5E"
                    opacity="0.85"
                  />
                )}

                {/* Lower Teeth */}
                {mouth.lowerTeeth > 0.2 && (
                  <path
                    d={`M ${180 - mouthHalfWidth * 0.6} ${mouthCenterY + mouthHeight * 0.6} Q 180 ${
                      mouthCenterY + mouthHeight * 0.8
                    } ${180 + mouthHalfWidth * 0.6} ${mouthCenterY + mouthHeight * 0.6} L ${
                      180 + mouthHalfWidth * 0.5
                    } ${mouthCenterY + mouthHeight * 0.6 - 3 * mouth.lowerTeeth} Q 180 ${
                      mouthCenterY + mouthHeight * 0.7 - 4 * mouth.lowerTeeth
                    } ${180 - mouthHalfWidth * 0.5} ${
                      mouthCenterY + mouthHeight * 0.6 - 3 * mouth.lowerTeeth
                    } Z`}
                    fill="#F1F5F9"
                  />
                )}

                {/* Upper Lip Contour */}
                <path
                  d={`M ${180 - mouthHalfWidth} ${mouthCenterY - smileElevation * 0.3} Q ${
                    180 - mouthHalfWidth * 0.4
                  } ${mouthCenterY - mouthHeight - 4} 180 ${mouthCenterY - mouthHeight - 2} Q ${
                    180 + mouthHalfWidth * 0.4
                  } ${mouthCenterY - mouthHeight - 4} ${180 + mouthHalfWidth} ${
                    mouthCenterY - smileElevation * 0.3
                  } Q 180 ${mouthCenterY - mouthHeight * 0.5} ${180 - mouthHalfWidth} ${
                    mouthCenterY - smileElevation * 0.3
                  } Z`}
                  fill={visualTraits.lipColor}
                />

                {/* Lower Lip Contour */}
                <path
                  d={`M ${180 - mouthHalfWidth} ${mouthCenterY - smileElevation * 0.3} Q 180 ${
                    mouthCenterY + mouthHeight * 0.8
                  } ${180 + mouthHalfWidth} ${mouthCenterY - smileElevation * 0.3} Q 180 ${
                    mouthCenterY + mouthHeight + 4
                  } ${180 - mouthHalfWidth} ${mouthCenterY - smileElevation * 0.3} Z`}
                  fill={visualTraits.lipColor}
                  opacity="0.95"
                />
              </>
            ) : (
              // 2. CLOSED RESTING MOUTH STATE (Gentle Warm Smile)
              <>
                {/* Closed Lip Line with warm smile curvature */}
                <path
                  d={`M ${180 - mouthHalfWidth} ${mouthCenterY - smileElevation} Q 180 ${
                    mouthCenterY + 2
                  } ${180 + mouthHalfWidth} ${mouthCenterY - smileElevation}`}
                  stroke="#7A2D2A"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Upper Lip Definition */}
                <path
                  d={`M ${180 - mouthHalfWidth} ${mouthCenterY - smileElevation} Q 174 ${
                    mouthCenterY - 6
                  } 180 ${mouthCenterY - 4} Q 186 ${mouthCenterY - 6} ${
                    180 + mouthHalfWidth
                  } ${mouthCenterY - smileElevation} Q 180 ${mouthCenterY} ${
                    180 - mouthHalfWidth
                  } ${mouthCenterY - smileElevation} Z`}
                  fill={visualTraits.lipColor}
                  opacity="0.85"
                />
                {/* Lower Lip Plump Highlight */}
                <path
                  d={`M ${180 - mouthHalfWidth * 0.75} ${mouthCenterY + 1} Q 180 ${
                    mouthCenterY + 6
                  } ${180 + mouthHalfWidth * 0.75} ${mouthCenterY + 1} Q 180 ${
                    mouthCenterY + 2
                  } ${180 - mouthHalfWidth * 0.75} ${mouthCenterY + 1} Z`}
                  fill={visualTraits.lipColor}
                  opacity="0.9"
                />
              </>
            )}
          </g>

          {/* Chin Shadow / Indent */}
          <ellipse
            cx="180"
            cy={246 + mouth.jawDrop * 6}
            rx="12"
            ry="4"
            fill={visualTraits.skinShadow}
            opacity="0.35"
          />

          {/* ----------------------------------------------------------- */}
          {/* G. HAIR STYLING (Front Layer & Highlights) */}
          {/* ----------------------------------------------------------- */}
          <g id="hair-front">
            {visualTraits.hairStyle === 'short_fade' && (
              <path
                d="M 112 140 C 110 80, 250 80, 248 140 C 248 115, 230 100, 180 98 C 130 100, 112 115, 112 140 Z"
                fill={`url(#hair-grad-${avatar.id})`}
              />
            )}

            {visualTraits.hairStyle === 'side_part' && (
              <path
                d="M 110 145 C 108 75, 252 75, 250 145 C 248 120, 235 102, 195 100 C 145 98, 120 115, 110 145 Z"
                fill={`url(#hair-grad-${avatar.id})`}
              />
            )}

            {visualTraits.hairStyle === 'wavy_shoulder' && (
              <path
                d="M 108 150 C 105 70, 255 70, 252 150 C 248 115, 230 95, 180 95 C 130 95, 112 115, 108 150 Z"
                fill={`url(#hair-grad-${avatar.id})`}
              />
            )}

            {visualTraits.hairStyle === 'sleek_bob' && (
              <path
                d="M 106 175 C 104 70, 256 70, 254 175 C 250 120, 232 98, 180 98 C 128 98, 110 120, 106 175 Z"
                fill={`url(#hair-grad-${avatar.id})`}
              />
            )}

            {visualTraits.hairStyle === 'professional_bun' && (
              <>
                {/* Top Bun */}
                <circle cx="180" cy="72" r="30" fill={`url(#hair-grad-${avatar.id})`} />
                {/* Hairline */}
                <path
                  d="M 112 140 C 110 85, 250 85, 248 140 C 248 112, 230 98, 180 98 C 130 98, 112 112, 112 140 Z"
                  fill={`url(#hair-grad-${avatar.id})`}
                />
              </>
            )}

            {visualTraits.hairStyle === 'classic_taper' && (
              <path
                d="M 112 145 C 110 75, 250 75, 248 145 C 246 118, 230 102, 180 100 C 130 102, 114 118, 112 145 Z"
                fill={`url(#hair-grad-${avatar.id})`}
              />
            )}
          </g>
        </g>
      </svg>
    </div>
  );
};
