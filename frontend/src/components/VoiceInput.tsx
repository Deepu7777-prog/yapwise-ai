import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';
import { useSpeechRecognition, SpeechLang } from '../hooks/useSpeechRecognition';
import { Button } from './ui/Button';
import { Switch } from './ui/Switch';
import { cn } from '../lib/utils';

export interface VoiceInputProps {
  onSend?: (text: string) => void;
  onSubmit?: (text: string) => void;
  initialValue?: string;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  buttonText?: string;
  maxLength?: number;
  autoSendOption?: boolean;
  className?: string;
}

export function VoiceInput({
  onSend,
  onSubmit,
  initialValue = '',
  disabled = false,
  isLoading = false,
  placeholder = 'Speak naturally into your mic or type here...',
  buttonText = 'Send Response',
  maxLength = 1500,
  autoSendOption = true,
  className,
}: VoiceInputProps) {
  const {
    supported,
    listening,
    transcript,
    interim,
    error,
    lang,
    setLang,
    start,
    stop,
    reset,
  } = useSpeechRecognition('en-IN');

  const [editableText, setEditableText] = useState<string>(initialValue);
  const [autoSendEnabled, setAutoSendEnabled] = useState<boolean>(false);
  const silenceTimerRef = useRef<any>(null);

  // Synchronize initialValue when provided (e.g., when preserving text after an error)
  useEffect(() => {
    if (initialValue && !editableText) {
      setEditableText(initialValue);
    }
  }, [initialValue]);

  // Sync speech transcript into editable text
  useEffect(() => {
    if (transcript) {
      setEditableText(transcript);
    }
  }, [transcript]);

  // Optional auto-send after 2 seconds of silence
  useEffect(() => {
    if (!autoSendEnabled || !listening) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      return;
    }

    if (editableText.trim().length > 10 && !interim) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        handleSend();
      }, 2000);
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [editableText, interim, autoSendEnabled, listening]);

  const handleToggleMic = () => {
    if (listening) {
      stop();
    } else {
      start();
    }
  };

  const handleSend = () => {
    const finalClean = (editableText + (interim ? ' ' + interim : '')).trim();
    if (!finalClean || disabled || isLoading) return;

    if (listening) {
      stop();
    }

    if (onSubmit) {
      onSubmit(finalClean);
    } else if (onSend) {
      onSend(finalClean);
    }

    setEditableText('');
    reset();
  };

  const handleClear = () => {
    setEditableText('');
    reset();
  };

  const charCount = editableText.length;
  const isInputDisabled = disabled || isLoading;

  return (
    <div className={cn('bg-white border border-[#EDE7FF] rounded-3xl p-4 sm:p-5 shadow-card space-y-4 text-[#29243A]', className)}>
      {/* Speech Support or Permission Warning */}
      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Mic Center & Controls Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-3 border-b border-[#EDE7FF]">
        <div className="flex items-center gap-3.5">
          {supported && (
            <div className="relative">
              <button
                type="button"
                onClick={handleToggleMic}
                disabled={isInputDisabled}
                aria-label={listening ? 'Stop recording voice' : 'Start speaking'}
                className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 select-none shadow-md',
                  listening
                    ? 'bg-rose-500 text-white animate-mic-pulse ring-4 ring-rose-200'
                    : 'bg-[#8B70D6] hover:bg-[#7A5EC8] text-white shadow-[#8B70D6]/30',
                  isInputDisabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {listening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
            </div>
          )}

          <div>
            <div className="text-xs font-bold text-[#29243A] flex items-center gap-2">
              <span>{listening ? 'Listening to your voice...' : 'Voice & Text Input'}</span>
              {listening && (
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 bg-[#8B70D6] rounded-full animate-wave-1" />
                  <span className="w-1 h-4 bg-[#8B70D6] rounded-full animate-wave-2" />
                  <span className="w-1 h-5 bg-[#8B70D6] rounded-full animate-wave-3" />
                  <span className="w-1 h-3 bg-[#8B70D6] rounded-full animate-wave-4" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-[#77718B]">
              {supported
                ? listening
                  ? 'Speak clearly into your microphone'
                  : 'Click the mic to speak, or type your answer below'
                : 'Microphone unsupported in this browser; please type below'}
            </p>
          </div>
        </div>

        {/* Settings: Language selector & Auto-send toggle */}
        <div className="flex items-center gap-3 text-xs text-[#77718B]">
          {supported && (
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as SpeechLang)}
              aria-label="Speech recognition accent"
              className="bg-[#FAF8FF] border border-[#DDD3FF] rounded-xl px-2.5 py-1 text-xs text-[#29243A] focus:outline-none focus:ring-1 focus:ring-[#8B70D6] cursor-pointer"
            >
              <option value="en-IN">English (India)</option>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
            </select>
          )}

          {autoSendOption && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Switch
                checked={autoSendEnabled}
                onCheckedChange={setAutoSendEnabled}
                aria-label="Auto-send after 2 seconds silence"
              />
              <span className="text-[11px] hidden sm:inline">Auto-send</span>
            </label>
          )}
        </div>
      </div>

      {/* Editable Transcript Textarea */}
      <div className="relative">
        <textarea
          value={editableText}
          onChange={(e) => setEditableText(e.target.value)}
          disabled={isInputDisabled}
          maxLength={maxLength}
          rows={3}
          placeholder={placeholder}
          aria-label="Your spoken or typed response"
          className={cn(
            'w-full px-4 py-3 bg-[#FAF8FF] border border-[#EDE7FF] rounded-2xl text-xs sm:text-sm text-[#29243A] placeholder:text-[#A59EBA]',
            'transition-colors duration-150 resize-y min-h-[90px]',
            'focus:outline-none focus:border-[#8B70D6] focus:ring-2 focus:ring-[#8B70D6]/20',
            isInputDisabled && 'opacity-60 cursor-not-allowed bg-slate-50'
          )}
        />
        {interim && (
          <div className="p-2.5 text-xs text-[#674BB4] italic bg-[#EDE7FF]/60 rounded-xl border border-[#DDD3FF] mt-1.5 flex items-center gap-2">
            <span className="font-bold text-[#8B70D6] not-italic">Hearing:</span>
            <span>"{interim}"</span>
          </div>
        )}
      </div>

      {/* Footer: Character counter, Clear & Send button */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-4 text-xs text-[#77718B]">
          <span className="font-mono text-[11px]">
            {charCount}/{maxLength}
          </span>
          {editableText && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 text-[11px] text-[#77718B] hover:text-[#29243A] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <Button
          type="button"
          onClick={handleSend}
          disabled={isInputDisabled || (!editableText.trim() && !interim.trim())}
          loading={isLoading}
          size="sm"
          className="gap-2 font-semibold"
        >
          <span>{buttonText}</span>
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Privacy note */}
      <p className="text-[10px] text-[#A59EBA] text-center select-none pt-1">
        🔒 Speech is transcribed locally in your browser. Audio recordings are never uploaded.
      </p>
    </div>
  );
}
