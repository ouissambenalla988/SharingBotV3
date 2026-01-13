"use client";

import React, { ReactNode , useState, useRef, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Card } from "~/components/ui/card";
import Image from "next/image";
import logo from "../../public/img/sharingan.png";
import {
  ArrowUp,
  Mic,
  X,
  Paperclip,
  FileText,
  File as FileIcon,
  Eye,
  Volume2,
  VolumeX,
} from "lucide-react";

import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { ASRService } from "../../lib/asr-service";
import { TTSService } from "../../lib/tts-service";
import { OCRService } from "../../lib/ocr-service";
import { ProfileAvatar } from '@kit/ui/profile-avatar';
import { useUser } from '@kit/supabase/hooks/use-user';
import { usePersonalAccountData } from '@kit/accounts/hooks/use-personal-account-data';

// Import Supabase utilities for persistence
import {
  createConversation,
  getConversations,
  getMessages,
  addMessage,
} from '../../lib/supabase/conversations';
import {
  uploadDocument,
  getAllAccessibleDocuments,
  type Document,
} from '../../lib/supabase/documents';

// --- Sheet Mock (à remplacer par Shadcn Sheet si besoin) ---

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export const Sheet = ({ open, onOpenChange, children }: SheetProps) => (
  <div
    style={{
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      width: "400px",
      backgroundColor: "var(--background)",
      boxShadow: open ? "-5px 0 15px rgba(0,0,0,0.2)" : "none",
      transform: open ? "translateX(0)" : "translateX(100%)",
      transition: "transform 0.3s ease",
      zIndex: 50,
    }}
  >
    {children}
    <button
      onClick={() => onOpenChange(false)}
      className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      aria-label="Fermer"
    >
      <X className="w-5 h-5" />
    </button>
  </div>
);

interface SheetSectionProps {
  children: ReactNode;
}

export const SheetContent = ({ children }: SheetSectionProps) => (
  <div className="p-6 h-full overflow-y-auto">{children}</div>
);

export const SheetHeader = ({ children }: SheetSectionProps) => (
  <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
    {children}
  </div>
);

export const SheetTitle = ({ children }: SheetSectionProps) => (
  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
    {children}
  </h2>
);
// -------------------------------------------------------------

interface AttachedFile {
  name: string;
  type: string;
  url: string;
  // keep original File object to run OCR on client
  file?: File | null;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  files?: AttachedFile[];
  // optional RAG sources returned by the API
  sources?: Array<{ 
    text: string; 
    score?: number; 
    length?: number;
    pdf_name?: string;
    pdf_url?: string;
  }>;
  // Metadata about PDFs used for this response
  pdfMetadata?: Array<{ name: string; url: string }>;
}

