export class TTSService {
  // Speak text and resolve when the utterance ends or reject on error.
  static speakText(text: string, language: string = 'fr'): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        // Stop any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.getLanguageCode(language);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => {
          resolve();
        };

        utterance.onerror = (ev) => {
          // best-effort: resolve to avoid blocking UI, but also reject for callers that want it
          try {
            // some browsers provide error event with message
            // @ts-ignore
            const msg = ev?.error || ev?.message || 'TTS error';
            reject(new Error(String(msg)));
          } catch {
            reject(new Error('TTS error'));
          }
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }

  static stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  static isSpeaking(): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return window.speechSynthesis.speaking;
  }

  private static getLanguageCode(lang: string): string {
    const codes: { [key: string]: string } = {
      fr: 'fr-FR',
      en: 'en-US',
      ar: 'ar-SA',
    };
    return codes[lang as keyof typeof codes] || 'fr-FR';
  }
}