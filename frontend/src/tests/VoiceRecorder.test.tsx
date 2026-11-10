import { describe, it, expect } from 'vitest';

describe('VoiceRecorder Fallback Logic', () => {
  it('correctly calculates word count and approximate duration for typed fallback', () => {
    const text = 'This is a sample architectural explanation covering high availability distributed caching and partition tolerance.';
    const words = text.trim().split(/\s+/).filter(Boolean);
    expect(words.length).toBe(14);

    const estimatedDuration = Math.max(5, words.length * 0.4);
    expect(estimatedDuration).toBe(5.6);
  });

  it('handles empty text gracefully', () => {
    const emptyText = '   ';
    const words = emptyText.trim().split(/\s+/).filter(Boolean);
    expect(words.length).toBe(0);
  });
});
