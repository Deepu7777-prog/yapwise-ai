import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Type, RotateCcw, Send, AlertCircle, Volume2 } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { AudioVisualizer } from './AudioVisualizer';

interface VoiceRecorderProps {
  onTranscriptComplete: (transcript: string, durationSeconds: number) => void;
  isSubmitting?: boolean;
  placeholder?: string;
  autoClearOnSubmit?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptComplete,
  isSubmitting = false,
  placeholder = 'Speak naturally into your microphone or switch to typed text...',
  autoClearOnSubmit = true,
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'type'>('voice');
  const [typedText, setTypedText] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  } = useSpeechRecognition();

  // Timer while recording
  useEffect(() => {
    let interval: any = null;
    if (isListening) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isListening && timerSeconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isListening, timerSeconds]);

  const toggleRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      setTimerSeconds(0);
      startListening();
    }
  };

  const currentSpeechText = (transcript + ' ' + interimTranscript).trim();
  const currentSubmissionText = activeTab === 'voice' ? currentSpeechText : typedText;

  const handleReset = () => {
    if (activeTab === 'voice') {
      resetTranscript();
      setTimerSeconds(0);
    } else {
      setTypedText('');
    }
  };

  const handleSubmit = () => {
    if (!currentSubmissionText.trim() || isSubmitting) return;
    const duration = activeTab === 'voice' ? Math.max(timerSeconds, 3) : Math.max(5, currentSubmissionText.split(/\s+/).length * 0.4);
    onTranscriptComplete(currentSubmissionText.trim(), duration);
    if (autoClearOnSubmit) {
      handleReset();
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'voice'
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" />
            Speech to Text
          </button>
          <button
            type="button"
            onClick={() => {
              if (isListening) stopListening();
              setActiveTab('type');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'type'
                ? 'bg-accent-500/20 text-indigo-400 border border-accent-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-4 h-4" />
            Typed Fallback
          </button>
        </div>

        {activeTab === 'voice' && (
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md border ${
                isListening
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-rose-500' : 'bg-slate-500'}`} />
              {isListening ? `RECORDING ${formatTimer(timerSeconds)}` : 'READY'}
            </span>
          </div>
        )}
      </div>

      {/* Voice Mode View */}
      {activeTab === 'voice' && (
        <div className="space-y-4">
          {!isSupported && (
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>
                Web Speech API is not supported in this browser. Please use the <strong>Typed Fallback</strong> tab to submit your speech.
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Visualizer & Mic Button */}
          <div className="flex flex-col items-center justify-center py-6 bg-slate-900/50 rounded-xl border border-slate-800/80 relative overflow-hidden">
            <AudioVisualizer isActive={isListening} barCount={24} />

            <button
              type="button"
              onClick={toggleRecording}
              disabled={!isSupported}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-2xl ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-500 text-white ring-8 ring-rose-500/20 animate-pulse'
                  : 'bg-brand-600 hover:bg-brand-500 text-white ring-8 ring-brand-500/20'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title={isListening ? 'Stop Recording' : 'Start Recording'}
            >
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>

            <p className="mt-4 text-xs text-slate-400 font-medium">
              {isListening ? 'Listening to your voice... Speak clearly' : 'Tap microphone to speak'}
            </p>
          </div>

          {/* Transcript Box */}
          <div className="relative">
            <div className="min-h-[110px] max-h-[220px] overflow-y-auto p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
              {currentSpeechText ? (
                <>
                  <span>{transcript}</span>
                  {interimTranscript && <span className="text-slate-400 italic"> {interimTranscript}</span>}
                </>
              ) : (
                <span className="text-slate-500 italic">{placeholder}</span>
              )}
            </div>
            {currentSpeechText && (
              <span className="absolute bottom-2 right-3 text-xs text-slate-500">
                {currentSpeechText.split(/\s+/).filter(Boolean).length} words
              </span>
            )}
          </div>
        </div>
      )}

      {/* Typed Fallback View */}
      {activeTab === 'type' && (
        <div className="space-y-3">
          <textarea
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            rows={5}
            placeholder="Type or paste your spoken answer here for AI communication evaluation..."
            className="w-full p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-200 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-y"
          />
          <div className="flex justify-between items-center text-xs text-slate-500 px-1">
            <span>Fallback typing allows full speech and interview evaluation without audio hardware.</span>
            <span>{typedText.split(/\s+/).filter(Boolean).length} words</span>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={handleReset}
          disabled={!currentSubmissionText || isSubmitting}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!currentSubmissionText.trim() || isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-medium text-sm shadow-lg shadow-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-98"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Speech...</span>
            </>
          ) : (
            <>
              <span>Submit for AI Evaluation</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
