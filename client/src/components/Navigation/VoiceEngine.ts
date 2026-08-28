class VoiceEngine {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private isMuted: boolean = false;
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoice();
    }
  }

  private initVoice() {
    if (!this.synth) return;
    const loadVoices = () => {
      const voices = this.synth!.getVoices();
      // Select natural English voice if available
      this.voice =
        voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Siri'))) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0] ||
        null;
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public speak(text: string, force = false) {
    if (this.isMuted || !this.synth || !text) return;

    const now = Date.now();
    // Avoid repeating same speech within 8 seconds unless forced
    if (!force && text === this.lastSpokenText && now - this.lastSpokenTime < 8000) {
      return;
    }

    this.synth.cancel(); // Cancel previous ongoing utterance for timely navigation prompt

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) {
      utterance.voice = this.voice;
    }
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    this.lastSpokenText = text;
    this.lastSpokenTime = now;

    this.synth.speak(utterance);
  }
}

export const voiceEngine = new VoiceEngine();
