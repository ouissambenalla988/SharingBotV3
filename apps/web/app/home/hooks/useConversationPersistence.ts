import { useState, useEffect, useCallback } from 'react';
import type { Message as DBMessage } from '../../types/database.types';
import { getMessages, addMessage } from '../../lib/supabase/conversations';

export interface UseConversationPersistenceProps {
  conversationId: string | null;
  enabled?: boolean;
}

export function useConversationPersistence({
  conversationId,
  enabled = true,
}: UseConversationPersistenceProps) {
  const [storedMessages, setStoredMessages] = useState<DBMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (!conversationId || !enabled) {
      setStoredMessages([]);
      return;
    }

    loadMessages();
  }, [conversationId, enabled]);

  const loadMessages = async () => {
    if (!conversationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const messages = await getMessages(conversationId);
      setStoredMessages(messages);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Erreur lors du chargement des messages');
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessage = useCallback(
    async (role: 'user' | 'assistant' | 'system', content: string) => {
      if (!conversationId || !enabled) return null;

      try {
        const message = await addMessage(conversationId, role, content);
        if (message) {
          setStoredMessages((prev) => [...prev, message]);
        }
        return message;
      } catch (err) {
        console.error('Error saving message:', err);
        setError('Erreur lors de la sauvegarde du message');
        return null;
      }
    },
    [conversationId, enabled]
  );

  const clearMessages = useCallback(() => {
    setStoredMessages([]);
  }, []);

  return {
    storedMessages,
    isLoading,
    error,
    saveMessage,
    loadMessages,
    clearMessages,
  };
}
