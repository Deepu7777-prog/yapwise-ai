import { describe, it, expect } from 'vitest';
import { isSpeechRecognitionSupported, isSpeechSynthesisSupported } from '../services/speech';

describe('Web Speech API detection', () => {
  it('returns boolean for SpeechRecognition detection without crashing', () => {
    const supported = isSpeechRecognitionSupported();
    expect(typeof supported).toBe('boolean');
  });

  it('returns boolean for SpeechSynthesis detection without crashing', () => {
    const supported = isSpeechSynthesisSupported();
    expect(typeof supported).toBe('boolean');
  });
});
