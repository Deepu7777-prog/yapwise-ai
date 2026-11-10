import { useState, useEffect, useCallback, useRef } from 'react';

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  voiceName?: string;
  characterId?: 'kid' | 'english_coach' | 'interview_coach';
  onEnd?: () => void;
}

export interface CharacterVoiceConfig {
  characterId: 'kid' | 'english_coach' | 'interview_coach';
  name: string;
  pitch: number;
  rate: number;
  targetVoiceKeywords: string[];
  sampleText: string;
}

export const CHARACTER_VOICE_CONFIGS: Record<'kid' | 'english_coach' | 'interview_coach', CharacterVoiceConfig> = {
  kid: {
    characterId: 'kid',
    name: 'Little Friend (Youthful & Cheerful)',
    pitch: 1.35, // Distinctly higher pitch for youthful friendly character
    rate: 1.05,
    targetVoiceKeywords: ['ana', 'junior', 'child', 'youth', 'zira', 'jenny', 'heera', 'female', 'natural'],
    sampleText: "Hi there! I'm Little Friend. I love chatting about fun everyday things. Let's practice English together!",
  },
  english_coach: {
    characterId: 'english_coach',
    name: 'English Coach (Warm & Articulate Female)',
    pitch: 1.02,
    rate: 0.98,
    targetVoiceKeywords: ['zira', 'jenny', 'samantha', 'heera', 'female', 'victoria', 'karen', 'natural', 'google us english'],
    sampleText: "Hello! I am your English Fluency Coach. I'll help you speak smoothly and polish your grammar naturally.",
  },
  interview_coach: {
    characterId: 'interview_coach',
    name: 'Interview Coach (Executive & Confident Male)',
    pitch: 0.88, // Distinctly deeper, resonant pitch for professional male coach
    rate: 0.95,
    targetVoiceKeywords: ['david', 'guy', 'ravi', 'alex', 'male', 'mark', 'daniel', 'george', 'google uk english male'],
    sampleText: "Good day! I am your Placement and Technical Interview Coach. Let's practice structured, high-impact responses.",
  },
};

export function useSpeechSynthesis() {
  const [supported, setSupported] = useState<boolean>(false);
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState<number>(1.0);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Runtime voice discovery
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
      return;
    }

    setSupported(true);

    const updateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const englishVoices = allVoices.filter((v) => v.lang.toLowerCase().startsWith('en'));
      setVoices(englishVoices.length > 0 ? englishVoices : allVoices);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore on unmount
      }
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
      setSpeaking(false);
    }
  }, []);

  // Resolves the best matching voice for a specific character persona
  const resolveVoiceForCharacter = useCallback(
    (characterId: 'kid' | 'english_coach' | 'interview_coach'): SpeechSynthesisVoice | null => {
      if (voices.length === 0) return null;

      const config = CHARACTER_VOICE_CONFIGS[characterId];
      if (!config) return voices[0];

      // 1. Look for saved user voice preference from localStorage
      const savedVoiceName = localStorage.getItem(`yapwise_voice_${characterId}`);
      if (savedVoiceName) {
        const matched = voices.find((v) => v.name === savedVoiceName);
        if (matched) return matched;
      }

      // 2. Search for character-specific target voice keywords
      for (const kw of config.targetVoiceKeywords) {
        const found = voices.find((v) => v.name.toLowerCase().includes(kw));
        if (found) return found;
      }

      // 3. Fallbacks: male for interview coach, female for english coach/kid
      if (characterId === 'interview_coach') {
        const male = voices.find(
          (v) =>
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('david') ||
            v.name.toLowerCase().includes('guy')
        );
        if (male) return male;
      } else {
        const female = voices.find(
          (v) =>
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('jenny')
        );
        if (female) return female;
      }

      return voices[0] || null;
    },
    [voices]
  );

  const speak = useCallback(
    (text: string, options?: SpeakOptions) => {
      if (!supported || !text.trim()) return;

      cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      currentUtteranceRef.current = utterance;

      let targetPitch = options?.pitch ?? 1.0;
      let targetRate = options?.rate ?? 1.0;
      let targetVoice: SpeechSynthesisVoice | null = null;

      // Apply character-specific acoustic profile if characterId is provided
      if (options?.characterId && CHARACTER_VOICE_CONFIGS[options.characterId]) {
        const cfg = CHARACTER_VOICE_CONFIGS[options.characterId];
        targetPitch = options.pitch ?? cfg.pitch;
        targetRate = options.rate ?? cfg.rate;
        targetVoice = resolveVoiceForCharacter(options.characterId);
      }

      if (options?.voiceName) {
        const found = voices.find((v) => v.name === options.voiceName);
        if (found) targetVoice = found;
      }

      utterance.pitch = targetPitch;
      utterance.rate = targetRate;
      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => {
        setSpeaking(false);
        if (options?.onEnd) {
          options.onEnd();
        }
      };
      utterance.onerror = (e) => {
        if (e.error !== 'canceled') {
          console.warn('SpeechSynthesis playback warning:', e.error);
        }
        setSpeaking(false);
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Failed to speak with SpeechSynthesis:', err);
        setSpeaking(false);
      }
    },
    [supported, voices, cancel, resolveVoiceForCharacter]
  );

  // Play preview for a character's voice
  const previewVoice = useCallback(
    (characterId: 'kid' | 'english_coach' | 'interview_coach') => {
      const cfg = CHARACTER_VOICE_CONFIGS[characterId];
      if (!cfg) return;
      speak(cfg.sampleText, { characterId });
    },
    [speak]
  );

  return {
    supported,
    speaking,
    isSpeaking: speaking,
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    cancel,
    stop: cancel,
    speak,
    previewVoice,
    resolveVoiceForCharacter,
  };
}
