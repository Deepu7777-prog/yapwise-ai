import { useEffect, useRef, useState, useCallback } from 'react';

export type MouthState = 'closed' | 'slightly_open' | 'fully_open';

export interface AudioReactiveMouthMetrics {
  mouthState: MouthState;
  mouthOpen: number; // 0.0 to 1.0 (smoothly interpolated)
  mouthWide: number; // 0.35 to 0.85
  volume: number;    // 0.0 to 1.0 (real-time RMS/intensity)
  isAudioPlaying: boolean;
}

// Singleton AudioContext across the application to prevent browser limits
let sharedAudioContext: AudioContext | null = null;

// Cache MediaElementAudioSourceNode per HTMLMediaElement to avoid "already connected" exceptions
const sourceNodeCache = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioContext) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioContext = new AudioCtx();
    }
  }
  return sharedAudioContext;
}

interface UseAudioReactiveLipSyncOptions {
  audioElementRef: React.RefObject<HTMLAudioElement | null>;
  onStateChange?: (state: MouthState) => void;
}

export function useAudioReactiveLipSync({
  audioElementRef,
  onStateChange,
}: UseAudioReactiveLipSyncOptions) {
  const [metrics, setMetrics] = useState<AudioReactiveMouthMetrics>({
    mouthState: 'closed',
    mouthOpen: 0.0,
    mouthWide: 0.35,
    volume: 0.0,
    isAudioPlaying: false,
  });

  const animFrameRef = useRef<number | null>(null);
  const currentOpenRef = useRef<number>(0.0);
  const currentWideRef = useRef<number>(0.35);
  const isPlayingRef = useRef<boolean>(false);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Resume suspended AudioContext on user interaction
  const unlockAudioContext = useCallback(async () => {
    const ctx = getSharedAudioContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (err) {
        console.warn('Failed to resume AudioContext:', err);
      }
    }
  }, []);

  useEffect(() => {
    const audioEl = audioElementRef.current;
    if (!audioEl) return;

    const ctx = getSharedAudioContext();
    if (!ctx) return;

    // 1. Get or create MediaElementAudioSourceNode (reusing existing node)
    let sourceNode = sourceNodeCache.get(audioEl);
    if (!sourceNode) {
      try {
        sourceNode = ctx.createMediaElementSource(audioEl);
        sourceNodeCache.set(audioEl, sourceNode);
      } catch (e) {
        console.warn('MediaElementSource error (likely already created):', e);
      }
    }

    // 2. Create AnalyserNode to monitor audio volume in real-time
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.4;
    analyserRef.current = analyser;

    if (sourceNode) {
      try {
        sourceNode.disconnect();
      } catch {
        // quiet ignore
      }
      sourceNode.connect(analyser);
      // Connect to destination so audio plays through speakers without being muted
      analyser.connect(ctx.destination);
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    // 3. 60 FPS Real-Time Volume Analysis Loop
    const analyzeAudioLoop = () => {
      if (!isPlayingRef.current) {
        // Smooth decay to closed mouth state when audio stops
        currentOpenRef.current = Math.max(0, currentOpenRef.current * 0.75);
        currentWideRef.current = currentWideRef.current * 0.8 + 0.35 * 0.2;

        if (currentOpenRef.current < 0.01) {
          currentOpenRef.current = 0;
          setMetrics({
            mouthState: 'closed',
            mouthOpen: 0.0,
            mouthWide: 0.35,
            volume: 0.0,
            isAudioPlaying: false,
          });
          onStateChange?.('closed');
          return;
        }

        setMetrics((prev) => ({
          ...prev,
          mouthState: 'closed',
          mouthOpen: currentOpenRef.current,
          isAudioPlaying: false,
        }));
        animFrameRef.current = requestAnimationFrame(analyzeAudioLoop);
        return;
      }

      analyser.getByteFrequencyData(dataArray);

      // Focus on human vocal frequencies (roughly 200 Hz to 3500 Hz, bins 2 to 40)
      let sum = 0;
      const startBin = 2;
      const endBin = Math.min(42, dataArray.length);
      const binCount = endBin - startBin;

      for (let i = startBin; i < endBin; i++) {
        sum += dataArray[i];
      }

      const rawVolume = binCount > 0 ? sum / binCount / 128.0 : 0;
      const clampedVolume = Math.min(1.0, Math.max(0, rawVolume));

      // 4. Map volume intensity to three distinct mouth states
      let targetState: MouthState = 'closed';
      let targetOpen = 0.0;
      let targetWide = 0.35;

      if (clampedVolume < 0.08) {
        targetState = 'closed';
        targetOpen = 0.0;
        targetWide = 0.35;
      } else if (clampedVolume < 0.35) {
        targetState = 'slightly_open';
        targetOpen = 0.45;
        targetWide = 0.58;
      } else {
        targetState = 'fully_open';
        targetOpen = Math.min(1.0, 0.75 + clampedVolume * 0.25);
        targetWide = Math.min(0.85, 0.7 + clampedVolume * 0.15);
      }

      // Smooth exponential lerp
      currentOpenRef.current = currentOpenRef.current * 0.35 + targetOpen * 0.65;
      currentWideRef.current = currentWideRef.current * 0.4 + targetWide * 0.6;

      setMetrics({
        mouthState: targetState,
        mouthOpen: currentOpenRef.current,
        mouthWide: currentWideRef.current,
        volume: clampedVolume,
        isAudioPlaying: true,
      });

      onStateChange?.(targetState);
      animFrameRef.current = requestAnimationFrame(analyzeAudioLoop);
    };

    // 5. Audio Event Listeners
    const handlePlay = async () => {
      await unlockAudioContext();
      isPlayingRef.current = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(analyzeAudioLoop);
    };

    const handleEndedOrPaused = () => {
      isPlayingRef.current = false;
    };

    audioEl.addEventListener('play', handlePlay);
    audioEl.addEventListener('playing', handlePlay);
    audioEl.addEventListener('pause', handleEndedOrPaused);
    audioEl.addEventListener('ended', handleEndedOrPaused);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioEl.removeEventListener('play', handlePlay);
      audioEl.removeEventListener('playing', handlePlay);
      audioEl.removeEventListener('pause', handleEndedOrPaused);
      audioEl.removeEventListener('ended', handleEndedOrPaused);
    };
  }, [audioElementRef, unlockAudioContext, onStateChange]);

  return {
    ...metrics,
    unlockAudioContext,
  };
}
