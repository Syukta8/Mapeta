/**
 * Mapeta Voice Guidance Engine using Web Speech Synthesis API
 */
class VoiceEngine {
  private synth: SpeechSynthesis | null = null;
  private isMuted: boolean = false;
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
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

  public speak(text: string, priority: boolean = false) {
    if (this.isMuted || !this.synth || !text) return;

    const now = Date.now();
    if (this.lastSpokenText === text && now - this.lastSpokenTime < 4000) {
      return;
    }

    if (priority) {
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = this.synth.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    this.lastSpokenText = text;
    this.lastSpokenTime = now;
    this.synth.speak(utterance);
  }

  public speakIncidentAlert(type: string, subtype?: string) {
    const detail = subtype ? `${subtype}` : type;
    switch (type) {
      case 'police':
        this.speak(`Caution, police reported ahead.`, true);
        break;
      case 'jam':
        this.speak(`Traffic congestion ahead.`, true);
        break;
      case 'hazard':
        this.speak(`Warning, hazard reported on road ahead.`, true);
        break;
      case 'accident':
        this.speak(`Caution, accident reported ahead.`, true);
        break;
      case 'closure':
        this.speak(`Road closure reported ahead.`, true);
        break;
      default:
        this.speak(`Alert: ${detail} reported ahead.`, true);
    }
  }
}

export const voiceEngine = new VoiceEngine();
