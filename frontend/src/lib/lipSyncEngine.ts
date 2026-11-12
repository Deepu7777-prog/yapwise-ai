/**
 * Real-Time Viseme & Lip Synchronization Engine for YapWise AI
 * Translates speech events, phonemes, and audio cadence into realistic anatomical mouth geometry.
 */

export type VisemeName =
  | 'viseme_sil' // Silence / Resting gentle smile
  | 'viseme_aa'  // Open jaw: "a", "ah", "father"
  | 'viseme_E'   // Wide smile stretch: "ee", "see", "meet"
  | 'viseme_I'   // Mid smile: "ih", "bit", "is"
  | 'viseme_O'   // Rounded open: "oh", "go", "boat"
  | 'viseme_U'   // Pucker forward: "oo", "you", "boot"
  | 'viseme_PP'  // Bilabial closure: "p", "b", "m"
  | 'viseme_FF'  // Labiodental: "f", "v"
  | 'viseme_TH'  // Lingual: "th", "d", "t"
  | 'viseme_SS'  // Sibilant: "s", "z", "ch"
  | 'viseme_kk'  // Velar: "k", "g"
  | 'viseme_nn'  // Nasal: "n", "ng"
  | 'viseme_RR'; // Rhotic: "r", "er"

export interface MouthMorphTarget {
  mouthOpen: number;     // 0.0 (closed) to 1.0 (wide open)
  mouthWide: number;     // 0.0 (narrow) to 1.0 (stretched smile)
  mouthRound: number;    // 0.0 (flat) to 1.0 (puckered circle)
  upperTeeth: number;    // 0.0 (hidden) to 1.0 (visible)
  lowerTeeth: number;    // 0.0 (hidden) to 1.0 (visible)
  tongueVisible: number; // 0.0 to 1.0
  jawDrop: number;       // Chin descent
  smileCurve: number;    // Corner elevation (warmth)
}

export const VISEME_TARGETS: Record<VisemeName, MouthMorphTarget> = {
  viseme_sil: {
    mouthOpen: 0.0,
    mouthWide: 0.35,
    mouthRound: 0.0,
    upperTeeth: 0.0,
    lowerTeeth: 0.0,
    tongueVisible: 0.0,
    jawDrop: 0.0,
    smileCurve: 0.35, // Natural welcoming resting smile
  },
  viseme_aa: {
    mouthOpen: 0.85,
    mouthWide: 0.5,
    mouthRound: 0.15,
    upperTeeth: 0.7,
    lowerTeeth: 0.6,
    tongueVisible: 0.4,
    jawDrop: 0.8,
    smileCurve: 0.2,
  },
  viseme_E: {
    mouthOpen: 0.35,
    mouthWide: 0.9,
    mouthRound: 0.0,
    upperTeeth: 0.9,
    lowerTeeth: 0.7,
    tongueVisible: 0.2,
    jawDrop: 0.3,
    smileCurve: 0.7,
  },
  viseme_I: {
    mouthOpen: 0.4,
    mouthWide: 0.75,
    mouthRound: 0.05,
    upperTeeth: 0.8,
    lowerTeeth: 0.6,
    tongueVisible: 0.3,
    jawDrop: 0.4,
    smileCurve: 0.5,
  },
  viseme_O: {
    mouthOpen: 0.7,
    mouthWide: 0.2,
    mouthRound: 0.9,
    upperTeeth: 0.2,
    lowerTeeth: 0.2,
    tongueVisible: 0.1,
    jawDrop: 0.65,
    smileCurve: 0.1,
  },
  viseme_U: {
    mouthOpen: 0.35,
    mouthWide: 0.1,
    mouthRound: 0.95,
    upperTeeth: 0.1,
    lowerTeeth: 0.1,
    tongueVisible: 0.0,
    jawDrop: 0.4,
    smileCurve: 0.0,
  },
  viseme_PP: {
    mouthOpen: 0.0,
    mouthWide: 0.3,
    mouthRound: 0.0,
    upperTeeth: 0.0,
    lowerTeeth: 0.0,
    tongueVisible: 0.0,
    jawDrop: 0.05,
    smileCurve: 0.2,
  },
  viseme_FF: {
    mouthOpen: 0.15,
    mouthWide: 0.45,
    mouthRound: 0.0,
    upperTeeth: 0.85,
    lowerTeeth: 0.0,
    tongueVisible: 0.0,
    jawDrop: 0.15,
    smileCurve: 0.3,
  },
  viseme_TH: {
    mouthOpen: 0.3,
    mouthWide: 0.5,
    mouthRound: 0.0,
    upperTeeth: 0.8,
    lowerTeeth: 0.5,
    tongueVisible: 0.9,
    jawDrop: 0.25,
    smileCurve: 0.3,
  },
  viseme_SS: {
    mouthOpen: 0.15,
    mouthWide: 0.8,
    mouthRound: 0.0,
    upperTeeth: 0.95,
    lowerTeeth: 0.85,
    tongueVisible: 0.1,
    jawDrop: 0.2,
    smileCurve: 0.6,
  },
  viseme_kk: {
    mouthOpen: 0.45,
    mouthWide: 0.55,
    mouthRound: 0.0,
    upperTeeth: 0.6,
    lowerTeeth: 0.4,
    tongueVisible: 0.2,
    jawDrop: 0.45,
    smileCurve: 0.3,
  },
  viseme_nn: {
    mouthOpen: 0.25,
    mouthWide: 0.5,
    mouthRound: 0.0,
    upperTeeth: 0.7,
    lowerTeeth: 0.5,
    tongueVisible: 0.6,
    jawDrop: 0.25,
    smileCurve: 0.35,
  },
  viseme_RR: {
    mouthOpen: 0.4,
    mouthWide: 0.35,
    mouthRound: 0.4,
    upperTeeth: 0.4,
    lowerTeeth: 0.3,
    tongueVisible: 0.4,
    jawDrop: 0.4,
    smileCurve: 0.2,
  },
};

