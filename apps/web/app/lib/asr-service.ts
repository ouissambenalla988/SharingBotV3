interface TranscriptResponse {
  id?: string;
  status?: string;
  text?: string;
  error?: string;
  language_code?: string;
  confidence?: number;
}

export class ASRService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private apiKey: string | null = null;
  private recognition: any = null; // Web Speech API recognition instance

  constructor() {
    // Vérifier que l'API key est disponible (attention: exposer une clé côté client a des risques)
    const apiKey = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY || null;
    if (!apiKey) {
      console.warn("⚠️ NEXT_PUBLIC_ASSEMBLYAI_API_KEY non configuré - Utilisation de Web Speech API");
    }
    this.apiKey = apiKey;
    
    // Initialiser Web Speech API si disponible
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true; // Continuer à écouter jusqu'à l'arrêt manuel
        this.recognition.interimResults = true; // Capturer les résultats intermédiaires
        this.recognition.lang = 'fr-FR';
        this.recognition.maxAlternatives = 1;
        console.log("✅ Web Speech API disponible");
      }
    }
    
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
      
      // Démarrer Web Speech API immédiatement si disponible
      if (this.recognition) {
        console.log("🎤 Enregistrement démarré avec Web Speech API...");
        
        // Ajouter un handler onstart pour confirmer que l'écoute a démarré
        this.recognition.onstart = () => {
          console.log("👂🟢 Web Speech API écoute MAINTENANT - vous pouvez parler !");
        };
        
        this.recognition.start();
        console.log("👂 Web Speech API en cours de démarrage...");
      } else {
        console.log("🎤 Enregistrement démarré avec AssemblyAI...");
      }
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
        body: JSON.stringify({ 
          audio_url: uploadedUrl, 
          language_code: 'fr', // Français
          speech_model: 'best' // Meilleur modèle de reconnaissance
        }),
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

      console.log('✅ Résultat complet AssemblyAI:', JSON.stringify(result, null, 2));
      console.log('📝 Texte transcrit:', result?.text);
      console.log('🔊 Confidence:', result?.confidence);

      return {
        text: (result && result.text) || '',
        language: this.detectLanguageFromTranscript(result || {}),
        confidence: result?.confidence || 0.95,
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
   * 🎧 Web Speech API Transcription (alternative gratuite, fonctionne dans le navigateur)
   */
  async transcribeWithWebSpeech(): Promise<{
    text: string;
    language: string;
    confidence: number;
  }> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Web Speech API non disponible dans ce navigateur'));
        return;
      }

      console.log('🎤 Démarrage de Web Speech Recognition...');
      
      let finalTranscript = '';
      
      this.recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            console.log('✅ Transcription Web Speech:', transcript, 'Confidence:', confidence);
          }
        }
      };

      this.recognition.onend = () => {
        console.log('🏁 Web Speech Recognition terminée');
        resolve({
          text: finalTranscript.trim(),
          language: 'fr',
          confidence: 0.9
        });
      };

      this.recognition.onerror = (event: any) => {
        console.error('❌ Erreur Web Speech:', event.error);
        
        let errorMessage = 'Erreur de reconnaissance vocale';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'no-speech: Aucune parole détectée. Parlez pendant l\'enregistrement.';
            break;
          case 'audio-capture':
            errorMessage = 'audio-capture: Impossible d\'accéder au microphone.';
            break;
          case 'not-allowed':
            errorMessage = 'not-allowed: Permission microphone refusée.';
            break;
          case 'network':
            errorMessage = 'network: Erreur réseau. Vérifiez votre connexion.';
            break;
          default:
            errorMessage = `${event.error}: Erreur inconnue.`;
        }
        
        reject(new Error(errorMessage));
      };

      this.recognition.start();
    });
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
      // Si Web Speech API était démarré, l'arrêter et récupérer le résultat
      if (this.recognition) {
        console.log('🔄 Arrêt de Web Speech API...');
        
        // Arrêter l'enregistrement MediaRecorder
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        }
        
        // Créer une promesse pour récupérer le résultat
        return new Promise((resolve, reject) => {
          let finalTranscript = '';
          let hasResult = false;
          
          // Timeout de 500ms au cas où onend ne se déclenche pas
          const timeout = setTimeout(() => {
            if (!hasResult) {
              console.log('⏱️ Timeout Web Speech API');
              resolve({
                text: finalTranscript.trim(),
                language: 'fr',
                confidence: 0.9
              });
            }
          }, 500);
          
          // Récupérer le résultat avant d'arrêter
          if (this.recognition) {
            this.recognition.onresult = (event: any) => {
              console.log('📥 Résultat reçu, nombre de results:', event.results.length);
              for (let i = 0; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                const isFinal = event.results[i].isFinal;
                console.log(`   [${i}] isFinal: ${isFinal}, texte: "${transcript}"`);
                
                // Capturer tous les résultats (finaux ET intermédiaires)
                if (isFinal) {
                  finalTranscript += transcript + ' ';
                  console.log('✅ Transcription finale ajoutée:', transcript);
                } else {
                  // Même les résultats intermédiaires peuvent être utiles
                  console.log('⏳ Transcription intermédiaire:', transcript);
                  // Si aucun résultat final n'arrive, garder au moins l'intermédiaire
                  if (!finalTranscript) {
                    finalTranscript = transcript;
                  }
                }
              }
            };
            
            this.recognition.onend = () => {
              hasResult = true;
              clearTimeout(timeout);
              console.log('🏁 Web Speech terminé, texte:', finalTranscript.trim());
              resolve({
                text: finalTranscript.trim(),
                language: 'fr',
                confidence: 0.9
              });
            };
            
            this.recognition.onerror = (event: any) => {
              hasResult = true;
              clearTimeout(timeout);
              console.error('❌ Erreur Web Speech:', event.error);
              
              // Si pas de parole détectée, retourner texte vide au lieu d'erreur
              if (event.error === 'no-speech') {
                resolve({
                  text: '',
                  language: 'fr',
                  confidence: 0
                });
              } else {
                reject(new Error(`Erreur Web Speech: ${event.error}`));
              }
            };
            
            // Arrêter Web Speech API
            this.recognition.stop();
          }
        });
      }
      
      // Sinon utiliser AssemblyAI
      console.log('🔄 Utilisation de AssemblyAI...');
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