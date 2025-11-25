interface TranscriptResponse {
  id?: string;
  status?: string;
  text?: string;
  error?: string;
  language_code?: string;
}

export class ASRService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private apiKey: string | null = null;

  constructor() {
    // Vérifier que l'API key est disponible (attention: exposer une clé côté client a des risques)
    const apiKey = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY || null;
    if (!apiKey) {
      console.warn("⚠️ NEXT_PUBLIC_ASSEMBLYAI_API_KEY non configuré");
      // Do not throw here to allow the component to render, we'll handle missing key at runtime.
    }
    this.apiKey = apiKey;
    console.log("ASRService initialisé (client-side)");
  }

  /**
   * 🔴 Démarre l'enregistrement audio
   */
  async startRecording(): Promise<void> {
    try {
      // Nettoyage préalable
      if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
        this.mediaRecorder.stop();
      }

      this.audioChunks = [];

      // Accès au micro optimisé pour la transcription
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 16000,
        },
      });

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start(1000); // Collecte chaque seconde
      console.log("🎤 Enregistrement démarré avec AssemblyAI...");
    } catch (error) {
      console.error("❌ Erreur d'accès au micro:", error);
      throw new Error("Impossible d'accéder au microphone.");
    }
  }

  /**
   * ⏹️ Stoppe l'enregistrement et renvoie le Blob audio
   */
  private async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error("Aucun enregistrement en cours."));
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: "audio/webm;codecs=opus",
        });

        console.log("🧩 Audio enregistré :", audioBlob.size, "octets");

        // Nettoyer les ressources
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }

        this.mediaRecorder = null;
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * 🧠 Transcription avec AssemblyAI
   */
  private async transcribeWithAssemblyAI(audioBlob: Blob): Promise<{
    text: string;
    language: string;
    confidence: number;
  }> {
    try {
      console.log("🪄 Début de la transcription avec AssemblyAI...");

      // Vérifier la taille de l'audio
      if (audioBlob.size < 2000) {
        throw new Error("Audio trop court pour la transcription");
      }
      // Ensure API key available
      if (!this.apiKey) {
        throw new Error('Clé AssemblyAI manquante (NEXT_PUBLIC_ASSEMBLYAI_API_KEY)');
      }

      // 1) Upload: POST /v2/upload (binary)
      const uploadUrl = 'https://api.assemblyai.com/v2/upload';
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: this.apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: audioBlob,
      });

      // AssemblyAI may return JSON or plain text; try both
      let uploadedUrl: string | null = null;
      try {
        const json = await uploadResponse.json();
        uploadedUrl = (json && (json.upload_url || json.url)) || null;
      } catch {
        // fallback to text
        const text = await uploadResponse.text();
        uploadedUrl = text || null;
      }

      if (!uploadedUrl) {
        throw new Error('Échec de l\'upload vers AssemblyAI');
      }

      // 2) Create transcript
      const transcriptCreate = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          Authorization: this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio_url: uploadedUrl, language_detection: true }),
      });

      const transcriptData = await transcriptCreate.json();
      if (!transcriptData || !transcriptData.id) {
        throw new Error('Impossible de créer la transcription');
      }

      const transcriptId = transcriptData.id as string;

      // 3) Poll until completed or error
      const pollUrl = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;
      let result: TranscriptResponse | null = null;
      const start = Date.now();
      while (true) {
        const res = await fetch(pollUrl, { headers: { Authorization: this.apiKey } });
        result = (await res.json()) as TranscriptResponse | null;
        if (!result) {
          if (Date.now() - start > 120_000) {
            throw new Error('Timeout transcription AssemblyAI');
          }
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        if (result.status === 'completed' || result.status === 'error') break;
        if (Date.now() - start > 120_000) {
          throw new Error('Timeout transcription AssemblyAI');
        }
        await new Promise((r) => setTimeout(r, 1000));
      }

      if (result && result.status === 'error') {
        throw new Error(`Erreur AssemblyAI: ${result.error || 'unknown'}`);
      }

      return {
        text: (result && result.text) || '',
  language: this.detectLanguageFromTranscript(result || {}),
        confidence: 0.95,
      };

    } catch (error) {
      console.error("❌ Erreur transcription AssemblyAI:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes("401") || errorMessage.includes("403")) {
        throw new Error("Clé API AssemblyAI invalide");
      } else if (errorMessage.includes("429")) {
        throw new Error("Limite de requêtes AssemblyAI atteinte");
      } else if (errorMessage.includes("413")) {
        throw new Error("Fichier audio trop volumineux pour AssemblyAI");
      } else {
        throw new Error(`Erreur de transcription: ${errorMessage}`);
      }
    }
  }

  /**
   * Détection de langue à partir du transcript AssemblyAI
   */
  private detectLanguageFromTranscript(transcript: TranscriptResponse | Record<string, unknown>): string {
    // AssemblyAI peut retourner la langue détectée
    const languageCode = transcript.language_code as string | undefined;
    if (languageCode) {
      const langMap: { [key: string]: string } = {
        'fr': 'fr',
        'en': 'en',
        'ar': 'ar',
        'es': 'es',
        'de': 'de',
        'it': 'it'
      };
      return langMap[languageCode] || 'fr';
    }
    
    // Fallback vers la détection basée sur le texte
    const transcriptText = transcript.text as string | undefined;
    return this.detectLanguageFromText(transcriptText || "");
  }

  /**
   * Détection de langue basée sur le texte (fallback)
   */
  private detectLanguageFromText(text: string): string {
    if (!text || text.trim().length < 2) return "fr";
    
    const frenchIndicators = [
      'bonjour', 'merci', 'oui', 'non', 'je', 'tu', 'il', 'nous', 'vous', 
      'salut', 'au revoir', 's\'il vous plaît', 'excusez-moi', 'comment'
    ];
    
    const arabicChars = /[\u0600-\u06FF]/;
    const englishIndicators = [
      'hello', 'hi', 'thanks', 'thank you', 'yes', 'no', 'the', 'and', 
      'you', 'how', 'what', 'when', 'where'
    ];
    
    const lowerText = text.toLowerCase().trim();
    
    // Vérifier l'arabe d'abord (caractères uniques)
    if (arabicChars.test(text)) return "ar";
    
    // Compter les indicateurs de langue
    const frenchScore = frenchIndicators.filter(word => lowerText.includes(word)).length;
    const englishScore = englishIndicators.filter(word => lowerText.includes(word)).length;
    
    if (frenchScore > englishScore) return "fr";
    if (englishScore > frenchScore) return "en";
    
    // Par défaut français
    return "fr";
  }

  /**
   * 🎧 Stop + Transcription (tout-en-un)
   */
  async stopAndTranscribe(): Promise<{
    text: string;
    language: string;
    confidence: number;
  }> {
    try {
      const audioBlob = await this.stopRecording();
      return await this.transcribeWithAssemblyAI(audioBlob);
    } catch (error) {
      console.error("❌ Erreur transcription audio:", error);
      throw error;
    }
  }

  /**
   * ⚙️ Vérifie si l'enregistrement est actif
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }

  /**
   * Nettoyage des ressources
   */
  cleanup() {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.stop();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}