/**
 * Phoneme character mapping to select appropriate viseme
 */
export function charToViseme(char: string): VisemeName {
  const c = char.toLowerCase();
  switch (c) {
    case 'a':
    case 'h':
      return 'viseme_aa';
    case 'e':
    case 'y':
      return 'viseme_E';
    case 'i':
      return 'viseme_I';
    case 'o':
      return 'viseme_O';
    case 'u':
    case 'w':
      return 'viseme_U';
    case 'p':
    case 'b':
    case 'm':
      return 'viseme_PP';
    case 'f':
    case 'v':
      return 'viseme_FF';
    case 't':
    case 'd':
    case 'l':
      return 'viseme_TH';
    case 's':
    case 'z':
    case 'c':
    case 'j':
      return 'viseme_SS';
    case 'k':
    case 'g':
    case 'q':
    case 'x':
      return 'viseme_kk';
    case 'n':
      return 'viseme_nn';
    case 'r':
      return 'viseme_RR';
    default:
      return 'viseme_sil';
  }
}

/**
 * Linear interpolation helper
 */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * Math.min(Math.max(factor, 0), 1);
}

/**
 * Lerp between two mouth targets for butter-smooth animation
 */
export function lerpMouthTarget(
  current: MouthMorphTarget,
  target: MouthMorphTarget,
  factor: number
): MouthMorphTarget {
  return {
    mouthOpen: lerp(current.mouthOpen, target.mouthOpen, factor),
    mouthWide: lerp(current.mouthWide, target.mouthWide, factor),
    mouthRound: lerp(current.mouthRound, target.mouthRound, factor),
    upperTeeth: lerp(current.upperTeeth, target.upperTeeth, factor),
    lowerTeeth: lerp(current.lowerTeeth, target.lowerTeeth, factor),
    tongueVisible: lerp(current.tongueVisible, target.tongueVisible, factor),
    jawDrop: lerp(current.jawDrop, target.jawDrop, factor),
    smileCurve: lerp(current.smileCurve, target.smileCurve, factor),
  };
}

/**
 * Real-time Lip Sync Controller
 */
export class LipSyncController {
  private currentTarget: MouthMorphTarget = { ...VISEME_TARGETS.viseme_sil };
  private activeTarget: MouthMorphTarget = { ...VISEME_TARGETS.viseme_sil };
  private currentWord: string = '';
  private wordCharIndex: number = 0;
  private wordTimer: number | null = null;
  private isSpeaking: boolean = false;
  private speechIntensity: number = 1.0;

  public setSpeaking(speaking: boolean, initialWord?: string) {
    this.isSpeaking = speaking;
    if (!speaking) {
      this.currentWord = '';
      this.wordCharIndex = 0;
      if (this.wordTimer) {
        window.clearTimeout(this.wordTimer);
        this.wordTimer = null;
      }
      this.activeTarget = { ...VISEME_TARGETS.viseme_sil };
    } else if (initialWord) {
      this.onWordBoundary(initialWord);
    }
  }

  public setIntensity(intensity: number) {
    this.speechIntensity = Math.max(0.2, Math.min(intensity, 1.5));
  }

  /**
   * Called on SpeechSynthesisUtterance.onboundary event for the current word
   */
  public onWordBoundary(word: string) {
    if (!this.isSpeaking) return;
    this.currentWord = word.replace(/[^a-zA-Z]/g, '');
    this.wordCharIndex = 0;
    this.advanceSyllable();
  }

  private advanceSyllable() {
    if (!this.isSpeaking || !this.currentWord) {
      this.activeTarget = { ...VISEME_TARGETS.viseme_sil };
      return;
    }

    if (this.wordCharIndex >= this.currentWord.length) {
      // Natural momentary pause between words
      this.activeTarget = {
        ...VISEME_TARGETS.viseme_sil,
        mouthOpen: 0.1,
      };
      return;
    }

    const char = this.currentWord[this.wordCharIndex];
    const viseme = charToViseme(char);
    const baseTarget = VISEME_TARGETS[viseme] || VISEME_TARGETS.viseme_sil;

    // Apply speech intensity
    this.activeTarget = {
      ...baseTarget,
      mouthOpen: baseTarget.mouthOpen * this.speechIntensity,
      jawDrop: baseTarget.jawDrop * this.speechIntensity,
    };

    this.wordCharIndex++;

    // Typical syllable duration in natural human speech: ~90ms to 130ms
    const stepDuration = 95 + Math.random() * 35;
    this.wordTimer = window.setTimeout(() => {
      this.advanceSyllable();
    }, stepDuration);
  }

  /**
   * Called every frame in requestAnimationFrame (60 FPS) to yield smoothly interpolated targets
   */
  public update(deltaSeconds: number): MouthMorphTarget {
    const lerpFactor = Math.min(1.0, deltaSeconds * 18.0); // 18/s ensures swift response without jitter
    this.currentTarget = lerpMouthTarget(this.currentTarget, this.activeTarget, lerpFactor);
    return this.currentTarget;
  }

  public getCurrentTarget(): MouthMorphTarget {
    return this.currentTarget;
  }

  public reset() {
    this.setSpeaking(false);
    this.currentTarget = { ...VISEME_TARGETS.viseme_sil };
    this.activeTarget = { ...VISEME_TARGETS.viseme_sil };
  }
}
