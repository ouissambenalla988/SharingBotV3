"use client";

import React, { useState, useEffect } from 'react';
import { DashBoardChat } from './dashBoard-chat';
import { ConversationSidebar } from './ConversationSidebar';
import { useUser } from '@kit/supabase/hooks/use-user';
import type { Conversation } from '../../types/database.types';
import type { Message as DBMessage } from '../../types/database.types';
import {
  createConversation,
  getConversations,
  getMessages,
  addMessage,
} from '../../lib/supabase/conversations';
import {
  getAllAccessibleDocuments,
  uploadDocument,
} from '../../lib/supabase/documents';

export function ChatWithHistory() {
  const { data: userData } = useUser();
  const userId = userData?.id;

  console.log('ChatWithHistory - User data:', { userId, userData });

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Load conversations on mount
  useEffect(() => {
    console.log('ChatWithHistory useEffect - userId:', userId);
    if (userId) {
      loadConversations();
    } else {
      setIsLoadingConversations(false);
    }
  }, [userId]);

  const loadConversations = async () => {
    if (!userId) {
      console.error('loadConversations called without userId');
      return;
    }
    
    console.log('Loading conversations for user:', userId);
    setIsLoadingConversations(true);
    const convs = await getConversations(userId);
    console.log('Loaded conversations:', convs);
    setConversations(convs);
    
    // If no conversation exists, create one
    if (convs.length === 0) {
      console.log('No conversations found, creating default one');
      const newConv = await createConversation(userId);
      if (newConv) {
        console.log('Default conversation created:', newConv);
        setConversations([newConv]);
        setCurrentConversationId(newConv.id);
      } else {
        console.error('Failed to create default conversation');
      }
    } else {
      // Select the most recent conversation
      if (convs[0]) {
        setCurrentConversationId(convs[0].id);
      }
    }
    
    setIsLoadingConversations(false);
  };

  const handleNewConversation = async () => {
    if (!userId) return;
    
    const newConv = await createConversation(userId, 'Nouvelle conversation');
    if (newConv) {
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const handleConversationDeleted = (conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    
    // If deleted conversation was selected, select another one or create new
    if (currentConversationId === conversationId) {
      const remaining = conversations.filter((c) => c.id !== conversationId);
      if (remaining.length > 0 && remaining[0]) {
        setCurrentConversationId(remaining[0].id);
      } else {
        handleNewConversation();
      }
    }
  };

  if (!userId) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500">Veuillez vous connecter pour utiliser le chat</p>
      </div>
    );
  }

  if (isLoadingConversations) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden flex-shrink-0`}>
        <ConversationSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onConversationDeleted={handleConversationDeleted}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 relative">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 z-10 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          aria-label={isSidebarOpen ? 'Masquer l\'historique' : 'Afficher l\'historique'}
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Chat Component */}
        {currentConversationId && (
          <DashBoardChatWithPersistence
            conversationId={currentConversationId}
            userId={userId}
          />
        )}
      </div>
    </div>
  );
}

// Wrapper for DashBoardChat that handles Supabase persistence
interface DashBoardChatWithPersistenceProps {
  conversationId: string;
  userId: string;
}

function DashBoardChatWithPersistence({
  conversationId,
  userId,
}: DashBoardChatWithPersistenceProps) {
  // This would need to be integrated into the existing DashBoardChat component
  // For now, we just render it as-is
  return <DashBoardChat />;
}
