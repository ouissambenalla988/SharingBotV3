declare module 'react-speech-recognition' {
  export interface UseSpeechRecognitionOptions {
    transcribing?: boolean;
    clearTranscriptOnListen?: boolean;
    commands?: Array<{
      command: string | RegExp | string[];
      callback: (...args: any[]) => void;
      matchInterim?: boolean;
      isFuzzyMatch?: boolean;
      fuzzyMatchingThreshold?: number;
      bestMatchOnly?: boolean;
    }>;
  }

  export interface SpeechRecognitionResult {
    transcript: string;
    resetTranscript: () => void;
    listening: boolean;
    browserSupportsSpeechRecognition: boolean;
    isMicrophoneAvailable: boolean;
    interimTranscript: string;
    finalTranscript: string;
  }

  export function useSpeechRecognition(
    options?: UseSpeechRecognitionOptions
  ): SpeechRecognitionResult;

  export interface SpeechRecognition {
    startListening: (options?: {
      continuous?: boolean;
      language?: string;
      interimResults?: boolean;
    }) => Promise<void>;
    stopListening: () => Promise<void>;
    abortListening: () => Promise<void>;
    browserSupportsSpeechRecognition: () => boolean;
    getRecognition: () => any;
  }

  const SpeechRecognition: SpeechRecognition;
  export default SpeechRecognition;
}
