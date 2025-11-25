import { franc } from 'franc';

export class LanguageDetector {
  static detect(text: string): 'fr' | 'en' | 'ar' {
    if (!text || text.trim().length < 3) {
      return 'en';
    }

    const result = franc(text, {
      minLength: 2,
      only: ['fra', 'eng', 'arb']
    });

    const languageMap = {
      'fra': 'fr',
      'eng': 'en',
      'arb': 'ar'
    } as const;

    return languageMap[result as keyof typeof languageMap] || 'en';
  }

  static detectWithConfidence(text: string): { 
    language: 'fr' | 'en' | 'ar'; 
    confidence: number;
  } {
    if (!text || text.trim().length < 3) {
      return { language: 'en', confidence: 0 };
    }

    // For franc 6.x, we detect a single language and estimate confidence
    const detected = franc(text, {
      minLength: 2,
      only: ['fra', 'eng', 'arb']
    });

    const languageMap = {
      'fra': 'fr',
      'eng': 'en',
      'arb': 'ar'
    } as const;

    const language = languageMap[detected as keyof typeof languageMap] || 'en';

    return {
      language: language,
      confidence: detected === 'und' ? 0 : 0.95
    };
  }
}