export function DashBoardChat() {
  const { data: userData } = useUser();
  const userId = userData?.id;
  const personalAccountData = usePersonalAccountData(userData?.id ?? '');

  // React Speech Recognition hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Conversation state
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I am SharingBot AI assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [ocrRunningFor, setOcrRunningFor] = useState<number | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [fileToPreview, setFileToPreview] = useState<AttachedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sheetOcrRunning, setSheetOcrRunning] = useState(false);

  // Keep last user message for retry
  const lastUserRef = useRef<Message | null>(null);
  const asrServiceRef = useRef<ASRService | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize conversation and load documents on mount
  useEffect(() => {
    const initializeChat = async () => {
      if (!userId) return;

      try {
        // Load available documents from Supabase
        const docs = await getAllAccessibleDocuments(userId);
        setAvailableDocuments(docs);
        console.log('Loaded documents from Supabase:', docs);

        // Get or create conversation
        const conversations = await getConversations(userId);
        let convId: string;

        if (conversations.length === 0) {
          // Create first conversation
          const newConv = await createConversation(userId, 'Chat Session');
          if (newConv) {
            convId = newConv.id;
            setCurrentConversationId(convId);
          } else {
            console.error('Failed to create conversation');
            return;
          }
        } else {
          // Use most recent conversation
          convId = conversations[0]!.id;
          setCurrentConversationId(convId);

          // Load previous messages
          const previousMessages = await getMessages(convId);
          if (previousMessages.length > 0) {
            const loadedMessages: Message[] = previousMessages.map((msg, idx) => ({
              id: idx + 1,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            }));
            setMessages(loadedMessages);
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };

    initializeChat();
  }, [userId]);

  // Scroll automatique vers le bas when messages change
  // Scroll automatique vers le bas when messages change
  const scrollToBottom = (smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    try {
      if (smooth && typeof el.scrollTo === 'function') {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      } else {
        el.scrollTop = el.scrollHeight;
      }
    } catch {
      // fallback
      el.scrollTop = el.scrollHeight;
    }
  };

  useEffect(() => {
    // wait for DOM updates then scroll
    requestAnimationFrame(() => scrollToBottom(true));
  }, [messages]);

  // When typing indicator appears, ensure we scroll to bottom so it's visible
  useEffect(() => {
    if (isTyping) requestAnimationFrame(() => scrollToBottom(true));
  }, [isTyping]);

  const handlePreviewFile = (file: AttachedFile) => {
    setFileToPreview(file);
    setIsSheetOpen(true);
  };

  // Init ASR service on client
  useEffect(() => {
    try {
      asrServiceRef.current = new ASRService();
    } catch (e) {
      console.error('Failed to init ASR:', e);
      asrServiceRef.current = null;
    }

    return () => {
      try {
        asrServiceRef.current?.cleanup();
      } catch (e) {
        console.warn('ASR cleanup failed', e);
      }
    };
  }, []);

  // Debug SpeechRecognition events
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const recognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!recognition) {
      console.error('❌ SpeechRecognition not available in this browser');
      return;
    }

    console.log('🔊 SpeechRecognition API détectée, testez maintenant le microphone');
  }, []);

  // TTS speaking state is managed per-utterance via TTSService Promise

 const handleSend = async (messageTextParam?: string) => {
  // 1️⃣ Déterminer le texte à envoyer
  const messageText =
    typeof messageTextParam === 'string' ? messageTextParam : input;

  // snapshot local des fichiers (avant reset du state)
  const currentFiles = [...attachedFiles];

  // 2️⃣ Si pas de texte et pas de fichiers -> on ne fait rien
  if (!messageText.trim() && currentFiles.length === 0) {
    return;
  }

  // 3️⃣ RAG FastAPI a besoin d'au moins un PDF
  const pdfFiles = currentFiles.filter((f) => {
    const isPdfType = f.file?.type === 'application/pdf';
    const isPdfName = f.name.toLowerCase().endsWith('.pdf');
    return isPdfType || isPdfName;
  });

  // Si aucun PDF n'est attaché, utiliser les PDFs existants de la base
  let pdfFilesToUse = pdfFiles;
  if (pdfFiles.length === 0 && availableDocuments.length > 0) {
    console.log('📚 Aucun PDF attaché, utilisation des PDFs de la base:', availableDocuments.length);
    // Les PDFs de la base seront envoyés par leur file_path
  } else if (pdfFiles.length === 0) {
    setError('Veuillez joindre au moins un fichier PDF ou ajouter des documents dans votre bibliothèque.');
    return;
  }

  // 4️⃣ Ajouter le message utilisateur dans l'UI
  const userMessage: Message = {
    id: Date.now(),
    role: 'user',
    content: messageText,
    files: currentFiles,
  };

  setMessages((prev) => [...prev, userMessage]);
  lastUserRef.current = userMessage;

  // 💾 Save user message to Supabase
  if (userId && currentConversationId) {
    try {
      await addMessage(currentConversationId, 'user', messageText);
      console.log('✅ Message utilisateur sauvegardé');
    } catch (err) {
      console.error('❌ Erreur sauvegarde message:', err);
    }
  }

  // 📤 Upload new PDFs to Supabase Storage
  const uploadedDocIds: string[] = [];
  if (userId && pdfFiles.length > 0) {
    console.log('📤 Début upload des PDFs vers Supabase:', pdfFiles.length);
    for (const pdfFile of pdfFiles) {
      if (pdfFile.file) {
        try {
          console.log('📤 Upload en cours:', pdfFile.name);
          // Correct parameter order: file first, then userId
          const doc = await uploadDocument(pdfFile.file, userId, false);
          if (doc) {
            uploadedDocIds.push(doc.id);
            console.log('✅ PDF uploadé vers Supabase:', pdfFile.name, 'ID:', doc.id);
          } else {
            console.error('❌ Upload retourné null pour:', pdfFile.name);
          }
        } catch (err) {
          console.error('❌ Erreur upload PDF:', pdfFile.name, err);
        }
      }
    }
    
    // Reload available documents
    console.log('🔄 Rechargement des documents disponibles...');
    const updatedDocs = await getAllAccessibleDocuments(userId);
    setAvailableDocuments(updatedDocs);
    console.log('✅ Documents disponibles rechargés:', updatedDocs.length);
  }

  // reset input & pièces jointes pour l'UX
  setInput('');
  setAttachedFiles([]);
  setIsTyping(true);

  // focus textarea
  requestAnimationFrame(() => {
    try {
      const ta = textAreaRef.current;
      if (ta) {
        ta.focus();
        const len = ta.value?.length ?? 0;
        ta.setSelectionRange(len, len);
      }
    } catch (e) {
      console.warn('focus textarea failed', e);
    }
  });

  try {
    // 5️⃣ URL de ton API FastAPI
    const apiUrl =
      process.env.NEXT_PUBLIC_CHATBOT_API_URL ||
      'http://127.0.0.1:8000/ask';

    console.log('🚀 Envoi vers:', apiUrl);
    console.log('📝 Question:', messageText);

    // 6️⃣ Construire le FormData pour FastAPI
    const formData = new FormData();
    formData.append('question', messageText);

    // Tracker les PDFs envoyés pour afficher leurs liens dans les sources
    const sentPdfs: Array<{ name: string; url: string }> = [];

    // Si des nouveaux PDFs sont attachés, les utiliser
    if (pdfFiles.length > 0) {
      console.log('📁 Utilisation des nouveaux PDFs attachés:', pdfFiles.length);
      pdfFiles.forEach((f) => {
        if (f.file) {
          formData.append('files', f.file, f.name);
          console.log('📎 Ajout fichier:', f.name);
          // Note: pour les nouveaux PDFs, on n'a pas encore d'URL publique
          // L'URL sera disponible après l'upload dans Supabase
        }
      });
    } 
    // Sinon, récupérer et utiliser les PDFs stockés dans Supabase
    else if (availableDocuments.length > 0) {
      console.log('📚 Utilisation des PDFs de la base:', availableDocuments.length);
      console.log('👤 User ID actuel:', userId);
      console.log('📋 Documents disponibles:', availableDocuments.map(d => ({ 
        name: d.filename, 
        userId: d.user_id, 
        isGlobal: d.is_global,
        belongsToUser: d.user_id === userId
      })));
      
      // Récupérer les PDFs depuis Supabase Storage
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      for (const doc of availableDocuments) {
        try {
          // Construire l'URL publique du fichier
          const fileUrl = `${supabaseUrl}/storage/v1/object/public/documents/${doc.file_path}`;
          console.log('📥 Téléchargement PDF:', doc.filename, 'depuis', fileUrl);
          
          // Télécharger le fichier depuis Supabase
          const fileResponse = await fetch(fileUrl);
          if (fileResponse.ok) {
            const blob = await fileResponse.blob();
            const file = new File([blob], doc.filename, { type: 'application/pdf' });
            formData.append('files', file, doc.filename);
            console.log('✅ PDF ajouté:', doc.filename);
            
            // Tracker l'URL publique du PDF SEULEMENT si le document appartient à l'utilisateur
            // Ne pas afficher les PDFs globaux dans les sources pour éviter la confusion
            if (doc.user_id === userId) {
              sentPdfs.push({
                name: doc.filename,
                url: fileUrl
              });
              console.log('📌 PDF tracké pour affichage:', doc.filename);
            } else {
              console.log('⏭️ PDF global ignoré pour affichage:', doc.filename);
            }
          } else {
            console.error('❌ Erreur téléchargement PDF:', doc.filename, fileResponse.status);
          }
        } catch (err) {
          console.error('❌ Erreur récupération PDF:', doc.filename, err);
        }
      }
    }

    console.log('📋 PDFs trackés avec URLs:', sentPdfs);

    // 7️⃣ Appel à l'API
    console.log('⏳ Appel API en cours...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    console.log('📡 Statut réponse:', response.status);

    if (!response.ok) {
      const txt = await response.text().catch(() => '');
      console.error('❌ Réponse non OK de /ask :', response.status, txt);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Réponse RAG reçue du backend:', data);
    console.log('📊 Structure de data:', {
      hasAnswer: !!data.answer,
      hasResponse: !!data.response,
      hasSources: !!data.sources,
      status: data.status
    });

    // 8️⃣ Construire le message assistant
    const answerText = data.answer || data.response || data.message || 'No response received from API';
    console.log('💬 Texte de réponse extrait:', answerText.substring(0, 100) + '...');

    const botMessage: Message = {
      id: Date.now() + 1,
      role: 'assistant',
      content: answerText,
      pdfMetadata: sentPdfs,
      sources: Array.isArray(data.sources)
        ? data.sources.map((s: any) => {
            // Essayer de trouver l'URL du PDF correspondant
            const sourcePdfName = s.pdf_name || s.metadata?.source || s.source;
            const matchedPdf = sentPdfs.find(pdf => 
              pdf.name === sourcePdfName || 
              pdf.name.includes(sourcePdfName) || 
              sourcePdfName?.includes(pdf.name)
            );
            
            return {
              text: typeof s.text === 'string' ? s.text : JSON.stringify(s ?? ''),
              score: typeof s.score === 'number' ? s.score : undefined,
              length: typeof s.length === 'number' ? s.length : undefined,
              pdf_name: sourcePdfName || (matchedPdf?.name) || undefined,
              pdf_url: s.pdf_url || s.metadata?.pdf_url || (matchedPdf?.url) || undefined,
            };
          })
        : undefined,
    };

    console.log('💬 Message bot créé:', {
      id: botMessage.id,
      contentLength: botMessage.content.length,
      sourcesCount: botMessage.sources?.length || 0
    });

    // 9️⃣ Afficher la réponse dans le chat
    setMessages((prev) => {
      console.log('📝 Ajout message bot au state. Messages avant:', prev.length);
      return [...prev, botMessage];
    });

    // 💾 Save assistant message to Supabase
    if (userId && currentConversationId) {
      try {
        await addMessage(currentConversationId, 'assistant', answerText);
        console.log('✅ Réponse assistant sauvegardée');
      } catch (err) {
        console.error('❌ Erreur sauvegarde réponse:', err);
      }
    }

    // scroll et focus
    requestAnimationFrame(() => {
      scrollToBottom(false);
      try {
        const ta = textAreaRef.current;
        if (ta) {
          ta.focus();
          const len = ta.value?.length ?? 0;
          ta.setSelectionRange(len, len);
        }
      } catch (e) {
        console.warn('focus textarea failed', e);
      }
    });

    // TTS is now manually triggered via button - automatic TTS removed
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : 'Failed to get response from API';
    console.error('❌ Erreur lors de l\'appel à /ask :', err);
    setError(errorMsg);

    requestAnimationFrame(() => {
      scrollToBottom(false);
      try {
        textAreaRef.current?.focus();
      } catch (e) {
        console.warn('focus textarea failed', e);
      }
    });
  } finally {
    console.log('🏁 Fin du traitement, isTyping = false');
    setIsTyping(false);
  }
};
  

  // Start/stop voice recording using ASRService
  const handleVoiceRecord = async () => {
    if (isSpeaking) {
      // If TTS is playing, stop it first instead of recording
      try {
        TTSService.stopSpeaking();
      } catch {
        // ignore
      }
      setIsSpeaking(false);
      return;
    }

    // Check browser support
    if (!browserSupportsSpeechRecognition) {
      setError('Votre navigateur ne supporte pas la reconnaissance vocale. Utilisez Chrome ou Edge.');
      return;
    }

    if (!listening) {
      // Start recording
      try {
        console.log('🎤 Démarrage de l\'enregistrement vocal...');
        
        // Test microphone permission first
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => {
            console.log('✅ Permission micro accordée');
            resetTranscript();
            SpeechRecognition.startListening({ 
              language: 'fr-FR', 
              continuous: true,
              interimResults: true
            });
          })
          .catch((err) => {
            console.error('❌ Permission micro refusée:', err);
            setError(`Erreur micro: ${err.message}. Vérifiez les permissions dans les paramètres du navigateur.`);
          });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('❌ Erreur démarrage micro:', msg);
        setError(msg || "Erreur d'enregistrement");
      }
    } else {
      // Stop recording - transcript will be handled by useEffect
      try {
        console.log('🛑 Arrêt de l\'enregistrement...');
        SpeechRecognition.stopListening();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('❌ Erreur arrêt micro:', msg);
        setError(msg || 'Erreur lors de la transcription');
      }
    }
  };

  // Auto-update input when transcript changes after listening stops
  useEffect(() => {
    console.log('🔍 useEffect transcript:', {
      listening,
      transcript,
      transcriptLength: transcript?.length,
      hasTranscript: !!transcript,
      trimmed: transcript?.trim()
    });
    
    // Only process if we just stopped listening and have a transcript
    if (!listening && transcript && transcript.trim()) {
      console.log('📝 Transcription reçue:', transcript);
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      console.log('✅ Texte ajouté au champ de saisie');
      // Don't reset here - will be reset on next start
    } else if (!listening && (!transcript || !transcript.trim())) {
      console.warn('⚠️ Arrêté mais pas de transcript:', transcript);
    }
  }, [listening, transcript]);

  // Auto-clear error after a few seconds
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(t);
  }, [error]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { files } = e.target;
  if (!files || files.length === 0) return;

  const newFiles: AttachedFile[] = Array.from(files).map((file) => ({
    name: file.name,
    type: (file.type ? file.type.split("/")[0] : "unknown") as string,
    url: URL.createObjectURL(file),
    file,
  }));

  setAttachedFiles((prev) => [...prev, ...newFiles]);

  // Réinitialisation du champ de fichier pour pouvoir re-téléverser le même fichier
  if (e.target) {
    e.target.value = "";
  }
};


  const removeFile = (index: number) => {
    setAttachedFiles((prev) => {
      const item = prev[index];
      try {
        if (item && item.url && item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
      } catch {
        // ignore
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Run OCR on an attached file (image or PDF)
  const runOCROnFile = async (fileItem: AttachedFile, index: number) => {
    if (!fileItem) return;
    if (!fileItem.file) {
      setError('Fichier non disponible pour OCR');
      return;
    }
    setOcrRunningFor(index);
    try {
      const f = fileItem.file;
      // If image, call OCRService directly
      if ((f.type && f.type.startsWith('image')) || /\.(png|jpe?g|bmp|gif|webp)$/i.test(f.name)) {
        const result = await OCRService.extractTextFromImage(f);
        setInput((prev) => (prev ? `${prev}\n${result.text}` : result.text));
        // ensure input is focused and visible
        requestAnimationFrame(() => {
          scrollToBottom(false);
          try { textAreaRef.current?.focus(); } catch (e) { console.warn('focus textarea failed', e); }
        });
      } else if (f.name.toLowerCase().endsWith('.pdf')) {
        // try to dynamically import pdfjs and render pages
        try {
          const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
          // try to set a worker src if pdfjs exposes a version (best-effort)
          try {
            const maybeVersion = (pdfjs as unknown as { version?: string }).version;
            if (maybeVersion && typeof window !== 'undefined') {
              try {
                // set a CDN worker path as a fallback
                pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${maybeVersion}/pdf.worker.min.js`;
              } catch (err) {
                console.warn('Could not set pdfjs workerSrc', err);
              }
            }
          } catch (err) {
            console.warn('pdfjs worker setup failed', err);
          }
          const arrayBuf = await f.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: arrayBuf }).promise;
          let accumulated = '';
          for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;
            await page.render({ canvasContext: ctx, viewport }).promise;
            const blob: Blob | null = await new Promise((res) => canvas.toBlob((b) => res(b), 'image/png'));
            if (!blob) continue;
            const pageFile = new File([blob], `${fileItem.name}-page-${p}.png`, { type: 'image/png' });
            try {
              const r = await OCRService.extractTextFromImage(pageFile);
              accumulated += `\n\n--- Page ${p} ---\n` + r.text;
            } catch (e) {
              console.warn('OCR page failed', e);
            }
          }
          if (accumulated.trim()) {
            setInput((prev) => (prev ? `${prev}\n${accumulated}` : accumulated));
            requestAnimationFrame(() => {
              scrollToBottom(false);
              try { textAreaRef.current?.focus(); } catch (e) { console.warn('focus textarea failed', e); }
            });
          } else {
            setError('Aucun texte détecté dans le PDF');
          }
        } catch (e) {
          console.error('PDF OCR requires pdfjs-dist. Error:', e);
          setError('OCR PDF nécessite la dépendance `pdfjs-dist`. Veuillez l\'installer.');
        }
      } else {
        setError('Type de fichier non supporté pour OCR');
      }
    } catch (e) {
      console.error('OCR failed', e);
      setError('Échec OCR: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setOcrRunningFor(null);
    }
  };

    // Handle OCR actions from the preview sheet: insert or send OCR text
    const handleSheetSendOCR = async (insertOnly = false) => {
      if (!fileToPreview || !fileToPreview.file) {
        setError('Aucun fichier sélectionné pour OCR');
        return;
      }
      setSheetOcrRunning(true);
      try {
        const f = fileToPreview.file;
        // Image: run OCR directly
        if ((f.type && f.type.startsWith('image')) || /\.(png|jpe?g|bmp|gif|webp)$/i.test(f.name)) {
          const r = await OCRService.extractTextFromImage(f);
          const extracted = r?.text || '';
          if (!extracted.trim()) {
            setError("Aucun texte détecté dans l'image");
            return;
          }
          const combined = input.trim() ? `${input}\n${extracted}` : extracted;
          if (insertOnly) {
            setInput(combined);
            requestAnimationFrame(() => textAreaRef.current?.focus());
            return;
          }
          // send immediately: close sheet, set input and call handleSend
          setIsSheetOpen(false);
          setInput(combined);
          requestAnimationFrame(() => {
            try { textAreaRef.current?.focus(); } catch (e) { console.warn('focus textarea failed', e); }
            handleSend(combined);
          });
          return;
        }

        // PDF: reuse runOCROnFile which appends recognized text to input
        if (f.name.toLowerCase().endsWith('.pdf')) {
          await runOCROnFile(fileToPreview, -1);
          if (insertOnly) {
            requestAnimationFrame(() => textAreaRef.current?.focus());
            return;
          }
          setIsSheetOpen(false);
          requestAnimationFrame(() => handleSend());
          return;
        }

        setError('Type de fichier non supporté pour OCR');
      } catch (e) {
        console.error('Sheet OCR failed', e);
        setError('Échec de l\'OCR: ' + (e instanceof Error ? e.message : String(e)));
      } finally {
        setSheetOcrRunning(false);
      }
    };

  const triggerFileInput = () => fileInputRef.current?.click();

  // Revoke all created object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      try {
        attachedFiles.forEach((f) => {
          if (f && f.url && f.url.startsWith('blob:')) URL.revokeObjectURL(f.url);
        });
      } catch {
        // ignore
      }
    };
  }, [attachedFiles]);

  const getFileIcon = (type: string) => {
    if (type === "image")
      return <Image src={logo} alt="" width={14} height={14} />;
    if (type === "application")
      return <FileText className="w-4 h-4 text-red-500" />;
    return <FileIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
  };

  // Handle TTS playback for individual messages
  const handleTTSToggle = async (messageId: number, content: string) => {
    // If this message is already playing, stop it
    if (playingMessageId === messageId) {
      try {
        TTSService.stopSpeaking();
        setPlayingMessageId(null);
        setIsSpeaking(false);
      } catch (e) {
        console.warn('TTS stop error', e);
      }
      return;
    }

    // Stop any other playing message first
    if (playingMessageId !== null) {
      try {
        TTSService.stopSpeaking();
      } catch (e) {
        console.warn('TTS stop error', e);
      }
    }

    // Start playing this message
    try {
      setPlayingMessageId(messageId);
      setIsSpeaking(true);
      await TTSService.speakText(content);
    } catch (e) {
      console.warn('TTS playback error', e);
    } finally {
      setPlayingMessageId(null);
      setIsSpeaking(false);
    }
  };

  const MessageBubble = ({ message }: { message: Message }) => (
    <div
      className={`flex gap-3 items-start ${
        message.role === "user" ? "justify-end" : "justify-start"
      } slideUpFade`}
      style={{ animationDelay: "0ms" }}
    >
      {message.role === "assistant" && (
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
          <Image
            src={logo}
            alt="Logo"
            className="w-7 h-7 object-contain"
            style={{ maxWidth: "100%" }}
          />
        </div>
      )}
      <div className="max-w-[80%]">
        {message.files && message.files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                onClick={() => handlePreviewFile(file)}
              >
                {getFileIcon(file.type)}
                <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  {file.name}
                </span>
                <Eye className="w-3 h-3 text-blue-500 ml-1" />
              </div>
            ))}
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm transition-colors max-w-full break-words ${
            message.role === "user"
              ? "bg-blue-100 text-blue-900 rounded-br-none self-end"
              : "bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none"
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {message.sources && message.sources.length > 0 && (
            <>
              <div className="mt-2 space-y-2">
                {message.sources.map((s, i) => (
                  <div key={i} className="flex flex-col gap-1 bg-white/50 dark:bg-gray-900/30 rounded-md p-2 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-start gap-2">
                      <div className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium">
                        {s.score ? s.score.toFixed(3) : "-"}
                      </div>
                      <div className="flex-1 text-xs text-gray-600 dark:text-gray-300 leading-snug break-words">
                        {s.text}
                      </div>
                      {s.pdf_url && (
                        <a 
                          href={s.pdf_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-shrink-0 p-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group"
                          title={`Ouvrir ${s.pdf_name || 'PDF'}`}
                        >
                          <FileIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300" />
                        </a>
                      )}
                    </div>
                    {s.pdf_name && (
                      <div className="flex items-center gap-1.5 text-xs ml-[52px]">
                        <FileText className="w-3 h-3 text-gray-400" />
                        {s.pdf_url ? (
                          <a 
                            href={s.pdf_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            {s.pdf_name}
                          </a>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 font-medium">{s.pdf_name}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Afficher tous les PDFs utilisés pour cette réponse */}
              {message.pdfMetadata && message.pdfMetadata.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">📚 Sources PDFs:</span>
                    {message.pdfMetadata.map((pdf, idx) => (
                      <a
                        key={idx}
                        href={pdf.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group"
                        title={`Ouvrir ${pdf.name}`}
                      >
                        <FileIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300" />
                        <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">{pdf.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {message.role === "assistant" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleTTSToggle(message.id, message.content)}
            className={`mt-2 h-8 w-8 rounded-full transition-all ${
              playingMessageId === message.id
                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/60"
                : "text-gray-500 dark:text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            title={playingMessageId === message.id ? "Stop speaking" : "Read aloud"}
            aria-label={playingMessageId === message.id ? "Stop speaking" : "Read aloud"}
          >
            {playingMessageId === message.id ? (
              <VolumeX className="h-4 w-4 animate-pulse" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      {message.role === "user" && (
        <div className="flex-shrink-0">
          <ProfileAvatar
            className={"w-7 h-7 rounded-full"}
            fallbackClassName={"rounded-full"}
            displayName={personalAccountData?.data?.name ?? userData?.email ?? ''}
            pictureUrl={personalAccountData?.data?.picture_url ?? null}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col min-h-0 bg-white dark:bg-gray-950 transition-colors">
      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 p-3 mx-4 mt-2 rounded-lg border border-red-300 dark:border-red-700 flex items-center justify-between">
          <p className="text-sm">❌ {error}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setError(null);
                requestAnimationFrame(() => {
                  scrollToBottom(false);
                  try {
                    textAreaRef.current?.focus();
                  } catch (e) {
                    console.warn('focus textarea failed', e);
                  }
                });
              }}
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded"
            >
              OK
            </button>
          </div>
        </div>
      )}
      
      {/* Zone de chat */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col scrollbar-hide min-h-0"
        style={{ paddingBottom: 160 }}
      >
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
          }
          .slideUpFade {
            animation: slideUpFade 220ms ease-out both;
          }
          @keyframes slideUpFade {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <div className="space-y-6">
          {[...messages]
            .filter((m) => m.id !== 1 || messages.length > 1)
            .map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Image src={logo} alt="Logo" width={24} height={24} />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-150"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-300"></div>
                </div>
              </div>
            </div>
          )}

          {messages.length === 1 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <Image src={logo} alt="Logo" width={80} height={80} />
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                How can I help you?
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                I am your SharingBot AI assistant, ready to help.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Zone d’entrée */}
      <div className="w-full p-4 border-t border-gray-200 dark:border-gray-800 sticky bottom-0 bg-white dark:bg-gray-900 z-10">
        <div className="max-w-3xl mx-auto">
          <Card className="rounded-3xl shadow-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 transition-colors">
            {/* Prévisualisation des fichiers attachés au-dessus du Textarea */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 transition-colors mb-2 rounded-md">
                  {attachedFiles.map((file, index) => (
                    <div
                      key={index}
                      onClick={() => handlePreviewFile(file)}
                      className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 rounded-full px-3 py-1.5 border border-blue-200 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300 font-medium group cursor-pointer transition-all hover:bg-blue-100 dark:hover:bg-blue-900/60"
                    >
                      {getFileIcon(file.type)}
                      <span className="truncate max-w-[140px]">{file.name}</span>
                      <Eye className="w-3 h-3 text-blue-500 opacity-80 group-hover:opacity-100 transition-opacity" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFile(index);
                                }}
                                className="ml-1 text-blue-400 dark:text-blue-500 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await runOCROnFile(file, index);
                                }}
                                className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-white transition-colors flex items-center gap-1"
                                title="Extraire le texte (OCR)"
                              >
                                {ocrRunningFor === index ? (
                                  <svg className="w-3 h-3 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                                ) : (
                                  <span className="text-[11px] font-medium">OCR</span>
                                )}
                              </button>
                    </div>
                  ))}
                </div>
              )}
            <div className="flex items-end gap-1 p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={triggerFileInput}
                className="h-9 w-9 text-gray-500 dark:text-gray-300 hover:text-blue-500"
              >
                <Paperclip className="h-5 w-5 rotate-45" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*,application/pdf"
                className="hidden"
              />
              <Textarea
                ref={textAreaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                  const t = e.currentTarget as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 240) + "px";
                }}
                placeholder="Écrire un message…"
                className="flex-1 resize-none min-h-12 max-h-60 border-none bg-transparent text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus-visible:ring-0"
              />
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleVoiceRecord}
                  disabled={isSpeaking}
                  aria-pressed={listening}
                  className={`h-9 w-9 rounded-full transition-colors flex items-center justify-center ${
                    listening
                      ? "text-red-600 bg-red-50 dark:bg-red-900/30 animate-pulse"
                    : "text-gray-500 dark:text-gray-300 hover:text-blue-500"
                }`}
                >
                  {listening ? (
                    <div className="relative">
                      <Mic className="h-5 w-5 text-red-600" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </div>
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
                
                {/* Recording indicator */}
                {listening && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg flex flex-col items-center gap-1 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      🗣️ Parlez maintenant...
                    </div>
                    {transcript && (
                      <div className="text-[10px] opacity-90 max-w-xs truncate bg-red-600/50 px-2 py-0.5 rounded">
                        "{transcript}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Button
                onClick={() => handleSend()}
                disabled={
                  (!input.trim() && attachedFiles.length === 0) || isTyping
                }
                size="icon"
                className="h-9 w-9 bg-blue-500 hover:bg-blue-600 rounded-full"
              >
                <ArrowUp className="h-5 w-5 text-white" />
              </Button>
            </div>

            <div className="flex items-center justify-center border-t border-gray-100 dark:border-gray-800 pt-1 px-1">
              <p className="text-center text-[10px] text-gray-400 dark:text-gray-600">
                AI-generated, for reference only
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Panneau de Prévisualisation (Sheet) */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {fileToPreview
                ? `Vérification du fichier : ${fileToPreview.name}`
                : "Aperçu du Fichier"}
            </SheetTitle>
          </SheetHeader>

          {fileToPreview && (
            <div className="mt-6 flex flex-col items-center justify-center h-[90%]">
              {fileToPreview.type === "image" ? (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    Image : {fileToPreview.name}
                  </p>
                  <Image
                    src={fileToPreview.url}
                    alt={fileToPreview.name}
                    className="max-w-full max-h-96 object-contain"
                    width={400}
                    height={300}
                  />
                </>
              ) : fileToPreview.type === "application" &&
                fileToPreview.name.toLowerCase().endsWith(".pdf") ? (
                <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                  <FileText className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <p className="text-lg font-medium text-gray-800">
                    Fichier PDF : {fileToPreview.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Le rendu direct peut être instable. Cliquez pour ouvrir dans
                    un nouvel onglet.
                  </p>
                  <Button asChild className="mt-4 bg-red-500 hover:bg-red-600">
                    <a
                      href={fileToPreview.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ouvrir le PDF
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <FileIcon className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                  <p className="text-lg font-medium text-gray-800">
                    Fichier non prévisualisable : {fileToPreview.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Format non supporté pour un aperçu intégré.
                  </p>
                </div>
              )}
            </div>
          )}
          {fileToPreview && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button
                onClick={async () => {
                  if (sheetOcrRunning) return;
                  await handleSheetSendOCR(true);
                }}
                disabled={sheetOcrRunning}
                variant="outline"
              >
                {sheetOcrRunning ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                ) : (
                  'Insérer le texte OCR'
                )}
              </Button>
              <Button
                onClick={async () => {
                  if (sheetOcrRunning) return;
                  await handleSheetSendOCR(false);
                }}
                disabled={sheetOcrRunning}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {sheetOcrRunning ? 'Traitement...' : 'Envoyer (OCR + input)'}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
