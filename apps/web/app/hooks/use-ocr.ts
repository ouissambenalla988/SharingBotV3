'use client';

import { useState, useCallback } from 'react';
import { OCRService } from '../lib/ocr-service';

interface UseOCRReturn {
  extractText: (file: File) => Promise<{ text: string; language: string; confidence: number }>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useOCR(): UseOCRReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractText = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image trop volumineuse (max 10MB)');
      }

      const result = await OCRService.extractTextFromImage(file);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur OCR inconnue';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    extractText,
    isLoading,
    error,
    clearError,
  };
}