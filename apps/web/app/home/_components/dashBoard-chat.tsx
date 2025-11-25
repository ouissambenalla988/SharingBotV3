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
  File,
  Eye,
} from "lucide-react";

import { ASRService } from "../../lib/asr-service";
import { TTSService } from "../../lib/tts-service";
import { OCRService } from "../../lib/ocr-service";
import { ProfileAvatar } from '@kit/ui/profile-avatar';
import { useUser } from '@kit/supabase/hooks/use-user';
import { usePersonalAccountData } from '@kit/accounts/hooks/use-personal-account-data';

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
  sources?: Array<{ text: string; score?: number; length?: number }>;
}

export function DashBoardChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I am SharingBot AI assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
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

  const { data: userData } = useUser();
  const personalAccountData = usePersonalAccountData(userData?.id ?? '');

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
      console.warn('ASRService init failed', e);
      asrServiceRef.current = null;
    }

    return () => {
      try {
        asrServiceRef.current?.cleanup();
        } catch (e) {
          console.warn('focus textarea failed', e);
        }
    };
  }, []);

  // TTS speaking state is managed per-utterance via TTSService Promise

  const handleSend = async (messageTextParam?: string) => {
    const messageText = typeof messageTextParam === 'string' ? messageTextParam : input;
    if (!messageText.trim() && attachedFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      files: [...attachedFiles],
    };

    // Immediately show the user's message in the UI
    setMessages((prev) => [...prev, userMessage]);
    lastUserRef.current = userMessage;
    // clear the input and attached files for UX
    setInput('');
    setAttachedFiles([]);
    setIsTyping(true);

    // focus textarea and move caret to end
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
      const apiUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'http://127.0.0.1:8000/ask';
      const isPlainTextApi = apiUrl.includes('/ask');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: isPlainTextApi
          ? { 'Content-Type': 'text/plain' }
          : { 'Content-Type': 'application/json' },
        body: isPlainTextApi ? userMessage.content : JSON.stringify({ message: userMessage.content, files: attachedFiles }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const botMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.answer || data.response || 'No response received from API',
        sources: Array.isArray(data.sources)
          ? data.sources.map((s: unknown) => {
              if (typeof s === 'string') return { text: s, score: undefined };
              if (s && typeof s === 'object') {
                const obj = s as Record<string, unknown>;
                const text = typeof obj['text'] === 'string' ? (obj['text'] as string) : JSON.stringify(obj);
                const score = typeof obj['score'] === 'number' ? (obj['score'] as number) : undefined;
                return { text, score };
              }
              return { text: String(s), score: undefined };
            })
          : undefined,
      };
      setMessages((prev) => [...prev, botMessage]);

      // ensure view is positioned on the new assistant response (jump)
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

      // Play TTS for assistant response (after we have the message)
      try {
        setIsSpeaking(true);
        TTSService.speakText(botMessage.content)
          .catch(() => {})
          .finally(() => setIsSpeaking(false));
      } catch (e) {
        console.warn('TTS error', e);
        setIsSpeaking(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get response from API';
      setError(errorMsg);
      // ensure user sees the alert and the input is focused so they can retry
      requestAnimationFrame(() => {
        scrollToBottom(false);
        try {
          textAreaRef.current?.focus();
        } catch (e) {
          console.warn('focus textarea failed', e);
        }
      });
    } finally {
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
    if (!asrServiceRef.current) {
      setError('Service vocal non initialisé');
      return;
    }

    if (!isRecording) {
      try {
        await asrServiceRef.current.startRecording();
        setIsRecording(true);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg || "Erreur d'enregistrement");
      }
    } else {
      try {
        setIsRecording(false);
        const transcription = await asrServiceRef.current.stopAndTranscribe();
        if (transcription && transcription.text) {
          setInput((prev) => (prev ? `${prev} ${transcription.text}` : transcription.text));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg || 'Erreur lors de la transcription');
      }
    }
  };

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
    return <File className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
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
            <div className="mt-2 space-y-2">
              {message.sources.map((s, i) => (
                <div key={i} className="flex items-start gap-2 bg-white/50 dark:bg-gray-900/30 rounded-md p-2 border border-gray-100 dark:border-gray-800">
                  <div className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium">
                    {s.score ? s.score.toFixed(3) : "-"}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 leading-snug max-w-[60ch] break-words">
                    {s.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
                ref={(el: HTMLTextAreaElement | null) => (textAreaRef.current = el)}
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
              <Button
                variant="ghost"
                size="icon"
                onClick={handleVoiceRecord}
                disabled={isSpeaking}
                aria-pressed={isRecording}
                className={`h-9 w-9 rounded-full transition-colors flex items-center justify-center ${
                  isRecording
                    ? "text-red-600 bg-red-50 dark:bg-red-900/30"
                    : "text-gray-500 dark:text-gray-300 hover:text-blue-500"
                }`}
              >
                {isRecording ? (
                  <div className="relative">
                    <Mic className="h-5 w-5 text-red-600" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  </div>
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
              <Button
                onClick={handleSend}
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
                  <File className="w-10 h-10 text-gray-500 mx-auto mb-3" />
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
