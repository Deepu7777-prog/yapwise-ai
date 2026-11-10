import { useState, useEffect, useRef, useCallback } from 'react';

export type SpeechLang = 'en-IN' | 'en-US' | 'en-GB';

export interface UseSpeechRecognitionReturn {
  supported: boolean;
  isSupported: boolean;
  listening: boolean;
  isListening: boolean;
  transcript: string;
  interim: string;
  interimTranscript: string;
  error: string | null;
  lang: SpeechLang;
  setLang: (lang: SpeechLang) => void;
  start: () => void;
  startListening: () => void;
  stop: () => void;
  stopListening: () => void;
  reset: () => void;
  resetTranscript: () => void;
  setTranscript: (text: string | ((prev: string) => string)) => void;
}

export function useSpeechRecognition(initialLang: SpeechLang = 'en-IN'): UseSpeechRecognitionReturn {
  const [supported, setSupported] = useState<boolean>(false);
  const [listening, setListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interim, setInterim] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<SpeechLang>(initialLang);

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef<boolean>(false);

  useEffect(() => {
    const isSupported =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    setSupported(isSupported);
    if (!isSupported) {
      setError('Voice input works in Chrome or Edge. You can type your answer instead.');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let finalAccumulator = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          finalAccumulator += item[0].transcript + ' ';
        } else {
          currentInterim += item[0].transcript;
        }
      }

      if (finalAccumulator) {
        setTranscript((prev) => (prev ? `${prev.trim()} ${finalAccumulator.trim()}` : finalAccumulator.trim()));
      }
      setInterim(currentInterim);
    };

    recognition.onerror = (event: any) => {
      console.warn('SpeechRecognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied – allow it in your browser, or type instead.');
        shouldListenRef.current = false;
        setListening(false);
      } else if (event.error === 'no-speech') {
        // Quiet timeout; if user still wants to listen, let onend restart it
      } else if (event.error === 'network') {
        setError('Network error with speech recognition. You can type your answer instead.');
        shouldListenRef.current = false;
        setListening(false);
      } else if (event.error === 'audio-capture') {
        setError('No microphone was detected on your device. You can type instead.');
        shouldListenRef.current = false;
        setListening(false);
      } else {
        setError(`Speech note: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Auto-restart if student intended to keep listening
      if (shouldListenRef.current) {
        setTimeout(() => {
          if (shouldListenRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch {
              // already active or restarting
            }
          }
        }, 150);
      } else {
        setListening(false);
        setInterim('');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang]);

  const start = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    setError(null);
    shouldListenRef.current = true;
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (err: any) {
      // Already running or starting
      setListening(true);
    }
  }, [supported]);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignored
      }
    }
    setListening(false);
    setInterim('');
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterim('');
    setError(null);
  }, []);

  return {
    supported,
    isSupported: supported,
    listening,
    isListening: listening,
    transcript,
    interim,
    interimTranscript: interim,
    error,
    lang,
    setLang,
    start,
    startListening: start,
    stop,
    stopListening: stop,
    reset,
    resetTranscript: reset,
    setTranscript,
  };
}
